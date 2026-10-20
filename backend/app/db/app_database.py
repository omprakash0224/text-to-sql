"""
DataSpeak Backend — Internal Application Database Engine Factory
Manages asynchronous connection pooling, SSL/TLS negotiation, session factory,
and schema initialization for platform state (query history and bookmarks).
"""

from __future__ import annotations

import re
import ssl
from typing import Any, AsyncGenerator, Dict, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool, StaticPool


from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.history_entity import Base

logger = get_logger("db.app_database")

# Global engine and sessionmaker singletons for internal platform storage
_app_engine: Optional[AsyncEngine] = None
_app_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def normalize_app_database_url(raw_url: str) -> tuple[str, Dict[str, Any]]:
    """
    Normalizes the database URL into an async SQLAlchemy URL and extracts connect_args.
    Ensures asyncpg driver is used for PostgreSQL and applies SSL/pooler settings for Neon/cloud.
    """
    connect_args: Dict[str, Any] = {}
    normalized = raw_url.strip()

    # Normalizing Windows SQLite paths if used for local tests
    if "sqlite" in normalized.lower():
        if not normalized.startswith("sqlite+aiosqlite://"):
            normalized = re.sub(r"^sqlite://", "sqlite+aiosqlite://", normalized)
        connect_args["check_same_thread"] = False
        return normalized, connect_args

    # PostgreSQL normalization
    if normalized.startswith("postgres://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgres://"):]
    elif normalized.startswith("postgresql://"):
        normalized = "postgresql+asyncpg://" + normalized[len("postgresql://"):]

    parsed = urlparse(normalized)
    hostname = (parsed.hostname or "").lower()

    # Detect Neon / Supabase cloud hostnames
    is_cloud = any(domain in hostname for domain in ("neon.tech", "supabase.co", "supabase.com"))

    query_params = parse_qs(parsed.query)
    sslmode_requested = "sslmode" in query_params or is_cloud

    # Clean query parameters for asyncpg
    cleaned_query: Dict[str, list[str]] = {}
    for key, values in query_params.items():
        if key == "sslmode":
            ssl_val = values[0].lower()
            if ssl_val in ("require", "verify-ca", "verify-full"):
                sslmode_requested = True
            elif ssl_val == "disable":
                sslmode_requested = False
        else:
            cleaned_query[key] = values

    # asyncpg requires ssl via connect_args rather than query string
    if sslmode_requested:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx

    # Cloud pooler settings (disable statement cache to prevent collision with PgBouncer)
    if is_cloud:
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_cache_size"] = 0

    new_query = urlencode(cleaned_query, doseq=True)
    clean_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment,
    ))

    return clean_url, connect_args


def create_app_engine(database_url: Optional[str] = None) -> AsyncEngine:
    """Create and configure a SQLAlchemy AsyncEngine for the application database."""
    settings = get_settings()
    url = database_url or settings.APP_DATABASE_URL
    clean_url, connect_args = normalize_app_database_url(url)

    is_sqlite = clean_url.startswith("sqlite")

    if is_sqlite:
        engine = create_async_engine(
            clean_url,
            connect_args=connect_args,
            poolclass=StaticPool if ":memory:" in clean_url else NullPool,
            echo=False,
        )
    else:
        engine = create_async_engine(
            clean_url,
            connect_args=connect_args,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False,
        )

    return engine


async def init_app_db(database_url: Optional[str] = None) -> None:
    """
    Initializes the application database connection pool and creates tables if needed.
    Safely logs a warning if database service is not yet ready rather than halting process.

    IMPORTANT: For PostgreSQL (asyncpg), DDL statements like CREATE TABLE run inside a
    transaction that must be explicitly committed. We call conn.commit() after create_all
    so the query_history table is durably created and visible to subsequent queries.
    SQLite autocommits DDL, so the commit is a safe no-op there.
    """
    global _app_engine, _app_session_factory

    try:
        _app_engine = create_app_engine(database_url)
        _app_session_factory = async_sessionmaker(
            bind=_app_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

        # Test ping & auto-create tables.
        # Use begin() so the DDL transaction is committed automatically on success.
        async with _app_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Application database initialized successfully")
    except Exception as exc:
        logger.warning(
            "Application database connection deferred or unavailable at startup",
            error=str(exc),
        )


async def close_app_db() -> None:
    """Gracefully disposes the application database connection pool."""
    global _app_engine, _app_session_factory
    if _app_engine is not None:
        try:
            await _app_engine.dispose()
            logger.info("Application database connection pool closed")
        except Exception as exc:
            logger.warning("Error closing application database pool", error=str(exc))
        finally:
            _app_engine = None
            _app_session_factory = None


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get the active sessionmaker, creating a lazy engine if not yet initialized."""
    global _app_engine, _app_session_factory
    if _app_session_factory is None:
        _app_engine = create_app_engine()
        _app_session_factory = async_sessionmaker(
            bind=_app_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _app_session_factory


async def get_app_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session for request lifecycle.
    Rolls back automatically on unhandled error and guarantees session closure.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
