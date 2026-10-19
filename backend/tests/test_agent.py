"""
DataSpeak Backend — Agent & Guardrail Unit Tests
Tests LLM extraction, chart heuristics, summary services, QueryExecutor,
and LangGraph workflow self-correction and guardrail enforcement.
"""

from __future__ import annotations

import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine

from app.agent.graph import (
    agent_app,
    extract_sql_from_text,
)
from app.agent.llm import default_llm_client
from app.db.executor import QueryExecutionError, QueryExecutor, sanitize_db_error_message
from app.db.sample_data import create_sample_database
from app.services.chart_service import chart_service
from app.services.summary_service import summary_service


# ── 1. SQL Extraction Tests ──────────────────────────────────────────────────

def test_extract_sql_with_markdown_fence():
    text = "```sql\nSELECT * FROM customers WHERE id = 1;\n```"
    assert extract_sql_from_text(text) == "SELECT * FROM customers WHERE id = 1;"


def test_extract_sql_with_generic_fence():
    text = "```\nSELECT name, price FROM products;\n```"
    assert extract_sql_from_text(text) == "SELECT name, price FROM products;"


def test_extract_sql_plain_string():
    text = "SELECT count(*) FROM orders"
    assert extract_sql_from_text(text) == "SELECT count(*) FROM orders"


# ── 2. Chart Recommendation Heuristic Tests ──────────────────────────────────

def test_chart_recommender_empty_dataset():
    res = chart_service.recommend_chart(columns=["id", "name"], rows=[])
    assert res.type == "none"


def test_chart_recommender_single_row():
    res = chart_service.recommend_chart(columns=["total_revenue"], rows=[{"total_revenue": 15000.0}])
    assert res.type == "none"


def test_chart_recommender_temporal_line_chart():
    cols = ["order_date", "daily_revenue"]
    rows = [
        {"order_date": "2026-01-01", "daily_revenue": 1200.50},
        {"order_date": "2026-01-02", "daily_revenue": 1450.00},
        {"order_date": "2026-01-03", "daily_revenue": 1100.20},
    ]
    res = chart_service.recommend_chart(columns=cols, rows=rows)
    assert res.type == "line"
    assert res.x_key == "order_date"
    assert res.y_key == "daily_revenue"


def test_chart_recommender_pie_chart():
    cols = ["status", "count"]
    rows = [
        {"status": "delivered", "count": 45},
        {"status": "shipped", "count": 20},
        {"status": "pending", "count": 10},
    ]
    res = chart_service.recommend_chart(columns=cols, rows=rows, user_question="What is the distribution of orders?")
    assert res.type == "pie"
    assert res.x_key == "status"
    assert res.y_key == "count"


def test_chart_recommender_bar_chart():
    cols = ["product_name", "units_sold"]
    rows = [
        {"product_name": f"Product {i}", "units_sold": 100 - i * 5}
        for i in range(10)
    ]
    res = chart_service.recommend_chart(columns=cols, rows=rows, user_question="Top products by sales")
    assert res.type == "bar"
    assert res.x_key == "product_name"
    assert res.y_key == "units_sold"


# ── 3. Summary Service Tests ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_summary_empty_results():
    summary = await summary_service.generate_summary(
        user_question="How many users signed up today?",
        columns=["user_id"],
        rows=[],
    )
    assert "No matching records were found" in summary


@pytest.mark.asyncio
async def test_summary_single_scalar():
    summary = await summary_service.generate_summary(
        user_question="Total customers count",
        columns=["customer_count"],
        rows=[{"customer_count": 42}],
    )
    assert "Customer Count is 42" in summary


# ── 4. Query Executor Tests ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_query_executor_success(tmp_path):
    db_file = tmp_path / "test_exec.db"
    create_sample_database(str(db_file))

    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    try:
        cols, rows, elapsed = await QueryExecutor.execute_query(
            engine=engine,
            sql="SELECT name, price FROM products ORDER BY price DESC LIMIT 3",
            dialect="sqlite",
        )
        assert cols == ["name", "price"]
        assert len(rows) == 3
        assert elapsed >= 0.0
        assert "price" in rows[0]
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_query_executor_invalid_column(tmp_path):
    db_file = tmp_path / "test_invalid.db"
    create_sample_database(str(db_file))

    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    try:
        with pytest.raises(QueryExecutionError) as exc_info:
            await QueryExecutor.execute_query(
                engine=engine,
                sql="SELECT nonexistent_col FROM products",
                dialect="sqlite",
            )
        assert "no such column: nonexistent_col" in exc_info.value.message.lower()
    finally:
        await engine.dispose()


def test_sanitize_db_error_message():
    raw_error = Exception("(sqlite3.OperationalError) no such column: abc [SQL: SELECT abc FROM xyz]")
    cleaned = sanitize_db_error_message(raw_error)
    assert "no such column: abc" in cleaned
    assert "[SQL:" not in cleaned


# ── 5. LangGraph Self-Correction & Guardrail Security Tests ───────────────────

@pytest.mark.asyncio
async def test_agent_graph_security_block(tmp_path):
    """
    Test zero-tolerance security block:
    When LLM produces a forbidden mutation statement (e.g. DROP TABLE),
    the guardrail immediately terminates with status="blocked" and 0 retries.
    """
    db_file = tmp_path / "test_guardrail.db"
    create_sample_database(str(db_file))
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")

    # Set mock LLM to return a forbidden DROP statement
    default_llm_client.set_mock_handler(lambda msgs: "```sql\nDROP TABLE customers;\n```")

    try:
        state = {
            "user_question": "Drop all customer records",
            "dialect": "sqlite",
            "schema_prompt": "Table: customers (id, email)",
            "engine": engine,
        }
        res = await agent_app.ainvoke(state)

        assert res.get("status") == "blocked"
        assert "Security Policy Violation" in res.get("fatal_error", "")
        # Zero retries: must NOT loop on security violations
        assert res.get("retry_count", 0) == 0
    finally:
        default_llm_client.set_mock_handler(None)
        await engine.dispose()


@pytest.mark.asyncio
async def test_agent_graph_self_correction_syntax(tmp_path):
    """
    Test self-correction loop on syntax error:
    Attempt 1 produces invalid SQL syntax ("SELECT FROM WHERE"),
    Attempt 2 corrects to valid SQL ("SELECT * FROM customers LIMIT 5").
    """
    db_file = tmp_path / "test_correction.db"
    create_sample_database(str(db_file))
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")

    calls = 0

    def mock_correcting_llm(msgs):
        nonlocal calls
        calls += 1
        # First call produces invalid syntax
        if calls == 1:
            return "```sql\nSELECT FROM WHERE;\n```"
        # Second call repairs the query
        return "```sql\nSELECT id, first_name, email FROM customers LIMIT 5;\n```"

    default_llm_client.set_mock_handler(mock_correcting_llm)

    try:
        state = {
            "user_question": "Show me top customers",
            "dialect": "sqlite",
            "schema_prompt": "Table: customers (id, first_name, email)",
            "engine": engine,
        }
        res = await agent_app.ainvoke(state)

        assert res.get("status") == "success"
        assert res.get("row_count") == 5
        assert res.get("retry_count") == 1  # Successfully repaired on retry 1
        assert len(res.get("rows", [])) == 5
    finally:
        default_llm_client.set_mock_handler(None)
        await engine.dispose()


@pytest.mark.asyncio
async def test_agent_graph_max_retries_cap(tmp_path):
    """
    Test that self-correction halts after reaching the hard cap of 2 retry attempts.
    """
    db_file = tmp_path / "test_retries.db"
    create_sample_database(str(db_file))
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_file}")

    # LLM always produces broken syntax
    default_llm_client.set_mock_handler(lambda msgs: "```sql\nBROKEN SYNTAX @#$%;\n```")

    try:
        state = {
            "user_question": "Show me something",
            "dialect": "sqlite",
            "schema_prompt": "Table: customers (id)",
            "engine": engine,
        }
        res = await agent_app.ainvoke(state)

        assert res.get("status") == "error"
        assert res.get("retry_count") >= 2
        assert "SQL Syntax Error" in res.get("fatal_error", "")
    finally:
        default_llm_client.set_mock_handler(None)
        await engine.dispose()
