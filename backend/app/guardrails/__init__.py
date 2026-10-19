"""
DataSpeak Backend — SQL Guardrails Package
AST validation and safety row limiting using sqlglot.
"""

from app.guardrails.validator import (
    ForbiddenStatementError,
    MultiStatementError,
    SQLGuardrailError,
    SQLGuardrailValidator,
    SQLSyntaxError,
    ValidationResult,
    default_validator,
    validate_sql,
)
from app.guardrails.sanitizer import (
    apply_row_limit,
    sanitize_and_format_sql,
    validate_and_sanitize_sql,
)

__all__ = [
    "ForbiddenStatementError",
    "MultiStatementError",
    "SQLGuardrailError",
    "SQLGuardrailValidator",
    "SQLSyntaxError",
    "ValidationResult",
    "default_validator",
    "validate_sql",
    "apply_row_limit",
    "sanitize_and_format_sql",
    "validate_and_sanitize_sql",
]
