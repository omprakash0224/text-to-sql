"""
DataSpeak Backend — SQL AST Guardrail Validator
Enforces zero-trust read-only SQL execution using sqlglot AST analysis.
Strictly blocks all DDL, DML mutations, administrative commands, and stacked statements.
"""

from __future__ import annotations

from typing import Optional, Sequence, Tuple, Type
import sqlglot
from sqlglot import exp
from sqlglot.errors import ParseError

from app.core.logging import get_logger

logger = get_logger("guardrails.validator")


# ── Custom Guardrail Exceptions ──────────────────────────────────────────────
class SQLGuardrailError(Exception):
    """Base exception for all SQL guardrail violations."""

    def __init__(self, message: str, code: str = "GUARDRAIL_VIOLATION"):
        super().__init__(message)
        self.message = message
        self.code = code


class ForbiddenStatementError(SQLGuardrailError):
    """Raised when an unauthorized mutation, DDL, or non-SELECT statement is detected."""

    def __init__(self, message: str, statement_type: str = "UNKNOWN"):
        super().__init__(message, code="FORBIDDEN_STATEMENT")
        self.statement_type = statement_type


class MultiStatementError(SQLGuardrailError):
    """Raised when multiple SQL statements or semicolon-stacked commands are detected."""

    def __init__(self, message: str = "Stacked/multi-statement queries are prohibited"):
        super().__init__(message, code="MULTI_STATEMENT_DETECTED")


class SQLSyntaxError(SQLGuardrailError):
    """Raised when the SQL query cannot be parsed into a valid AST."""

    def __init__(self, message: str):
        super().__init__(message, code="SQL_SYNTAX_ERROR")


# ── Prohibited AST Node Types ────────────────────────────────────────────────
# Any AST node matching these types anywhere in the tree triggers immediate rejection.
FORBIDDEN_AST_NODES: Tuple[Type[exp.Expression], ...] = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Alter,
    exp.TruncateTable,
    exp.Create,
    exp.Command,
    exp.Transaction,
    exp.Commit,
    exp.Rollback,
    exp.Merge,
    exp.Copy,
    exp.Grant,
    exp.Revoke,
    exp.Into,
)


class ValidationResult:
    """Holds the result of SQL AST validation and sanitization."""

    def __init__(
        self,
        is_valid: bool,
        original_sql: str,
        sanitized_sql: Optional[str] = None,
        error_message: Optional[str] = None,
        statement_type: Optional[str] = None,
        dialect: str = "postgres",
        ast: Optional[exp.Expression] = None,
        error_code: Optional[str] = None,
    ):
        self.is_valid = is_valid
        self.original_sql = original_sql
        self.sanitized_sql = sanitized_sql
        self.error_message = error_message
        self.statement_type = statement_type
        self.dialect = dialect
        self.ast = ast
        self.error_code = error_code or (
            "MULTI_STATEMENT_DETECTED" if statement_type == "MULTIPLE"
            else "FORBIDDEN_STATEMENT" if statement_type
            else "SQL_SYNTAX_ERROR" if error_message
            else None
        )


    def __repr__(self) -> str:
        return (
            f"<ValidationResult valid={self.is_valid} "
            f"type={self.statement_type} "
            f"error={self.error_message!r}>"
        )


def normalize_sqlglot_dialect(dialect: Optional[str]) -> str:
    """Map database dialect string to sqlglot's recognized canonical dialect identifier."""
    if not dialect:
        return "postgres"
    d = dialect.lower().strip()
    if d in ("postgresql", "postgres", "pgsql"):
        return "postgres"
    if d in ("sqlite", "sqlite3"):
        return "sqlite"
    if d in ("mysql", "mariadb"):
        return "mysql"
    return d


class SQLGuardrailValidator:
    """
    Validates that a SQL string is strictly a single, read-only SELECT query.
    Utilizes sqlglot AST parsing to prevent injection bypasses.
    """

    def __init__(self, default_dialect: str = "postgres"):
        self.default_dialect = normalize_sqlglot_dialect(default_dialect)

    def validate(
        self,
        sql: str,
        dialect: Optional[str] = None,
    ) -> ValidationResult:
        """
        Validate that the provided SQL is strictly a single, read-only SELECT query.
        Returns a ValidationResult object. Raises specific exceptions if requested.
        """
        target_dialect = normalize_sqlglot_dialect(dialect or self.default_dialect)
        stripped_sql = sql.strip() if sql else ""

        if not stripped_sql:
            return ValidationResult(
                is_valid=False,
                original_sql=sql,
                error_message="Query string cannot be empty.",
                dialect=target_dialect,
            )

        # ── 1. Parse All Statements (Multi-Statement Check) ──────────────────
        try:
            parsed_statements = sqlglot.parse(stripped_sql, read=target_dialect)
        except ParseError as e:
            logger.warn("SQL syntax parse error", error=str(e), sql=stripped_sql[:80])
            return ValidationResult(
                is_valid=False,
                original_sql=sql,
                error_message=f"SQL syntax error: {str(e)}",
                dialect=target_dialect,
            )
        except Exception as e:
            logger.warn("Unexpected parser error", error=str(e))
            return ValidationResult(
                is_valid=False,
                original_sql=sql,
                error_message=f"Unable to parse query: {str(e)}",
                dialect=target_dialect,
            )

        # Filter out trailing empty/None statements from trailing semicolons
        active_statements = [s for s in parsed_statements if s is not None]

        if len(active_statements) == 0:
            return ValidationResult(
                is_valid=False,
                original_sql=sql,
                error_message="No executable SQL statements found.",
                dialect=target_dialect,
            )

        if len(active_statements) > 1:
            logger.warn(
                "Multi-statement query blocked",
                statement_count=len(active_statements),
                sql=stripped_sql[:80],
            )
            return ValidationResult(
                is_valid=False,
                original_sql=sql,
                error_message=(
                    f"Multi-statement query detected ({len(active_statements)} statements). "
                    "Only single read-only queries are permitted."
                ),
                statement_type="MULTIPLE",
                dialect=target_dialect,
            )

        statement = active_statements[0]
        statement_class_name = statement.__class__.__name__

        # ── 2. Strictly Enforce Read-Only Root Expression (exp.Query) ────────
        # exp.Query covers exp.Select, exp.Union, exp.Intersect, exp.Except
        if not isinstance(statement, exp.Query):
            logger.warn(
                "Non-query root statement blocked",
                statement_type=statement_class_name,
                sql=stripped_sql[:80],
            )
            return ValidationResult(
                is_valid=False,
                original_sql=sql,
                error_message=(
                    f"Forbidden statement type '{statement_class_name.upper()}'. "
                    "Only read-only SELECT queries are permitted."
                ),
                statement_type=statement_class_name,
                dialect=target_dialect,
            )

        # ── 3. Deep AST Traversal for Nested Mutation / DDL Nodes ────────────
        for forbidden_type in FORBIDDEN_AST_NODES:
            found_nodes = list(statement.find_all(forbidden_type))
            if found_nodes:
                forbidden_name = forbidden_type.__name__.upper()
                logger.warn(
                    "Nested mutation node blocked",
                    forbidden_type=forbidden_name,
                    count=len(found_nodes),
                )
                return ValidationResult(
                    is_valid=False,
                    original_sql=sql,
                    error_message=(
                        f"Forbidden nested mutation '{forbidden_name}' detected. "
                        "All mutations and DDL are strictly prohibited."
                    ),
                    statement_type=forbidden_name,
                    dialect=target_dialect,
                )

        # Statement is clean, read-only, and safe
        return ValidationResult(
            is_valid=True,
            original_sql=sql,
            statement_type=statement_class_name,
            dialect=target_dialect,
            ast=statement,
        )


# Singleton instance
default_validator = SQLGuardrailValidator()


def validate_sql(sql: str, dialect: str = "postgres") -> ValidationResult:
    """Convenience helper using the default validator singleton."""
    return default_validator.validate(sql=sql, dialect=dialect)
