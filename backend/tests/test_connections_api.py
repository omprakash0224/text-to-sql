"""
DataSpeak Backend — Connection & Schema Endpoints Integration Tests
Validates authentication enforcement, connection testing, connection lifecycle,
schema extraction, and multi-tenant session isolation.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app
from app.db.session_manager import session_manager


@pytest.fixture(autouse=True)
def cleanup_sessions():
    """Ensure in-memory sessions are cleared before and after each test."""
    import asyncio
    asyncio.run(session_manager.dispose_all_sessions())
    yield
    asyncio.run(session_manager.dispose_all_sessions())


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


def test_unauthenticated_requests_return_401(client):
    """Requests without Clerk Bearer token must receive 401 Unauthorized."""
    # Test connection endpoint
    res1 = client.post("/api/v1/connections/test", json={"is_sample_db": True})
    assert res1.status_code == 401

    # Connect endpoint
    res2 = client.post("/api/v1/connections/connect", json={"is_sample_db": True})
    assert res2.status_code == 401

    # Current connection endpoint
    res3 = client.get("/api/v1/connections/current")
    assert res3.status_code == 401

    # Schema endpoint
    res4 = client.get("/api/v1/schema")
    assert res4.status_code == 401


def test_connections_test_endpoint_success(client):
    """Valid connection test with sample database returns 200 and success status."""
    res = client.post(
        "/api/v1/connections/test",
        headers={"Authorization": "Bearer dev-token"},
        json={"is_sample_db": True},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["dialect"] == "sqlite"
    assert data["latency_ms"] is not None
    assert data["database_version"] is not None


def test_connections_lifecycle_and_schema_extraction(client):
    """Connect to sample DB, verify current connection, inspect schema, refresh, and disconnect."""
    auth_header = {"Authorization": "Bearer dev-token"}

    # 1. Connect
    connect_res = client.post(
        "/api/v1/connections/connect",
        headers=auth_header,
        json={"is_sample_db": True, "name": "Local Sample Store"},
    )
    assert connect_res.status_code == 200
    conn_data = connect_res.json()
    assert conn_data["name"] == "Local Sample Store"
    assert conn_data["dialect"] == "sqlite"
    assert conn_data["is_sample_db"] is True
    assert conn_data["table_count"] == 6
    assert "password" not in conn_data
    assert "connection_string" not in conn_data

    # 2. Get current connection
    curr_res = client.get("/api/v1/connections/current", headers=auth_header)
    assert curr_res.status_code == 200
    assert curr_res.json()["id"] == conn_data["id"]

    # 3. Retrieve reflected schema
    schema_res = client.get("/api/v1/schema", headers=auth_header)
    assert schema_res.status_code == 200
    schema_data = schema_res.json()
    assert schema_data["dialect"] == "sqlite"
    assert schema_data["table_count"] == 6
    table_names = [t["name"] for t in schema_data["tables"]]
    assert "customers" in table_names
    assert "orders" in table_names
    assert "products" in table_names

    # 4. Refresh schema
    refresh_res = client.post("/api/v1/schema/refresh", headers=auth_header)
    assert refresh_res.status_code == 200
    assert refresh_res.json()["table_count"] == 6

    # 5. Disconnect
    disc_res = client.post("/api/v1/connections/disconnect", headers=auth_header)
    assert disc_res.status_code == 200
    assert "disconnected successfully" in disc_res.json()["message"]

    # 6. Verify subsequent requests return 404
    post_disc_conn = client.get("/api/v1/connections/current", headers=auth_header)
    assert post_disc_conn.status_code == 404

    post_disc_schema = client.get("/api/v1/schema", headers=auth_header)
    assert post_disc_schema.status_code == 404


def test_tenant_isolation_between_users(client):
    """User A's active connection and schema must not be accessible to User B."""
    user_a_header = {"Authorization": "Bearer dev_user_alpha"}
    user_b_header = {"Authorization": "Bearer dev_user_beta"}

    # User A connects to sample database
    res_a = client.post(
        "/api/v1/connections/connect",
        headers=user_a_header,
        json={"is_sample_db": True, "name": "Alpha DB"},
    )
    assert res_a.status_code == 200

    # User B checks current connection -> must be 404 (isolated)
    res_b_conn = client.get("/api/v1/connections/current", headers=user_b_header)
    assert res_b_conn.status_code == 404

    # User B attempts to access schema -> must be 404
    res_b_schema = client.get("/api/v1/schema", headers=user_b_header)
    assert res_b_schema.status_code == 404

    # User A accesses schema -> 200
    res_a_schema = client.get("/api/v1/schema", headers=user_a_header)
    assert res_a_schema.status_code == 200
    assert res_a_schema.json()["table_count"] == 6
