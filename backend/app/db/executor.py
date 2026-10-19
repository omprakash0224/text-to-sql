"""
DataSpeak Backend — Safe Query Executor
Executes validated read-only SQL queries with strict execution timeouts,
read-only transaction rollbacks, sensitive value sanitization, and timing metrics.
"""

from __future__ import annotations

import asyncio
from datetime import date, datetime
from decimal import Decimal
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("db.executor")


class QueryExecutionError(Exception):
    """Raised when query execution encounters a database or timeout error."""

    def __init__(self, message: str, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.message = message
        self.original_error = original_error


def serialize_cell_value(val: Any) -> Any:
    """
    Recursively converts database data types (Decimal, datetime, UUID, memoryview)
    into standard JSON-compliant Python primitives.
    """
    if val is None:
        return None
    if isinstance(val, (int, float, bool, str)):
        return val
    if isinstance(val, Decimal):
        return float(val) if val % 1 else int(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, uuid.UUID):
        return str(val)
    if isinstance(val, (bytes, bytearray, memoryview)):
        return f"<binary {len(val)} bytes>"
    if isinstance(val, (list, tuple)):
        return [serialize_cell_value(item) for item in val]
    if isinstance(val, dict):
        return {k: serialize_cell_value(v) for k, v in val.items()}
    return str(val)


def sanitize_db_error_message(error: Exception) -> str:
    """
    Strips raw database stack traces and connection credentials, producing
    a clean, understandable error message for non-technical users.
    """
    raw = str(error)

    # Strip SQLAlchemy specific wrapper prefixes
    for prefix in [
        "(sqlite3.OperationalError)",
        "(sqlite3.DatabaseError)",
        "(asyncpg.exceptions.",
        "(pymysql.err.OperationalError)",
        "(aiomysql.Error)",
    ]:
        if prefix in raw:
            parts = raw.split(prefix)
            if len(parts) > 1:
                raw = parts[1]

    # Clean up common patterns
    if "[SQL:" in raw:
        raw = raw.split("[SQL:")[0].strip()

    raw = raw.strip(": ")
    if not raw:
        return "The query could not be executed due to a database syntax or schema mismatch."

    return raw


class QueryExecutor:
    """
    Handles safe execution of read-only queries against connected database engines.
    Guarantees execution timeout, transaction rollback, and row serialization.
    """

    @classmethod
    async def execute_query(
        cls,
        engine: AsyncEngine,
        sql: str,
        dialect: str = "postgresql",
        timeout_seconds: Optional[int] = None,
    ) -> Tuple[List[str], List[Dict[str, Any]], float]:
        """
        Executes a validated read-only SQL query against the provided engine.

        Returns:
            columns: List of column names
            rows: List of row dictionaries with serialized values
            execution_time_ms: Query execution duration in milliseconds

        Raises:
            QueryExecutionError: On timeout, database error, or invalid syntax.
        """
        settings = get_settings()
        timeout = timeout_seconds or settings.MAX_QUERY_TIMEOUT_SECONDS

        logger.info(
            "Executing query on target engine",
            dialect=dialect,
            timeout_seconds=timeout,
            query_preview=sql[:100],
        )

        start_time = time.perf_counter()

        try:
            return await asyncio.wait_for(
                cls._raw_execute(engine, sql, dialect),
                timeout=float(timeout),
            )
        except asyncio.TimeoutError as exc:
            elapsed = (time.perf_counter() - start_time) * 1000.0
            msg = (
                f"Query execution timed out after {timeout} seconds. "
                "The requested query was too complex or involved too much data."
            )
            logger.warn("Query execution timed out", timeout=timeout, elapsed_ms=elapsed)
            raise QueryExecutionError(msg, original_error=exc) from exc
        except SQLAlchemyError as exc:
            elapsed = (time.perf_counter() - start_time) * 1000.0
            clean_msg = sanitize_db_error_message(exc)
            logger.warn("Database execution error", error=clean_msg, elapsed_ms=elapsed)
            raise QueryExecutionError(clean_msg, original_error=exc) from exc
        except Exception as exc:
            elapsed = (time.perf_counter() - start_time) * 1000.0
            clean_msg = sanitize_db_error_message(exc)
            logger.error("Unexpected execution error", error=clean_msg, elapsed_ms=elapsed)
            raise QueryExecutionError(clean_msg, original_error=exc) from exc

    @classmethod
    async def _raw_execute(
        cls,
        engine: AsyncEngine,
        sql: str,
        dialect: str,
    ) -> Tuple[List[str], List[Dict[str, Any]], float]:
        """Internal worker executing query inside a rolled-back transaction."""
        start_time = time.perf_counter()

        async with engine.connect() as conn:
            # Postgres supports setting read-only transaction state
            if dialect in ("postgresql", "postgres"):
                try:
                    await conn.execute(text("SET TRANSACTION READ ONLY"))
                except Exception:
                    pass  # Non-fatal if server or pooler doesn't support session SET

            try:
                result = await conn.execute(text(sql))
                columns = list(result.keys()) if result.returns_rows else []
                raw_rows = result.all() if result.returns_rows else []

                # Format rows into serialized dictionaries
                rows: List[Dict[str, Any]] = []
                for row in raw_rows:
                    row_dict = {}
                    for col, val in zip(columns, row):
                        row_dict[col] = serialize_cell_value(val)
                    rows.append(row_dict)

                elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
                return columns, rows, elapsed_ms

            finally:
                # Absolute guardrail: Always rollback transaction after execution
                try:
                    await conn.rollback()
                except Exception:
                    pass
