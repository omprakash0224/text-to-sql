"""
DataSpeak Backend — LangGraph Agent Workflow
Stateful multi-node workflow orchestrating natural language query processing,
sqlglot AST guardrail validation, automated self-correction loops, safe database
execution, and insight generation.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

from langgraph.graph import END, StateGraph

from app.agent.llm import LLMClient, default_llm_client
from app.agent.prompts import (
    SQL_GENERATION_SYSTEM_PROMPT,
    SQL_SELF_CORRECTION_SYSTEM_PROMPT,
)
from app.agent.state import AgentState
from app.core.logging import get_logger
from app.db.executor import QueryExecutionError, QueryExecutor
from app.guardrails.sanitizer import validate_and_sanitize_sql
from app.guardrails.validator import (
    ForbiddenStatementError,
    MultiStatementError,
)
from app.services.chart_service import chart_service
from app.services.summary_service import summary_service

logger = get_logger("agent.graph")


def extract_sql_from_text(text: Optional[str]) -> str:
    """
    Extracts raw SQL from markdown code fences or returns trimmed text.
    Handles ```sql ... ``` or ``` ... ``` wrappers. Safely handles None and empty input.
    """
    if not text:
        return ""
    clean = str(text).strip()
    match = re.search(r"```(?:sql)?\s*([\s\S]*?)\s*```", clean, re.IGNORECASE)
    if match:
        clean = match.group(1).strip()
    return clean


# ── Graph Node Implementations ───────────────────────────────────────────────

async def generate_sql_node(state: AgentState) -> Dict[str, Any]:
    """
    Constructs prompt with schema context and generates dialect-specific SQL.
    """
    user_question = state.get("user_question", "")
    dialect = state.get("dialect", "sqlite")
    schema_prompt = state.get("schema_prompt", "")

    logger.info("Generating SQL from question", dialect=dialect, question=user_question)

    prompt = SQL_GENERATION_SYSTEM_PROMPT.format(
        dialect=dialect.upper(),
        schema_prompt=schema_prompt,
    )

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": user_question},
    ]

    llm_output = await default_llm_client.ainvoke(messages, temperature=0.0)
    sql = extract_sql_from_text(llm_output)

    return {
        "generated_sql": sql,
        "retry_count": 0,
        "is_valid": False,
        "error_message": None,
        "fatal_error": None,
    }


async def validate_guardrails_node(state: AgentState) -> Dict[str, Any]:
    """
    Validates SQL using sqlglot AST analysis and applies row limits.
    Blocks forbidden statements immediately (0 retries).
    """
    sql = state.get("generated_sql", "")
    dialect = state.get("dialect", "sqlite")
    current_retry = state.get("retry_count", 0)

    logger.debug("Validating SQL guardrails", sql=sql, dialect=dialect, retry=current_retry)

    result = validate_and_sanitize_sql(sql=sql, dialect=dialect)

    if result.is_valid and result.sanitized_sql:
        return {
            "is_valid": True,
            "sanitized_sql": result.sanitized_sql,
            "error_message": None,
            "fatal_error": None,
        }

    # If forbidden mutation or DDL statement detected: FATAL security violation
    if result.error_code in ("FORBIDDEN_STATEMENT", "MULTI_STATEMENT_DETECTED"):
        logger.warn("Security violation in generated SQL", error=result.error_message, sql=sql)
        return {
            "is_valid": False,
            "fatal_error": f"Security Policy Violation: {result.error_message}",
            "status": "blocked",
            "error_message": result.error_message,
        }

    # Syntax or parse error: qualify for self-correction if retry_count < 2
    new_retry = current_retry + 1
    logger.info("SQL syntax validation failed", error=result.error_message, retry=new_retry)

    if new_retry > 2:
        return {
            "is_valid": False,
            "retry_count": new_retry,
            "fatal_error": f"SQL Syntax Error: {result.error_message}",
            "status": "error",
            "error_message": result.error_message,
        }

    return {
        "is_valid": False,
        "retry_count": new_retry,
        "error_message": result.error_message,
    }


async def self_correct_sql_node(state: AgentState) -> Dict[str, Any]:
    """
    Feeds validation or execution error back into LLM to repair SQL.
    """
    dialect = state.get("dialect", "sqlite")
    schema_prompt = state.get("schema_prompt", "")
    user_question = state.get("user_question", "")
    failed_sql = state.get("generated_sql", "")
    error_message = state.get("error_message", "Unknown SQL error")
    retry = state.get("retry_count", 1)

    logger.info("Executing self-correction loop", retry=retry, error=error_message)

    prompt = SQL_SELF_CORRECTION_SYSTEM_PROMPT.format(
        dialect=dialect.upper(),
        schema_prompt=schema_prompt,
        user_question=user_question,
        failed_sql=failed_sql,
        error_message=error_message,
    )

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": "Please rewrite and correct the SQL query."},
    ]

    llm_output = await default_llm_client.ainvoke(messages, temperature=0.0)
    corrected_sql = extract_sql_from_text(llm_output)

    return {
        "generated_sql": corrected_sql,
    }


async def execute_query_node(state: AgentState) -> Dict[str, Any]:
    """
    Executes validated read-only SQL with strict timeouts and transaction rollbacks.
    """
    engine = state.get("engine")
    sql = state.get("sanitized_sql", "")
    dialect = state.get("dialect", "sqlite")
    current_retry = state.get("retry_count", 0)

    if not engine:
        return {
            "status": "error",
            "fatal_error": "No database engine available for execution.",
        }

    try:
        cols, rows, elapsed_ms = await QueryExecutor.execute_query(
            engine=engine,
            sql=sql,
            dialect=dialect,
        )
        return {
            "columns": cols,
            "rows": rows,
            "row_count": len(rows),
            "execution_time_ms": elapsed_ms,
            "status": "success",
            "error_message": None,
            "fatal_error": None,
        }
    except QueryExecutionError as exc:
        new_retry = current_retry + 1
        logger.warn("Query execution error on engine", error=exc.message, retry=new_retry)

        if new_retry <= 2:
            return {
                "retry_count": new_retry,
                "error_message": exc.message,
                "is_valid": False,
            }

        return {
            "retry_count": new_retry,
            "status": "error",
            "fatal_error": exc.message,
            "error_message": exc.message,
        }


async def generate_insights_node(state: AgentState) -> Dict[str, Any]:
    """
    Recommends chart visualization format and generates plain-English summary.
    """
    columns = state.get("columns", [])
    rows = state.get("rows", [])
    user_question = state.get("user_question", "")

    # 1. Chart Recommendation
    chart_config = chart_service.recommend_chart(
        columns=columns,
        rows=rows,
        user_question=user_question,
    )

    # 2. Plain-English Summary
    summary_text = await summary_service.generate_summary(
        user_question=user_question,
        columns=columns,
        rows=rows,
        llm=default_llm_client,
    )

    return {
        "chart": chart_config.model_dump(),
        "summary": summary_text,
    }


# ── Conditional Routing Functions ────────────────────────────────────────────

def route_after_validation(state: AgentState) -> str:
    """Route after guardrail check."""
    if state.get("fatal_error") or state.get("status") in ("blocked", "error"):
        return END

    if not state.get("is_valid", False):
        if state.get("retry_count", 0) <= 2:
            return "self_correct_sql"
        return END

    return "execute_query"


def route_after_execution(state: AgentState) -> str:
    """Route after query execution attempt."""
    if state.get("status") == "success":
        return "generate_insights"

    if state.get("retry_count", 0) <= 2 and state.get("error_message"):
        return "self_correct_sql"

    return END


# ── Workflow Compilation ─────────────────────────────────────────────────────

def build_agent_graph() -> Any:
    """Constructs and compiles the DataSpeak LangGraph state machine."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("generate_sql", generate_sql_node)
    workflow.add_node("validate_guardrails", validate_guardrails_node)
    workflow.add_node("self_correct_sql", self_correct_sql_node)
    workflow.add_node("execute_query", execute_query_node)
    workflow.add_node("generate_insights", generate_insights_node)

    # Entry point
    workflow.set_entry_point("generate_sql")

    # Transitions
    workflow.add_edge("generate_sql", "validate_guardrails")

    workflow.add_conditional_edges(
        "validate_guardrails",
        route_after_validation,
        {
            "execute_query": "execute_query",
            "self_correct_sql": "self_correct_sql",
            END: END,
        },
    )

    workflow.add_edge("self_correct_sql", "validate_guardrails")

    workflow.add_conditional_edges(
        "execute_query",
        route_after_execution,
        {
            "generate_insights": "generate_insights",
            "self_correct_sql": "self_correct_sql",
            END: END,
        },
    )

    workflow.add_edge("generate_insights", END)

    return workflow.compile()


# Compiled agent graph singleton
agent_app = build_agent_graph()
