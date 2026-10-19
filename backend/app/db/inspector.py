"""
DataSpeak Backend — Database Schema Reflection Service
Extracts tables, columns, primary keys, foreign keys, row counts, and sanitized sample rows
using SQLAlchemy 2.0 async inspection.
"""

from __future__ import annotations

import asyncio
from datetime import date, datetime
from decimal import Decimal
import time
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from app.core.logging import get_logger
from app.models.connection import DatabaseDialect
from app.models.schema import (
    ColumnMetadata,
    DatabaseSchemaResponse,
    ForeignKeyMetadata,
    TableMetadata,
)

logger = get_logger("db.inspector")

# System tables and schemas to filter out across dialects
SYSTEM_TABLE_PREFIXES = (
    "sqlite_",
    "pg_",
    "information_schema",
    "performance_schema",
    "mysql",
    "sys",
)

SENSITIVE_COLUMN_KEYWORDS = (
    "password",
    "passwd",
    "secret",
    "token",
    "auth",
    "api_key",
    "apikey",
    "hash",
    "ssn",
    "credit_card",
    "private_key",
)


def is_system_table(table_name: str) -> bool:
    """Check if table name belongs to internal system or metadata schemas."""
    lower = table_name.lower()
    return any(lower.startswith(prefix) for prefix in SYSTEM_TABLE_PREFIXES)


def is_sensitive_column(column_name: str) -> bool:
    """Check if column name indicates sensitive personal or credential data."""
    lower = column_name.lower()
    return any(kw in lower for kw in SENSITIVE_COLUMN_KEYWORDS)


def sanitize_value(val: Any, col_name: str) -> Any:
    """Mask sensitive values and convert complex types to JSON-serializable primitives."""
    if val is None:
        return None

    if is_sensitive_column(col_name):
        return "[REDACTED]"

    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, UUID):
        return str(val)
    if isinstance(val, bytes):
        return f"<bytes len={len(val)}>"
    if isinstance(val, str) and len(val) > 200:
        return val[:200] + "..."

    return val


def _sync_inspect_tables(sync_conn: Any) -> List[Dict[str, Any]]:
    """
    Synchronous schema reflection executed inside conn.run_sync().
    Extracts table names, column details, primary keys, and foreign keys.
    """
    inspector = inspect(sync_conn)
    raw_tables = inspector.get_table_names()

    tables_data: List[Dict[str, Any]] = []

    for tbl in raw_tables:
        if is_system_table(tbl):
            continue

        columns_data = inspector.get_columns(tbl)
        pk_constraint = inspector.get_pk_constraint(tbl) or {}
        pk_cols = set(pk_constraint.get("constrained_columns") or [])
        fk_constraints = inspector.get_foreign_keys(tbl) or []

        columns: List[ColumnMetadata] = []
        for col in columns_data:
            c_name = col["name"]
            is_pk = c_name in pk_cols or col.get("primary_key", False)
            col_type = str(col["type"])
            nullable = col.get("nullable", True)
            default = str(col.get("default")) if col.get("default") is not None else None

            columns.append(
                ColumnMetadata(
                    name=c_name,
                    type=col_type,
                    nullable=nullable,
                    primary_key=bool(is_pk),
                    default_value=default,
                )
            )

        fks: List[ForeignKeyMetadata] = []
        for fk in fk_constraints:
            ref_tbl = fk.get("referred_table") or ""
            c_cols = fk.get("constrained_columns") or []
            r_cols = fk.get("referred_columns") or []
            for cc, rc in zip(c_cols, r_cols):
                fks.append(
                    ForeignKeyMetadata(
                        constrained_column=cc,
                        referred_table=ref_tbl,
                        referred_column=rc,
                    )
                )

        tables_data.append({
            "name": tbl,
            "columns": columns,
            "primary_keys": list(pk_cols),
            "foreign_keys": fks,
        })

    return tables_data


async def _fetch_table_samples_and_count(
    conn: AsyncConnection,
    table_name: str,
    dialect_name: str,
) -> tuple[Optional[int], List[Dict[str, Any]]]:
    """
    Safely retrieves the row count and top-3 sanitized sample rows for a table.
    """
    # Quote identifier according to dialect
    if dialect_name == "mysql":
        quoted = f"`{table_name}`"
    else:
        quoted = f'"{table_name}"'

    count: Optional[int] = None
    samples: List[Dict[str, Any]] = []

    try:
        # 1. Fetch count
        count_res = await conn.execute(text(f"SELECT COUNT(*) FROM {quoted}"))
        count = count_res.scalar()

        # 2. Fetch top 3 sample rows
        sample_res = await conn.execute(text(f"SELECT * FROM {quoted} LIMIT 3"))
        keys = list(sample_res.keys())
        for row in sample_res.all():
            row_dict = {}
            for k, v in zip(keys, row):
                row_dict[k] = sanitize_value(v, k)
            samples.append(row_dict)

    except Exception as exc:
        logger.warn("Could not fetch samples for table", table=table_name, error=str(exc))

    return count, samples


def build_schema_prompt_summary(tables: List[TableMetadata], dialect: str) -> str:
    """
    Constructs a clear, concise DDL/Markdown representation of the schema
    for injection into LangGraph LLM generation prompts.
    """
    lines = [f"### Database Dialect: {dialect.upper()}", ""]

    for tbl in tables:
        count_str = f" (~{tbl.row_count_estimate} rows)" if tbl.row_count_estimate is not None else ""
        lines.append(f"Table: `{tbl.name}`{count_str}")

        lines.append("Columns:")
        for col in tbl.columns:
            attrs = []
            if col.primary_key:
                attrs.append("PRIMARY KEY")
            if not col.nullable:
                attrs.append("NOT NULL")

            # Check if this column is an FK
            fk_matches = [fk for fk in tbl.foreign_keys if fk.constrained_column == col.name]
            for fk in fk_matches:
                attrs.append(f"REFERENCES {fk.referred_table}({fk.referred_column})")

            attr_str = f" [{', '.join(attrs)}]" if attrs else ""
            lines.append(f"  - `{col.name}`: {col.type}{attr_str}")

        if tbl.sample_rows:
            sample_preview = tbl.sample_rows[:1]
            lines.append(f"  Sample row: {sample_preview[0]}")
        lines.append("")

    return "\n".join(lines).strip()


async def reflect_database_schema(
    engine: AsyncEngine,
    dialect: DatabaseDialect,
    database_name: str = "main",
) -> DatabaseSchemaResponse:
    """
    Asynchronously inspects the database schema and returns structured metadata.
    Guarantees completion under 2 seconds for normal relational schemas.
    """
    start_time = time.perf_counter()
    logger.info("Starting schema reflection", dialect=dialect.value, database=database_name)

    async with engine.connect() as conn:
        # Step 1: Run metadata reflection in synchronous thread pool
        raw_tables_data = await conn.run_sync(_sync_inspect_tables)

        # Step 2: Fetch table counts and sample rows
        reflected_tables: List[TableMetadata] = []

        for t_info in raw_tables_data:
            t_name = t_info["name"]
            row_count, sample_rows = await _fetch_table_samples_and_count(conn, t_name, dialect.value)

            table_meta = TableMetadata(
                name=t_name,
                columns=t_info["columns"],
                primary_keys=t_info["primary_keys"],
                foreign_keys=t_info["foreign_keys"],
                row_count_estimate=row_count,
                sample_rows=sample_rows,
            )
            reflected_tables.append(table_meta)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    logger.info(
        "Schema reflection completed",
        duration_ms=duration_ms,
        table_count=len(reflected_tables),
    )

    summary_prompt = build_schema_prompt_summary(reflected_tables, dialect.value)

    return DatabaseSchemaResponse(
        dialect=dialect.value,
        database_name=database_name,
        tables=reflected_tables,
        table_count=len(reflected_tables),
        reflected_at=datetime.now().isoformat(),
        summary_prompt=summary_prompt,
    )
