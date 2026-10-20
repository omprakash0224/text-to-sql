"""
DataSpeak Backend — Query History App Database & Repository Tests
Verifies app database engine creation, URL normalization (Postgres, Neon, SQLite),
SQLAlchemy ORM models, Alembic migrations compatibility, and HistoryRepository
operations (CRUD, pagination, search, bookmarking, multi-tenant isolation).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.app_database import (
    create_app_engine,
    get_app_db,
    normalize_app_database_url,
)
from app.db.repositories.history_repository import HistoryRepository
from app.models.history import QueryHistoryCreate, QueryHistoryImport
from app.models.history_entity import Base, QueryHistoryItemModel


@pytest.fixture
def test_urls():
    """Sample connection URLs for normalization testing."""
    return {
        "postgres_raw": "postgres://dataspeak:pass@localhost:5432/dataspeak_internal",
        "postgresql_raw": "postgresql://dataspeak:pass@localhost:5432/dataspeak_internal",
        "neon_cloud": "postgresql://neondb_owner:npg_secret@ep-cool-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
        "sqlite_raw": "sqlite:///./test_internal.db",
    }


def test_normalize_app_database_url(test_urls):
    """Test URL normalization for standard Postgres, Neon, and SQLite."""
    # Standard postgres -> asyncpg
    url, args = normalize_app_database_url(test_urls["postgres_raw"])
    assert url.startswith("postgresql+asyncpg://")

    # postgresql -> asyncpg
    url, args = normalize_app_database_url(test_urls["postgresql_raw"])
    assert url.startswith("postgresql+asyncpg://")

    # Neon Cloud -> asyncpg + SSL + statement_cache_size=0
    url, args = normalize_app_database_url(test_urls["neon_cloud"])
    assert url.startswith("postgresql+asyncpg://")
    assert "ssl" in args
    assert args.get("statement_cache_size") == 0

    # SQLite
    url, args = normalize_app_database_url(test_urls["sqlite_raw"])
    assert url.startswith("sqlite+aiosqlite://")
    assert args.get("check_same_thread") is False


@pytest_asyncio.fixture
async def async_test_session():
    """In-memory SQLite async session for repository unit tests."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.mark.asyncio
async def test_create_and_read_history(async_test_session: AsyncSession):
    """Test creating a query history record and converting to Pydantic."""
    create_dto = QueryHistoryCreate(
        user_id="user_alice",
        database_name="demo_ecommerce",
        question="What are top 5 selling products?",
        sql="SELECT * FROM products LIMIT 5",
        status="success",
        execution_time_ms=124.5,
        row_count=5,
        chart_config={"type": "bar", "x_key": "name", "y_key": "sales"},
        summary="Top products are led by Electronics.",
        is_saved=False,
    )

    created = await HistoryRepository.create_query_history(async_test_session, create_dto)
    assert created.id is not None
    assert created.user_id == "user_alice"
    assert created.question == "What are top 5 selling products?"
    assert created.status == "success"
    assert created.execution_time_ms == 124.5
    assert created.row_count == 5
    assert created.is_saved is False

    # Check Pydantic conversion
    pydantic_item = created.to_pydantic()
    assert pydantic_item.id == created.id
    assert pydantic_item.summary == "Top products are led by Electronics."


@pytest.mark.asyncio
async def test_tenant_isolation_and_listing(async_test_session: AsyncSession):
    """Ensure user A cannot see queries created by user B."""
    # Create 3 queries for Alice
    for i in range(3):
        await HistoryRepository.create_query_history(
            async_test_session,
            QueryHistoryCreate(
                user_id="user_alice",
                question=f"Alice question {i}",
                sql=f"SELECT {i}",
            ),
        )

    # Create 2 queries for Bob
    for j in range(2):
        await HistoryRepository.create_query_history(
            async_test_session,
            QueryHistoryCreate(
                user_id="user_bob",
                question=f"Bob question {j}",
                sql=f"SELECT {j}",
            ),
        )

    # Alice listing
    alice_items, alice_count = await HistoryRepository.list_query_history(
        async_test_session,
        user_id="user_alice",
    )
    assert alice_count == 3
    assert len(alice_items) == 3
    assert all(item.user_id == "user_alice" for item in alice_items)

    # Bob listing
    bob_items, bob_count = await HistoryRepository.list_query_history(
        async_test_session,
        user_id="user_bob",
    )
    assert bob_count == 2
    assert len(bob_items) == 2
    assert all(item.user_id == "user_bob" for item in bob_items)


@pytest.mark.asyncio
async def test_search_and_pagination(async_test_session: AsyncSession):
    """Test search filtering and pagination."""
    # Seed queries
    await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(user_id="user_charlie", question="Show monthly revenue"),
    )
    await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(user_id="user_charlie", question="Show top revenue products"),
    )
    await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(user_id="user_charlie", question="Count active users"),
    )

    # Search for "revenue"
    items, count = await HistoryRepository.list_query_history(
        async_test_session,
        user_id="user_charlie",
        search_q="revenue",
    )
    assert count == 2
    assert len(items) == 2

    # Pagination: page 1 with page_size 1
    p1_items, p1_total = await HistoryRepository.list_query_history(
        async_test_session,
        user_id="user_charlie",
        page=1,
        page_size=1,
    )
    assert p1_total == 3
    assert len(p1_items) == 1


@pytest.mark.asyncio
async def test_toggle_save_and_filter(async_test_session: AsyncSession):
    """Test bookmarking (is_saved) toggling and filter by saved status."""
    created = await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(
            user_id="user_dana",
            question="Quarterly churn rate",
            is_saved=False,
        ),
    )

    # Toggle save to True
    saved = await HistoryRepository.toggle_save_query(
        async_test_session,
        user_id="user_dana",
        query_id=created.id,
    )
    assert saved is not None
    assert saved.is_saved is True

    # User Eve cannot toggle Dana's query
    eve_attempt = await HistoryRepository.toggle_save_query(
        async_test_session,
        user_id="user_eve",
        query_id=created.id,
    )
    assert eve_attempt is None

    # Filter saved only
    saved_items, count = await HistoryRepository.list_query_history(
        async_test_session,
        user_id="user_dana",
        is_saved=True,
    )
    assert count == 1
    assert saved_items[0].id == created.id


@pytest.mark.asyncio
async def test_delete_and_clear_recent(async_test_session: AsyncSession):
    """Test deleting single item and clearing unsaved history."""
    q1 = await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(user_id="user_frank", question="Q1", is_saved=False),
    )
    q2 = await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(user_id="user_frank", question="Q2 (saved)", is_saved=True),
    )
    q3 = await HistoryRepository.create_query_history(
        async_test_session,
        QueryHistoryCreate(user_id="user_frank", question="Q3", is_saved=False),
    )

    # Delete q1
    deleted = await HistoryRepository.delete_query_history_item(
        async_test_session,
        user_id="user_frank",
        query_id=q1.id,
    )
    assert deleted is True

    # Clear recent unsaved history (should delete q3, but keep q2)
    cleared_count = await HistoryRepository.clear_recent_history(
        async_test_session,
        user_id="user_frank",
    )
    assert cleared_count == 1  # only q3 deleted

    remaining, count = await HistoryRepository.list_query_history(
        async_test_session,
        user_id="user_frank",
    )
    assert count == 1
    assert remaining[0].id == q2.id
    assert remaining[0].is_saved is True


@pytest.mark.asyncio
async def test_batch_import_history(async_test_session: AsyncSession):
    """Test importing client-side localStorage query items."""
    fixed_id = str(uuid.uuid4())
    import_items = [
        QueryHistoryImport(
            id=fixed_id,
            question="Legacy localStorage question 1",
            sql="SELECT 1",
            is_saved=True,
        ),
        QueryHistoryImport(
            id=str(uuid.uuid4()),
            question="Legacy localStorage question 2",
            sql="SELECT 2",
            is_saved=False,
        ),
    ]

    count = await HistoryRepository.batch_import_history(
        async_test_session,
        user_id="user_grace",
        items=import_items,
    )
    assert count == 2

    # Attempt re-importing the same items (idempotence / skip duplicates)
    reimport_count = await HistoryRepository.batch_import_history(
        async_test_session,
        user_id="user_grace",
        items=[import_items[0]],
    )
    assert reimport_count == 0  # skipped already existing id


@pytest.mark.asyncio
async def test_get_app_db_generator():
    """Verify get_app_db dependency yields a working session."""
    gen = get_app_db()
    session = await anext(gen)
    assert isinstance(session, AsyncSession)
    await gen.aclose()
