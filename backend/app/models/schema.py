"""
DataSpeak Backend — Database Schema Models
Pydantic v2 schemas for reflected tables, columns, constraints, and LLM schema context.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ColumnMetadata(BaseModel):
    """Reflected column metadata."""
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Column identifier")
    type: str = Field(..., description="SQL data type representation, e.g. VARCHAR(255), INTEGER")
    nullable: bool = Field(default=True, description="Whether the column accepts NULL values")
    primary_key: bool = Field(default=False, description="Whether this column is part of the primary key")
    default_value: Optional[str] = Field(default=None, description="Default value expression if any")


class ForeignKeyMetadata(BaseModel):
    """Foreign key relationship between tables."""
    model_config = ConfigDict(extra="ignore")

    constrained_column: str = Field(..., description="Column in current table that holds the FK reference")
    referred_table: str = Field(..., description="Target table referenced by this key")
    referred_column: str = Field(..., description="Target column in referenced table")


class TableMetadata(BaseModel):
    """Reflected table metadata with schema and semantic sample rows."""
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Table name")
    columns: List[ColumnMetadata] = Field(default_factory=list, description="List of columns")
    primary_keys: List[str] = Field(default_factory=list, description="Primary key column names")
    foreign_keys: List[ForeignKeyMetadata] = Field(default_factory=list, description="Foreign key relationships")
    row_count_estimate: Optional[int] = Field(default=None, description="Estimated or exact row count")
    sample_rows: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Top 3 sanitized sample rows for semantic context",
    )


class DatabaseSchemaResponse(BaseModel):
    """Full database schema reflection payload."""
    model_config = ConfigDict(extra="ignore")

    dialect: str = Field(..., description="Database engine dialect (postgresql, mysql, sqlite)")
    database_name: str = Field(..., description="Name of database or schema")
    tables: List[TableMetadata] = Field(default_factory=list, description="List of reflected tables")
    table_count: int = Field(default=0, description="Total number of reflected tables")
    reflected_at: str = Field(..., description="ISO 8601 timestamp of schema reflection")
    summary_prompt: str = Field(
        default="",
        description="Pre-formatted schema DDL context ready for LLM prompt injection in Phase 4",
    )
