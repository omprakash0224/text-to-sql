"""
DataSpeak Backend — Query History Pydantic Models
Pydantic v2 schemas for server-side query history, bookmarks, and pagination.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class QueryHistoryItem(BaseModel):
    """Complete representation of a historical query record."""
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: str = Field(..., description="Unique UUID identifier of the history record")
    user_id: str = Field(..., description="Clerk user_id owning this record")
    database_name: str = Field(default="database", description="Target database identifier or dialect")
    question: str = Field(..., description="Natural language question asked by the user")
    sql: str = Field(default="", description="Generated SQL statement")
    status: Literal["success", "blocked", "error"] = Field(
        default="success",
        description="Query lifecycle status",
    )
    execution_time_ms: float = Field(default=0.0, description="Query execution latency in milliseconds")
    row_count: int = Field(default=0, description="Number of rows returned")
    chart_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dynamic Recharts configuration dictionary",
    )
    summary: Optional[str] = Field(default=None, description="Plain-English insight summary")
    error_message: Optional[str] = Field(default=None, description="Sanitized error or blocked reason")
    is_saved: bool = Field(default=False, description="Flag indicating if query is bookmarked/saved")
    created_at: datetime = Field(..., description="Timestamp when query was asked")
    updated_at: datetime = Field(..., description="Timestamp when query was last modified")


class QueryHistoryCreate(BaseModel):
    """Payload to create a new query history record."""
    model_config = ConfigDict(extra="ignore")

    user_id: str
    database_name: str = "database"
    question: str
    sql: str = ""
    status: Literal["success", "blocked", "error"] = "success"
    execution_time_ms: float = 0.0
    row_count: int = 0
    chart_config: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    error_message: Optional[str] = None
    is_saved: bool = False


class QueryHistoryImport(BaseModel):
    """Payload for importing legacy localStorage queries to the server."""
    model_config = ConfigDict(extra="ignore")

    id: Optional[str] = None
    question: str
    sql: Optional[str] = ""
    status: Optional[Literal["success", "blocked", "error"]] = "success"
    execution_time_ms: Optional[float] = 0.0
    row_count: Optional[int] = 0
    chart_config: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    error_message: Optional[str] = None
    is_saved: Optional[bool] = False
    database_name: Optional[str] = "database"
    created_at: Optional[datetime] = None


class QueryHistoryBatchImportRequest(BaseModel):
    """Batch payload containing client-side localStorage query history items."""
    model_config = ConfigDict(extra="ignore")

    items: List[QueryHistoryImport] = Field(
        default_factory=list,
        description="List of localStorage query items to migrate",
    )


class QueryHistoryListResponse(BaseModel):
    """Paginated response containing list of query history items and metadata."""
    model_config = ConfigDict(extra="ignore")

    items: List[QueryHistoryItem] = Field(..., description="List of history items")
    total_count: int = Field(..., description="Total records matching query criteria")
    page: int = Field(default=1, description="Current page number (1-indexed)")
    page_size: int = Field(default=20, description="Items per page")
    total_pages: int = Field(default=1, description="Total pages available")


# Alias for explicit API response naming
QueryHistoryItemResponse = QueryHistoryItem


class DeleteHistoryResponse(BaseModel):
    """Response returned upon query deletion."""
    model_config = ConfigDict(extra="ignore")

    success: bool = True
    message: str
    id: Optional[str] = None
    deleted_count: Optional[int] = None


class BatchImportResponse(BaseModel):
    """Response returned upon batch importing legacy localStorage queries."""
    model_config = ConfigDict(extra="ignore")

    success: bool = True
    imported_count: int
    message: str
