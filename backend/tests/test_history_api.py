"""
DataSpeak Backend — Query History API Integration Tests
Tests authentication enforcement, listing, searching, pagination,
bookmark toggling, single-item retrieval, deletion, batch import,
and multi-tenant isolation across different users.
"""

from __future__ import annotations

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.app_database import get_app_db
from app.models.history_entity import Base, QueryHistoryItemModel
from main import app


@pytest.fixture
def client():
    """FastAPI TestClient with isolated in-memory app database session override."""
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    import asyncio

    async def init_db():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(init_db())

    test_session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_app_db():
        async with test_session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_app_db] = override_get_app_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_app_db, None)

    async def drop_db():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await test_engine.dispose()

    asyncio.run(drop_db())


def test_unauthenticated_requests_return_401(client):
    """Endpoints must reject unauthenticated requests with HTTP 401."""
    # List history
    r1 = client.get("/api/v1/history")
    assert r1.status_code == 401

    # Get single item
    r2 = client.get("/api/v1/history/some-id")
    assert r2.status_code == 401

    # Toggle save
    r3 = client.post("/api/v1/history/some-id/toggle-save")
    assert r3.status_code == 401

    # Delete
    r4 = client.delete("/api/v1/history/some-id")
    assert r4.status_code == 401

    # Clear recent
    r5 = client.delete("/api/v1/history")
    assert r5.status_code == 401

    # Import
    r6 = client.post("/api/v1/history/import", json={"items": []})
    assert r6.status_code == 401


def test_empty_history(client):
    """Empty history returns 200 with total_count=0 and empty list."""
    res = client.get("/api/v1/history", headers={"Authorization": "Bearer dev_alice"})
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total_count"] == 0
    assert data["page"] == 1
    assert data["total_pages"] == 1


def test_import_and_list_history(client):
    """Import localStorage queries and retrieve them via GET /api/v1/history."""
    auth_header = {"Authorization": "Bearer dev_alice"}

    import_payload = {
        "items": [
            {
                "question": "What are top revenue products?",
                "sql": "SELECT * FROM products ORDER BY price DESC LIMIT 5",
                "status": "success",
                "execution_time_ms": 110.2,
                "row_count": 5,
                "is_saved": True,
            },
            {
                "question": "Show total customers",
                "sql": "SELECT COUNT(*) FROM customers",
                "status": "success",
                "execution_time_ms": 45.1,
                "row_count": 1,
                "is_saved": False,
            },
        ]
    }

    # 1. Batch Import
    import_res = client.post("/api/v1/history/import", headers=auth_header, json=import_payload)
    assert import_res.status_code == 200
    assert import_res.json()["imported_count"] == 2

    # 2. List all history
    list_res = client.get("/api/v1/history", headers=auth_header)
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total_count"] == 2
    assert len(data["items"]) == 2

    # 3. Filter by saved_only=true
    saved_res = client.get("/api/v1/history?saved_only=true", headers=auth_header)
    assert saved_res.status_code == 200
    saved_data = saved_res.json()
    assert saved_data["total_count"] == 1
    assert saved_data["items"][0]["question"] == "What are top revenue products?"
    assert saved_data["items"][0]["is_saved"] is True

    # 4. Search query
    search_res = client.get("/api/v1/history?q=customers", headers=auth_header)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total_count"] == 1
    assert search_data["items"][0]["question"] == "Show total customers"


def test_toggle_save_query(client):
    """Toggle star/bookmark on a query item."""
    auth_header = {"Authorization": "Bearer dev_alice"}

    # Import 1 unsaved item
    import_res = client.post(
        "/api/v1/history/import",
        headers=auth_header,
        json={"items": [{"question": "Unsaved question", "is_saved": False}]},
    )
    assert import_res.status_code == 200

    items_res = client.get("/api/v1/history", headers=auth_header)
    item_id = items_res.json()["items"][0]["id"]

    # Toggle save -> True
    toggle_res1 = client.post(f"/api/v1/history/{item_id}/toggle-save", headers=auth_header)
    assert toggle_res1.status_code == 200
    assert toggle_res1.json()["is_saved"] is True

    # Toggle save again -> False
    toggle_res2 = client.post(f"/api/v1/history/{item_id}/toggle-save", headers=auth_header)
    assert toggle_res2.status_code == 200
    assert toggle_res2.json()["is_saved"] is False

    # 404 for nonexistent id
    not_found_res = client.post("/api/v1/history/nonexistent-id/toggle-save", headers=auth_header)
    assert not_found_res.status_code == 404


def test_delete_and_clear_recent(client):
    """Delete a specific query and clear unsaved recent items."""
    auth_header = {"Authorization": "Bearer dev_alice"}

    client.post(
        "/api/v1/history/import",
        headers=auth_header,
        json={
            "items": [
                {"question": "Query A (unsaved)", "is_saved": False},
                {"question": "Query B (saved)", "is_saved": True},
                {"question": "Query C (unsaved)", "is_saved": False},
            ]
        },
    )

    items = client.get("/api/v1/history", headers=auth_header).json()["items"]
    q_a_id = next(item["id"] for item in items if item["question"] == "Query A (unsaved)")

    # 1. Delete Query A
    del_res = client.delete(f"/api/v1/history/{q_a_id}", headers=auth_header)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 2. Clear remaining unsaved queries (should remove Query C, keep Query B)
    clear_res = client.delete("/api/v1/history", headers=auth_header)
    assert clear_res.status_code == 200
    assert clear_res.json()["deleted_count"] == 1

    # 3. Verify only Query B remains
    remaining = client.get("/api/v1/history", headers=auth_header).json()
    assert remaining["total_count"] == 1
    assert remaining["items"][0]["question"] == "Query B (saved)"
    assert remaining["items"][0]["is_saved"] is True


def test_multi_tenant_isolation(client):
    """Ensure user Alice cannot see, fetch, star, or delete user Bob's queries."""
    alice_header = {"Authorization": "Bearer dev_alice"}
    bob_header = {"Authorization": "Bearer dev_bob"}

    # Bob imports a query
    client.post(
        "/api/v1/history/import",
        headers=bob_header,
        json={"items": [{"question": "Bob confidential query", "is_saved": True}]},
    )

    bob_items = client.get("/api/v1/history", headers=bob_header).json()["items"]
    bob_query_id = bob_items[0]["id"]

    # 1. Alice lists history -> Bob's query must not appear
    alice_items = client.get("/api/v1/history", headers=alice_header).json()
    assert alice_items["total_count"] == 0
    assert len(alice_items["items"]) == 0

    # 2. Alice tries to GET Bob's query by ID -> 404
    get_res = client.get(f"/api/v1/history/{bob_query_id}", headers=alice_header)
    assert get_res.status_code == 404

    # 3. Alice tries to toggle-save Bob's query -> 404
    star_res = client.post(f"/api/v1/history/{bob_query_id}/toggle-save", headers=alice_header)
    assert star_res.status_code == 404

    # 4. Alice tries to DELETE Bob's query -> 404
    del_res = client.delete(f"/api/v1/history/{bob_query_id}", headers=alice_header)
    assert del_res.status_code == 404

    # 5. Alice clears her history -> Bob's query remains untouched
    client.delete("/api/v1/history", headers=alice_header)
    bob_check = client.get("/api/v1/history", headers=bob_header).json()
    assert bob_check["total_count"] == 1
    assert bob_check["items"][0]["id"] == bob_query_id


def test_auto_record_on_query_ask(client):
    """End-to-end: Asking a query via /queries/ask automatically records to history."""
    auth_header = {"Authorization": "Bearer dev_charlie"}

    # 1. Connect to sample DB
    conn_res = client.post(
        "/api/v1/connections/connect",
        headers=auth_header,
        json={"is_sample_db": True, "name": "Auto Record Test DB"},
    )
    assert conn_res.status_code == 200

    # 2. Ask question
    ask_res = client.post(
        "/api/v1/queries/ask",
        headers=auth_header,
        json={"question": "Count total products in store"},
    )
    assert ask_res.status_code == 200

    # 3. Verify it was automatically persisted in query history
    history_res = client.get("/api/v1/history", headers=auth_header)
    assert history_res.status_code == 200
    h_data = history_res.json()
    assert h_data["total_count"] == 1
    assert h_data["items"][0]["question"] == "Count total products in store"
    assert h_data["items"][0]["status"] == "success"
    assert "products" in h_data["items"][0]["sql"].lower()


def test_get_single_history_item_by_id(client):
    """Retrieve full details of a specific history item by ID."""
    auth_header = {"Authorization": "Bearer dev_david"}

    import_res = client.post(
        "/api/v1/history/import",
        headers=auth_header,
        json={
            "items": [
                {
                    "question": "Average product price",
                    "sql": "SELECT AVG(price) FROM products",
                    "status": "success",
                    "execution_time_ms": 32.5,
                    "row_count": 1,
                    "summary": "Average product price is $42.50",
                    "is_saved": True,
                }
            ]
        },
    )
    assert import_res.status_code == 200

    items = client.get("/api/v1/history", headers=auth_header).json()["items"]
    item_id = items[0]["id"]

    # Fetch by ID
    get_res = client.get(f"/api/v1/history/{item_id}", headers=auth_header)
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["id"] == item_id
    assert detail["question"] == "Average product price"
    assert detail["sql"] == "SELECT AVG(price) FROM products"
    assert detail["summary"] == "Average product price is $42.50"
    assert detail["is_saved"] is True
    assert detail["execution_time_ms"] == 32.5


def test_auto_record_blocked_guardrail_query(client):
    """When a query is blocked by AST guardrails, it is still auto-persisted with status='blocked'."""
    from app.agent.llm import default_llm_client

    auth_header = {"Authorization": "Bearer dev_eva"}

    # 1. Connect
    client.post(
        "/api/v1/connections/connect",
        headers=auth_header,
        json={"is_sample_db": True, "name": "Blocked Guardrail DB"},
    )

    # 2. Mock LLM to return a malicious mutation SQL statement
    default_llm_client.set_mock_handler(lambda msgs: "```sql\nDROP TABLE products;\n```")

    try:
        # 3. Ask question
        ask_res = client.post(
            "/api/v1/queries/ask",
            headers=auth_header,
            json={"question": "Delete all products from catalog"},
        )
        assert ask_res.status_code == 200
        assert ask_res.json()["status"] == "blocked"

        # 4. Check that blocked query was automatically persisted to query_history
        h_res = client.get("/api/v1/history", headers=auth_header)
        assert h_res.status_code == 200
        h_items = h_res.json()["items"]
        assert len(h_items) == 1
        assert h_items[0]["status"] == "blocked"
        assert h_items[0]["question"] == "Delete all products from catalog"
        assert h_items[0]["error_message"] is not None
        assert "DROP" in h_items[0]["sql"]
    finally:
        default_llm_client.set_mock_handler(None)


def test_pagination_and_page_limits(client):
    """Test pagination: page, limit, total_pages, and offset calculations."""
    auth_header = {"Authorization": "Bearer dev_frank"}

    # Import 5 queries
    payload = {
        "items": [
            {"question": f"Query #{i}", "sql": f"SELECT {i}", "is_saved": False}
            for i in range(1, 6)
        ]
    }
    client.post("/api/v1/history/import", headers=auth_header, json=payload)

    # Page 1, limit 2
    p1 = client.get("/api/v1/history?page=1&limit=2", headers=auth_header).json()
    assert p1["total_count"] == 5
    assert len(p1["items"]) == 2
    assert p1["page"] == 1
    assert p1["page_size"] == 2
    assert p1["total_pages"] == 3

    # Page 2, limit 2
    p2 = client.get("/api/v1/history?page=2&limit=2", headers=auth_header).json()
    assert len(p2["items"]) == 2
    assert p2["page"] == 2

    # Page 3, limit 2 (last remaining item)
    p3 = client.get("/api/v1/history?page=3&limit=2", headers=auth_header).json()
    assert len(p3["items"]) == 1
    assert p3["page"] == 3

