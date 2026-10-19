"""
DataSpeak Backend — Dynamic SQLAlchemy Async Engine Factory
Handles URL normalization, SSL/TLS enforcement, pooler compatibility, and connection testing
for PostgreSQL (standard, Neon, Supabase), MySQL, and SQLite.
"""

from __future__ import annotations

import re
import ssl
import time
from typing import Any, Dict, Optional, Tuple
from urllib.parse import quote_plus, urlparse

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool
from sqlalchemy import text

from app.core.logging import get_logger
from app.models.connection import (
    ConnectionParams,
    ConnectionTestResponse,
    DatabaseDialect,
)
from app.db.sample_data import create_sample_database, get_sample_db_path

logger = get_logger("db.connection")

# Host patterns identifying cloud PostgreSQL providers
CLOUD_POSTGRES_DOMAINS = ("neon.tech", "supabase.co", "supabase.com", "pooler.supabase.com")


def is_cloud_postgres(host_or_url: str) -> bool:
    """Check if a host or URL points to a cloud-managed PostgreSQL provider."""
    target = host_or_url.lower()
    return any(domain in target for domain in CLOUD_POSTGRES_DOMAINS)


def normalize_database_url(params: ConnectionParams) -> Tuple[str, Dict[str, Any], DatabaseDialect]:
    """
    Constructs and normalizes an async SQLAlchemy connection URL along with engine connect_args.
    Returns: (normalized_url, connect_args, dialect)
    """
    connect_args: Dict[str, Any] = {}

    # ── 1. Built-in Sample Database (SQLite) ─────────────────────────────────
    if params.is_sample_db:
        sample_path = create_sample_database()
        # Normalizing Windows backslashes for sqlite URL
        normalized_path = sample_path.replace("\\", "/")
        async_url = f"sqlite+aiosqlite:///{normalized_path}"
        connect_args["check_same_thread"] = False
        return async_url, connect_args, DatabaseDialect.SQLITE

    # ── 2. Direct Connection String Provided ─────────────────────────────────
    if params.connection_string:
        raw_url = params.connection_string.strip()

        # Normalize postgres / postgresql schemes to asyncpg
        if raw_url.startswith("postgres://"):
            raw_url = "postgresql+asyncpg://" + raw_url[len("postgres://"):]
        elif raw_url.startswith("postgresql://"):
            raw_url = "postgresql+asyncpg://" + raw_url[len("postgresql://"):]
        elif raw_url.startswith("mysql://"):
            raw_url = "mysql+aiomysql://" + raw_url[len("mysql://"):]
        elif raw_url.startswith("sqlite://") and not raw_url.startswith("sqlite+aiosqlite://"):
            raw_url = "sqlite+aiosqlite://" + raw_url[len("sqlite://"):]

        parsed = urlparse(raw_url)
        scheme = parsed.scheme.lower()

        if "postgresql" in scheme or "asyncpg" in scheme:
            dialect = DatabaseDialect.POSTGRESQL
            # Check for cloud / pooler / SSL
            is_cloud = is_cloud_postgres(raw_url) or is_cloud_postgres(parsed.netloc)
            if is_cloud or params.ssl or "sslmode=require" in raw_url:
                connect_args["ssl"] = True
            # Supabase / Neon connection pooler: disable prepared statement cache to avoid PgBouncer conflicts
            if is_cloud or parsed.port in (6543, 5432):
                connect_args["statement_cache_size"] = 0
                connect_args["prepared_statement_cache_size"] = 0

            # Remove sslmode query param from URL since asyncpg receives it in connect_args
            cleaned_url = re.sub(r"[?&]sslmode=[^&]+", "", raw_url)
            # Remove trailing '?' if left dangling
            cleaned_url = cleaned_url.rstrip("?")
            return cleaned_url, connect_args, dialect

        elif "mysql" in scheme or "aiomysql" in scheme:
            dialect = DatabaseDialect.MYSQL
            if params.ssl or "ssl=true" in raw_url.lower():
                connect_args["ssl"] = True
            return raw_url, connect_args, dialect

        elif "sqlite" in scheme or "aiosqlite" in scheme:
            dialect = DatabaseDialect.SQLITE
            connect_args["check_same_thread"] = False
            return raw_url, connect_args, dialect

        else:
            raise ValueError(f"Unsupported database scheme: '{scheme}'. Supported: postgresql, mysql, sqlite.")

    # ── 3. Discrete Connection Parameters ────────────────────────────────────
    dialect = params.dialect or DatabaseDialect.SQLITE

    if dialect == DatabaseDialect.SQLITE:
        db_path = params.database or "dataspeak_local.db"
        if not db_path.endswith(".db"):
            db_path = f"{db_path}.db"
        normalized_path = db_path.replace("\\", "/")
        async_url = f"sqlite+aiosqlite:///{normalized_path}"
        connect_args["check_same_thread"] = False
        return async_url, connect_args, dialect

    username = quote_plus(params.username or "")
    password = quote_plus(params.password or "")
    auth_part = f"{username}:{password}@" if (username or password) else ""
    host = params.host or "localhost"

    if dialect == DatabaseDialect.POSTGRESQL:
        port = params.port or 5432
        db_name = params.database or "postgres"
        async_url = f"postgresql+asyncpg://{auth_part}{host}:{port}/{db_name}"

        is_cloud = is_cloud_postgres(host) or params.ssl
        if is_cloud:
            connect_args["ssl"] = True
        if is_cloud or port in (6543, 5432):
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_cache_size"] = 0

        return async_url, connect_args, dialect

    elif dialect == DatabaseDialect.MYSQL:
        port = params.port or 3306
        db_name = params.database or ""
        async_url = f"mysql+aiomysql://{auth_part}{host}:{port}/{db_name}"

        if params.ssl:
            connect_args["ssl"] = True

        return async_url, connect_args, dialect

    raise ValueError(f"Unsupported dialect: {dialect}")


def build_async_engine(
    params: ConnectionParams,
    is_transient: bool = False,
) -> Tuple[AsyncEngine, DatabaseDialect]:
    """
    Creates an asynchronous SQLAlchemy engine configured for the specified database.
    If is_transient is True (e.g. for connection tests), uses NullPool to immediately close connections.
    """
    async_url, connect_args, dialect = normalize_database_url(params)

    engine_kwargs: Dict[str, Any] = {
        "connect_args": connect_args,
    }

    if is_transient:
        engine_kwargs["poolclass"] = NullPool
    elif dialect == DatabaseDialect.SQLITE:
        # SQLite local file pool
        engine_kwargs["pool_pre_ping"] = True
    else:
        # PostgreSQL / MySQL connection pool
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 10

    engine = create_async_engine(async_url, **engine_kwargs)
    return engine, dialect


async def test_connection(params: ConnectionParams, timeout_seconds: float = 5.0) -> ConnectionTestResponse:
    """
    Validates database connectivity by issuing a lightweight ping and version check.
    Ensures safe error sanitization so sensitive host internals are not leaked.
    """
    start_time = time.perf_counter()
    engine: Optional[AsyncEngine] = None

    try:
        engine, dialect = build_async_engine(params, is_transient=True)

        async with engine.connect() as conn:
            # Dialect-specific version query
            if dialect == DatabaseDialect.POSTGRESQL:
                version_query = text("SELECT version();")
            elif dialect == DatabaseDialect.MYSQL:
                version_query = text("SELECT version();")
            else:
                version_query = text("SELECT sqlite_version();")

            result = await conn.execute(version_query)
            version_row = result.scalar()
            version_str = str(version_row) if version_row else None

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return ConnectionTestResponse(
            success=True,
            message="Database connection established successfully.",
            latency_ms=latency_ms,
            dialect=dialect.value,
            database_version=version_str,
        )

    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        error_msg = str(exc)
        logger.warn("Database connection test failed", error=error_msg, dialect=str(params.dialect))

        # Sanitize common database driver exceptions
        sanitized_msg = _sanitize_connection_error(error_msg, params.dialect)

        return ConnectionTestResponse(
            success=False,
            message=sanitized_msg,
            latency_ms=latency_ms,
            dialect=params.dialect.value if params.dialect else None,
            database_version=None,
        )

    finally:
        if engine is not None:
            await engine.dispose()


def _sanitize_connection_error(raw_error: str, dialect: Optional[DatabaseDialect]) -> str:
    """Translates low-level driver exceptions into actionable user feedback."""
    lower = raw_error.lower()

    if "password authentication failed" in lower or "access denied for user" in lower:
        return "Authentication failed: Please check your username and password."

    if "could not translate host name" in lower or "getaddrinfo failed" in lower or "name or service not known" in lower:
        return "Connection failed: Hostname could not be resolved. Please verify host address."

    if "connection refused" in lower:
        return "Connection failed: Connection refused. Check if the database server is running and the port is open."

    if "timeout" in lower or "timed out" in lower:
        return "Connection timed out. Please check your network connection, firewall, or security groups."

    if "ssl" in lower and ("require" in lower or "handshake" in lower or "certificate" in lower):
        return "SSL/TLS connection error: The server may require an encrypted connection or valid certificate."

    if "database" in lower and ("does not exist" in lower or "unknown database" in lower):
        return "Database does not exist: Please verify the database name."

    # Generic clean fallback
    return f"Unable to connect to database: {raw_error[:160]}"
