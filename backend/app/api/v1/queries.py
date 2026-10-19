"""
DataSpeak Backend — Queries API Router
Exposes natural language query endpoints orchestrating LangGraph Text-to-SQL execution.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.agent.graph import agent_app
from app.core.auth import get_current_user
from app.core.logging import get_logger
from app.db.session_manager import session_manager
from app.models.query import (
    ChartConfigResponse,
    QueryAskRequest,
    QueryAskResponse,
)
from app.models.user import AuthenticatedUser

logger = get_logger("api.v1.queries")

router = APIRouter(prefix="/queries", tags=["queries"])


@router.post(
    "/ask",
    response_model=QueryAskResponse,
    summary="Process natural language question and return SQL, results, chart, and summary",
)
async def ask_query(
    payload: QueryAskRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> QueryAskResponse:
    """
    Translates a plain-English question into dialect-specific SQL, validates guardrails,
    executes against the user's active database connection, and returns data with
    automated chart recommendations and narrative summary.
    """
    user_id = current_user.user_id
    logger.info("Received query request", user_id=user_id, question=payload.question)

    # 1. Tenant session check
    session = session_manager.get_session(user_id)
    if not session:
        logger.warn("Query attempt with no active database session", user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active database connection found. Please connect to a database first.",
        )

    # 2. Prepare initial state for LangGraph agent
    initial_state = {
        "user_question": payload.question,
        "dialect": session.schema.dialect,
        "schema_prompt": session.schema.summary_prompt,
        "engine": session.engine,
    }

    # 3. Execute LangGraph workflow
    try:
        final_state = await agent_app.ainvoke(initial_state)
    except Exception as exc:
        logger.error("LangGraph workflow error", error=str(exc), user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query orchestration failed: {str(exc)}",
        ) from exc

    # 4. Check for guardrail security blocks
    if final_state.get("status") == "blocked":
        return QueryAskResponse(
            sql=final_state.get("generated_sql", ""),
            columns=[],
            rows=[],
            row_count=0,
            execution_time_ms=0.0,
            chart=ChartConfigResponse(type="none"),
            summary="This query was blocked because it violates the zero-trust read-only policy.",
            status="blocked",
            error_message=final_state.get("fatal_error") or "Operation prohibited by security guardrails.",
        )

    # 5. Check for unrecoverable errors (syntax or db error after max retries)
    if final_state.get("status") == "error":
        return QueryAskResponse(
            sql=final_state.get("generated_sql", ""),
            columns=[],
            rows=[],
            row_count=0,
            execution_time_ms=0.0,
            chart=ChartConfigResponse(type="none"),
            summary="We were unable to process this query against the current database schema.",
            status="error",
            error_message=final_state.get("fatal_error") or final_state.get("error_message"),
        )

    # 6. Parse chart recommendation
    chart_config = None
    if final_state.get("chart"):
        chart_data = final_state["chart"]
        chart_config = ChartConfigResponse(
            type=chart_data.get("type", "none"),
            x_key=chart_data.get("x_key"),
            y_key=chart_data.get("y_key"),
            title=chart_data.get("title"),
        )

    return QueryAskResponse(
        sql=final_state.get("sanitized_sql") or final_state.get("generated_sql", ""),
        columns=final_state.get("columns", []),
        rows=final_state.get("rows", []),
        row_count=final_state.get("row_count", 0),
        execution_time_ms=final_state.get("execution_time_ms", 0.0),
        chart=chart_config,
        summary=final_state.get("summary", ""),
        status="success",
        error_message=None,
    )
