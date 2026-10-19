"""
DataSpeak Backend — Query & Agent Result Models
Pydantic v2 schemas for natural language queries, execution results,
chart configurations, and narrative summaries.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class QueryAskRequest(BaseModel):
    """Payload for natural language query execution."""
    model_config = ConfigDict(extra="ignore")

    question: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="Plain-English question about the database",
    )

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Question must be at least 2 non-whitespace characters long.")
        return cleaned


class ChartConfigResponse(BaseModel):
    """Dynamic chart recommendation specification for Recharts."""
    model_config = ConfigDict(extra="ignore")

    type: Literal["bar", "line", "pie", "none"] = Field(
        default="none",
        description="Recommended chart type: bar, line, pie, or none",
    )
    x_key: Optional[str] = Field(
        default=None,
        description="Field key for X axis / categorical dimension",
    )
    y_key: Optional[str] = Field(
        default=None,
        description="Field key for Y axis / numeric metric",
    )
    title: Optional[str] = Field(
        default=None,
        description="Display title for the chart visualization",
    )


class QueryAskResponse(BaseModel):
    """Full conversational query result payload returned to the frontend."""
    model_config = ConfigDict(extra="ignore")

    sql: str = Field(
        default="",
        description="The validated and executed dialect-specific SQL statement",
    )
    columns: List[str] = Field(
        default_factory=list,
        description="List of column names returned by query execution",
    )
    rows: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Result rows as key-value dictionaries",
    )
    row_count: int = Field(
        default=0,
        description="Total number of rows returned (bounded by safety limit)",
    )
    execution_time_ms: float = Field(
        default=0.0,
        description="Database query execution time in milliseconds",
    )
    chart: Optional[ChartConfigResponse] = Field(
        default=None,
        description="Automated chart visualization recommendation",
    )
    summary: str = Field(
        default="",
        description="Plain-English summary of the findings for non-technical users",
    )
    status: Literal["success", "error", "blocked"] = Field(
        default="success",
        description="Overall outcome of the request: success, error, or blocked (guardrail violation)",
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Sanitized, user-friendly error message if query failed or was blocked",
    )
