"""
DataSpeak Backend — SQL AST Guardrail Unit Tests
Verifies 100% rejection of mutations, DDL, stacked queries, and verifies LIMIT injection.
"""

import pytest
from app.guardrails.validator import (
    SQLGuardrailValidator,
    validate_sql,
)
from app.guardrails.sanitizer import (
    apply_row_limit,
    validate_and_sanitize_sql,
)


@pytest.fixture
def validator():
    return SQLGuardrailValidator(default_dialect="postgres")


# ============================================================================
# 1. PERMITTED READ-ONLY QUERIES (Should all pass and get row limit)
# ============================================================================

SAFE_QUERIES = [
    # Simple SELECT
    "SELECT id, name, email FROM customers",
    # SELECT with filter
    "SELECT * FROM products WHERE price > 50.0 AND in_stock = true",
    # Aggregation & GROUP BY
    "SELECT category, COUNT(*), AVG(price) FROM products GROUP BY category HAVING COUNT(*) > 5",
    # Multi-table JOIN
    (
        "SELECT c.name, o.id, o.total_amount "
        "FROM customers c "
        "INNER JOIN orders o ON c.id = o.customer_id "
        "WHERE o.status = 'completed'"
    ),
    # Common Table Expression (CTE)
    (
        "WITH regional_sales AS ("
        "  SELECT region, SUM(amount) AS total_sales "
        "  FROM orders "
        "  GROUP BY region"
        ") "
        "SELECT region, total_sales FROM regional_sales WHERE total_sales > 10000"
    ),
    # Subqueries
    (
        "SELECT name, price FROM products "
        "WHERE price > (SELECT AVG(price) FROM products)"
    ),
    # UNION query
    "SELECT id, name FROM active_users UNION ALL SELECT id, name FROM archived_users",
    # CASE statement
    (
        "SELECT id, "
        "  CASE WHEN total > 100 THEN 'high' ELSE 'low' END AS tier "
        "FROM orders"
    ),
    # SQL with comments
    (
        "-- Retrieve top customers\n"
        "SELECT id, name FROM customers /* inline comment */ WHERE active = 1"
    ),
]


@pytest.mark.parametrize("query", SAFE_QUERIES)
def test_safe_queries_pass_validation(validator, query):
    result = validator.validate(query)
    assert result.is_valid is True, f"Expected safe query to pass: {result.error_message}"
    assert result.error_message is None


@pytest.mark.parametrize("query", SAFE_QUERIES)
def test_safe_queries_receive_row_limit(query):
    result = validate_and_sanitize_sql(query, default_limit=100)
    assert result.is_valid is True
    assert result.sanitized_sql is not None
    assert "LIMIT" in result.sanitized_sql.upper()


# ============================================================================
# 2. PROHIBITED MUTATIONS & DDL STATEMENTS (Must be 100% blocked)
# ============================================================================

FORBIDDEN_QUERIES = [
    # DDL: Drop table / database
    "DROP TABLE customers",
    "DROP TABLE IF EXISTS orders CASCADE",
    "DROP DATABASE analytics",
    # DDL: Truncate
    "TRUNCATE TABLE audit_logs",
    "TRUNCATE logs",
    # DDL: Alter
    "ALTER TABLE users ADD COLUMN is_admin BOOLEAN",
    "ALTER TABLE customers DROP COLUMN secret_token",
    # DDL: Create
    "CREATE TABLE malicious_table (id INT PRIMARY KEY)",
    "CREATE INDEX idx_evil ON users(password_hash)",
    # DML: Delete
    "DELETE FROM users WHERE id = 1",
    "DELETE FROM orders",
    # DML: Update
    "UPDATE users SET is_admin = true WHERE id = 42",
    "UPDATE products SET price = 0.01",
    # DML: Insert
    "INSERT INTO users (id, name, email) VALUES (999, 'Hacker', 'hacker@evil.com')",
    "INSERT INTO logs SELECT * FROM audit_archive",
    # Administrative & Permissions
    "GRANT ALL PRIVILEGES ON *.* TO 'attacker'@'%'",
    "REVOKE SELECT ON users FROM 'analyst'",
    # Data-modifying CTE (PostgreSQL bypass vector)
    "WITH deleted AS (DELETE FROM users WHERE active = false RETURNING *) SELECT * FROM deleted",
]


@pytest.mark.parametrize("query", FORBIDDEN_QUERIES)
def test_forbidden_mutations_are_blocked(validator, query):
    result = validator.validate(query)
    assert result.is_valid is False, f"Vulnerability: Forbidden query was permitted: {query}"
    assert result.error_message is not None


# ============================================================================
# 3. MULTI-STATEMENT & STACKED QUERIES (SQL Injection Defense)
# ============================================================================

STACKED_QUERIES = [
    "SELECT 1; DROP TABLE users;",
    "SELECT * FROM customers; DELETE FROM orders;",
    "SELECT id FROM products; UPDATE products SET price = 0;",
    "SELECT 1; SELECT 2;",
    "SELECT * FROM a; SELECT * FROM b; SELECT * FROM c;",
]


@pytest.mark.parametrize("query", STACKED_QUERIES)
def test_multi_statement_queries_are_blocked(validator, query):
    result = validator.validate(query)
    assert result.is_valid is False
    assert "Multi-statement" in result.error_message or "Forbidden" in result.error_message


def test_trailing_semicolon_on_single_query_is_permitted(validator):
    # Trailing semicolon without a second query should be permitted cleanly
    result = validator.validate("SELECT id, name FROM customers;")
    assert result.is_valid is True

    result_spaces = validator.validate("SELECT id, name FROM customers;   \n")
    assert result_spaces.is_valid is True


# ============================================================================
# 4. SAFETY ROW CAP (LIMIT) INJECTION & CLAMPING
# ============================================================================

def test_missing_limit_gets_default_injected():
    result = validate_and_sanitize_sql("SELECT id FROM users", default_limit=100)
    assert result.is_valid is True
    assert "LIMIT 100" in result.sanitized_sql


def test_existing_lower_limit_is_preserved():
    result = validate_and_sanitize_sql("SELECT id FROM users LIMIT 25", default_limit=100)
    assert result.is_valid is True
    assert "LIMIT 25" in result.sanitized_sql


def test_excessive_limit_is_clamped_to_max():
    # Max limit = 500, user requested 100000
    result = validate_and_sanitize_sql(
        "SELECT id FROM users LIMIT 100000",
        default_limit=100,
        max_limit=500,
    )
    assert result.is_valid is True
    assert "LIMIT 500" in result.sanitized_sql


def test_zero_or_negative_limit_is_clamped_to_default():
    result = validate_and_sanitize_sql("SELECT id FROM users LIMIT 0", default_limit=100)
    assert result.is_valid is True
    assert "LIMIT 100" in result.sanitized_sql


# ============================================================================
# 5. DIALECT SUPPORT (PostgreSQL, MySQL, SQLite)
# ============================================================================

def test_postgresql_dialect():
    query = "SELECT id, name FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
    result = validate_and_sanitize_sql(query, dialect="postgres")
    assert result.is_valid is True
    assert "LIMIT 100" in result.sanitized_sql

    # Also verify 'postgresql' dialect string from DatabaseDialect.POSTGRESQL
    result_pg = validate_and_sanitize_sql(query, dialect="postgresql")
    assert result_pg.is_valid is True
    assert "LIMIT 100" in result_pg.sanitized_sql


def test_mysql_dialect():
    query = "SELECT `id`, `name` FROM `users` WHERE `active` = 1"
    result = validate_and_sanitize_sql(query, dialect="mysql")
    assert result.is_valid is True
    assert "LIMIT 100" in result.sanitized_sql


def test_sqlite_dialect():
    query = "SELECT id, json_extract(data, '$.key') FROM items"
    result = validate_and_sanitize_sql(query, dialect="sqlite")
    assert result.is_valid is True
    assert "LIMIT 100" in result.sanitized_sql


# ============================================================================
# 6. EDGE CASES & SYNTAX ERRORS
# ============================================================================

def test_empty_query_returns_invalid(validator):
    assert validator.validate("").is_valid is False
    assert validator.validate("   \n\t  ").is_valid is False


def test_syntax_error_returns_invalid(validator):
    result = validator.validate("SELECT FROM WHERE")
    assert result.is_valid is False
    assert "SQL syntax error" in result.error_message
