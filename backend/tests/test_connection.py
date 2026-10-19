"""
DataSpeak Backend — Dynamic Engine Factory & Connection Tests
Tests URL normalization, SSL/pooler parameters, and connection tester.
"""

from __future__ import annotations

import pytest
from app.db.connection import (
    build_async_engine,
    is_cloud_postgres,
    normalize_database_url,
    test_connection as run_test_connection,
)
from app.models.connection import (
    ConnectionParams,
    DatabaseDialect,
)


def test_is_cloud_postgres():
    """Verify cloud PostgreSQL detection for Neon and Supabase domains."""
    assert is_cloud_postgres("ep-cool-butterfly-12345.us-east-2.aws.neon.tech") is True
    assert is_cloud_postgres("db.abcdefghijklmnopqrst.supabase.co") is True
    assert is_cloud_postgres("postgres://user:pass@pooler.supabase.com:6543/postgres") is True
    assert is_cloud_postgres("localhost") is False
    assert is_cloud_postgres("192.168.1.10") is False


def test_normalize_database_url_sample_db():
    """Verify built-in SQLite sample URL normalization."""
    params = ConnectionParams(is_sample_db=True)
    url, connect_args, dialect = normalize_database_url(params)

    assert dialect == DatabaseDialect.SQLITE
    assert url.startswith("sqlite+aiosqlite:///")
    assert "demo_ecommerce.db" in url
    assert connect_args.get("check_same_thread") is False


def test_normalize_database_url_postgres_schemes():
    """Verify postgres:// and postgresql:// are normalized to postgresql+asyncpg://."""
    p1 = ConnectionParams(connection_string="postgres://user:secret@localhost:5432/testdb")
    url1, args1, dialect1 = normalize_database_url(p1)
    assert url1.startswith("postgresql+asyncpg://")
    assert dialect1 == DatabaseDialect.POSTGRESQL

    p2 = ConnectionParams(connection_string="postgresql://user:secret@localhost:5432/testdb")
    url2, args2, dialect2 = normalize_database_url(p2)
    assert url2.startswith("postgresql+asyncpg://")
    assert dialect2 == DatabaseDialect.POSTGRESQL


def test_normalize_database_url_cloud_ssl_and_pooler():
    """Verify Neon/Supabase URLs receive SSL and disabled statement cache for poolers."""
    cloud_url = "postgres://user:pass@ep-demo-123.us-east-1.neon.tech/neondb?sslmode=require"
    params = ConnectionParams(connection_string=cloud_url)
    url, args, dialect = normalize_database_url(params)

    assert url.startswith("postgresql+asyncpg://")
    assert "sslmode=require" not in url  # Should be moved to connect_args
    assert args.get("ssl") is True
    assert args.get("statement_cache_size") == 0
    assert args.get("prepared_statement_cache_size") == 0


def test_normalize_database_url_discrete_params():
    """Verify discrete parameters build valid async URLs."""
    # Postgres
    pg_params = ConnectionParams(
        dialect=DatabaseDialect.POSTGRESQL,
        host="db.example.com",
        port=5432,
        database="analytics",
        username="readonly_user",
        password="p@ssword#123",
        ssl=True,
    )
    pg_url, pg_args, pg_dialect = normalize_database_url(pg_params)
    assert pg_url.startswith("postgresql+asyncpg://readonly_user:p%40ssword%23123@db.example.com:5432/analytics")
    assert pg_args.get("ssl") is True
    assert pg_dialect == DatabaseDialect.POSTGRESQL

    # MySQL
    mysql_params = ConnectionParams(
        dialect=DatabaseDialect.MYSQL,
        host="mysql.example.com",
        port=3306,
        database="shop",
        username="app",
        password="secret",
    )
    my_url, my_args, my_dialect = normalize_database_url(mysql_params)
    assert my_url.startswith("mysql+aiomysql://app:secret@mysql.example.com:3306/shop")
    assert my_dialect == DatabaseDialect.MYSQL


@pytest.mark.asyncio
async def test_test_connection_sample_database():
    """Verify test_connection succeeds on the SQLite sample database."""
    params = ConnectionParams(is_sample_db=True)
    res = await run_test_connection(params)

    assert res.success is True
    assert "successfully" in res.message
    assert res.latency_ms is not None
    assert res.latency_ms > 0
    assert res.dialect == "sqlite"
    assert res.database_version is not None


@pytest.mark.asyncio
async def test_test_connection_invalid_credentials_sanitized():
    """Verify connection failure produces a clean sanitized message without crashing."""
    params = ConnectionParams(
        dialect=DatabaseDialect.POSTGRESQL,
        host="127.0.0.1",
        port=59999,  # Unused port
        database="nonexistent",
        username="bad_user",
        password="bad_password",
    )
    res = await run_test_connection(params, timeout_seconds=1.0)

    assert res.success is False
    assert res.database_version is None
    # Error message should be sanitized and helpful
    assert "Connection" in res.message or "failed" in res.message or "refused" in res.message
