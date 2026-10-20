"""
DataSpeak Backend — SQL Sanitizer & Safety Row Limiter
Injects mandatory row caps (LIMIT) into validated AST queries and clamps
excessive limits to prevent database Denial-of-Service and memory exhaustion.
"""

from __future__ import annotations

from typing import Optional
from sqlglot import exp

from app.core.config import get_settings
from app.core.logging import get_logger
from app.guardrails.validator import (
    SQLGuardrailValidator,
    ValidationResult,
    default_validator,
    normalize_sqlglot_dialect,
)

logger = get_logger("guardrails.sanitizer")


def apply_row_limit(
    ast: exp.Expression,
    default_limit: Optional[int] = None,
    max_limit: Optional[int] = None,
) -> exp.Expression:
    """
    Enforce row limits on an AST query.
    1. If no LIMIT is present, inject default_limit.
    2. If LIMIT is present and exceeds max_limit, clamp down to max_limit.
    3. If LIMIT <= 0, clamp to default_limit.
    """
    settings = get_settings()
    eff_default = default_limit if default_limit is not None else settings.DEFAULT_QUERY_ROW_LIMIT
    # In general max_limit can be 10x default limit or explicitly configured
    eff_max = max_limit if max_limit is not None else (eff_default * 10)

    # Only apply limits to queries (exp.Query includes Select, Union, etc.)
    if not isinstance(ast, exp.Query):
        return ast

    limit_clause = ast.args.get("limit")

    if limit_clause is None:
        logger.debug("Injecting default query limit", limit=eff_default)
        return ast.limit(eff_default, copy=False)

    # Inspect existing limit
    try:
        limit_expr = limit_clause.expression
        raw_val = int(str(limit_expr.this)) if hasattr(limit_expr, "this") else int(str(limit_expr))
        if raw_val > eff_max:
            logger.info("Clamping excessive limit", requested=raw_val, clamped=eff_max)
            return ast.limit(eff_max, copy=False)
        elif raw_val <= 0:
            logger.info("Replacing non-positive limit", requested=raw_val, clamped=eff_default)
            return ast.limit(eff_default, copy=False)
    except (ValueError, TypeError):
        # If the limit isn't a simple integer (e.g. complex expression), overwrite with default
        logger.info("Overwriting non-integer limit expression with default", clamped=eff_default)
        return ast.limit(eff_default, copy=False)

    return ast


def sanitize_and_format_sql(
    ast: exp.Expression,
    dialect: str = "postgres",
    default_limit: Optional[int] = None,
    max_limit: Optional[int] = None,
) -> str:
    """
    Apply row limit rules and render clean dialect-specific SQL string from AST.
    """
    target_dialect = normalize_sqlglot_dialect(dialect)
    bounded_ast = apply_row_limit(ast, default_limit=default_limit, max_limit=max_limit)
    return bounded_ast.sql(dialect=target_dialect)


def validate_and_sanitize_sql(
    sql: str,
    dialect: str = "postgres",
    default_limit: Optional[int] = None,
    max_limit: Optional[int] = None,
    validator: Optional[SQLGuardrailValidator] = None,
) -> ValidationResult:
    """
    End-to-end pipeline:
    1. Validates SQL AST (blocks mutations, DDL, stacked statements).
    2. Injects / clamps query row limits.
    3. Returns enriched ValidationResult with sanitized_sql.
    """
    target_dialect = normalize_sqlglot_dialect(dialect)
    v = validator or default_validator
    result = v.validate(sql=sql, dialect=target_dialect)

    if not result.is_valid or result.ast is None:
        return result

    try:
        sanitized = sanitize_and_format_sql(
            ast=result.ast,
            dialect=target_dialect,
            default_limit=default_limit,
            max_limit=max_limit,
        )
        result.sanitized_sql = sanitized
        return result
    except Exception as e:
        logger.error("Failed to sanitize and format validated SQL", error=str(e))
        result.is_valid = False
        result.error_message = f"Failed to sanitize SQL: {str(e)}"
        return result
