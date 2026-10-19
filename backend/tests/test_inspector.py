"""
DataSpeak Backend — Database Schema Inspector Tests
Tests asynchronous schema reflection, table metadata, primary/foreign keys, and data sampling.
"""

from __future__ import annotations

import time
import pytest
from app.db.connection import build_async_engine
from app.db.inspector import (
    build_schema_prompt_summary,
    is_sensitive_column,
    is_system_table,
    reflect_database_schema,
    sanitize_value,
)
from app.models.connection import ConnectionParams


def test_helper_predicates():
    """Test system table and sensitive column identification."""
    assert is_system_table("sqlite_sequence") is True
    assert is_system_table("pg_stat_activity") is True
    assert is_system_table("information_schema_tables") is True
    assert is_system_table("customers") is False

    assert is_sensitive_column("password_hash") is True
    assert is_sensitive_column("user_secret") is True
    assert is_sensitive_column("api_key") is True
    assert is_sensitive_column("first_name") is False
    assert is_sensitive_column("email") is False


def test_sanitize_value():
    """Verify masking of sensitive columns and serialization of complex types."""
    assert sanitize_value("super_secret", "password") == "[REDACTED]"
    assert sanitize_value("123456", "token") == "[REDACTED]"
    assert sanitize_value("John", "first_name") == "John"
    assert sanitize_value(None, "anything") is None


@pytest.mark.asyncio
async def test_reflect_database_schema_sample_db():
    """Verify schema reflection accurately extracts tables, columns, keys, and samples in <2s."""
    params = ConnectionParams(is_sample_db=True)
    engine, dialect = build_async_engine(params)

    start_time = time.perf_counter()
    schema = await reflect_database_schema(engine, dialect, database_name="demo_ecommerce.db")
    duration = time.perf_counter() - start_time

    await engine.dispose()

    # Success criteria: completes in under 2 seconds
    assert duration < 2.0, f"Schema reflection took {duration:.2f}s, expected < 2.0s"

    assert schema.dialect == "sqlite"
    assert schema.table_count == 6
    assert schema.database_name == "demo_ecommerce.db"

    table_map = {t.name: t for t in schema.tables}
    expected_tables = {"categories", "customers", "products", "orders", "order_items", "reviews"}
    assert set(table_map.keys()) == expected_tables

    # ── Check customers table ────────────────────────────────────────────────
    cust_table = table_map["customers"]
    assert cust_table.primary_keys == ["id"]
    assert cust_table.row_count_estimate == 15
    assert len(cust_table.sample_rows) == 3
    col_names = [c.name for c in cust_table.columns]
    assert "email" in col_names
    assert "city" in col_names
    assert "country" in col_names

    # ── Check foreign keys on order_items ────────────────────────────────────
    item_table = table_map["order_items"]
    assert len(item_table.foreign_keys) == 2
    fk_referred = {(fk.constrained_column, fk.referred_table, fk.referred_column) for fk in item_table.foreign_keys}
    assert ("order_id", "orders", "id") in fk_referred
    assert ("product_id", "products", "id") in fk_referred

    # ── Check foreign keys on orders ─────────────────────────────────────────
    order_table = table_map["orders"]
    assert any(fk.constrained_column == "customer_id" and fk.referred_table == "customers" for fk in order_table.foreign_keys)

    # ── Check prompt summary generation ─────────────────────────────────────
    prompt = schema.summary_prompt
    assert "Database Dialect: SQLITE" in prompt
    assert "Table: `customers`" in prompt
    assert "Table: `orders`" in prompt
    assert "PRIMARY KEY" in prompt
    assert "REFERENCES" in prompt
