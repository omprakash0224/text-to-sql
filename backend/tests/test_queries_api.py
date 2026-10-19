"""
DataSpeak Backend — Query API Integration Tests
Tests endpoint POST /api/v1/queries/ask for auth protection, tenant connection check,
end-to-end question answering against the demo database, and guardrail blocking.
"""

from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from app.agent.llm import default_llm_client
from app.db.sample_data import get_sample_db_path
from main import app


@pytest.fixture
def client():
    """Test client for FastAPI app."""
    return TestClient(app)


def test_ask_query_unauthenticated(client):
    """Requests without a Clerk Bearer JWT must be rejected with 401."""
    resp = client.post("/api/v1/queries/ask", json={"question": "Show all users"})
    assert resp.status_code == 401


def test_ask_query_no_connection(client):
    """Authenticated request when no database connection is active returns 400."""
    headers = {"Authorization": "Bearer dev_user_no_conn"}
    resp = client.post(
        "/api/v1/queries/ask",
        json={"question": "What is total revenue?"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "No active database connection found" in resp.json()["detail"]


def test_ask_query_blank_question_validation(client):
    """Blank or whitespace-only questions must fail Pydantic validation with 422."""
    headers = {"Authorization": "Bearer dev_user_validation"}
    resp = client.post(
        "/api/v1/queries/ask",
        json={"question": "   "},
        headers=headers,
    )
    assert resp.status_code == 422


def test_ask_query_success_with_sample_db(client):
    """
    Connect to sample e-commerce database, ask a natural language query,
    and verify structured SQL, columns, rows, chart recommendation, and summary.
    """
    headers = {"Authorization": "Bearer dev_user_query_success"}

    # 1. Connect to demo SQLite database
    conn_payload = {
        "name": "Demo E-Commerce Store",
        "is_sample_db": True,
    }
    conn_resp = client.post("/api/v1/connections/connect", json=conn_payload, headers=headers)
    assert conn_resp.status_code == 200
    assert conn_resp.json()["table_count"] > 0

    # 2. Mock LLM to return top 5 products by price
    def mock_llm(msgs):
        return (
            "```sql\n"
            "SELECT name, price FROM products ORDER BY price DESC LIMIT 5;\n"
            "```"
        )

    default_llm_client.set_mock_handler(mock_llm)

    try:
        # 3. Post question to /api/v1/queries/ask
        query_payload = {"question": "What are the top 5 most expensive products?"}
        resp = client.post("/api/v1/queries/ask", json=query_payload, headers=headers)

        assert resp.status_code == 200
        data = resp.json()

        assert data["status"] == "success"
        assert "SELECT" in data["sql"]
        assert "LIMIT" in data["sql"]
        assert data["columns"] == ["name", "price"]
        assert len(data["rows"]) == 5
        assert data["row_count"] == 5
        assert data["execution_time_ms"] >= 0.0

        # Verify Chart Config
        assert data["chart"] is not None
        assert data["chart"]["type"] in ("bar", "pie", "line")
        assert data["chart"]["y_key"] == "price"

        # Verify Summary
        assert len(data["summary"]) > 0
        assert data["error_message"] is None

    finally:
        default_llm_client.set_mock_handler(None)
        # Clean up connection
        client.post("/api/v1/connections/disconnect", headers=headers)


def test_ask_query_security_block(client):
    """
    Verify that if the LLM produces a forbidden mutation statement (e.g. DELETE),
    the endpoint returns status='blocked' with an error message and zero rows.
    """
    headers = {"Authorization": "Bearer dev_user_query_blocked"}

    # 1. Connect to sample DB
    client.post("/api/v1/connections/connect", json={"is_sample_db": True}, headers=headers)

    # 2. Mock LLM to output a malicious DELETE statement
    default_llm_client.set_mock_handler(lambda msgs: "```sql\nDELETE FROM customers;\n```")

    try:
        query_payload = {"question": "Delete all customers from database"}
        resp = client.post("/api/v1/queries/ask", json=query_payload, headers=headers)

        assert resp.status_code == 200
        data = resp.json()

        assert data["status"] == "blocked"
        assert data["row_count"] == 0
        assert data["rows"] == []
        assert "Security Policy Violation" in data["error_message"]

    finally:
        default_llm_client.set_mock_handler(None)
        client.post("/api/v1/connections/disconnect", headers=headers)
