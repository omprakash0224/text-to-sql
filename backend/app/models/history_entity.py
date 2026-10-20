"""
DataSpeak Backend — Query History ORM Entity
SQLAlchemy 2.0 mapped model for query_history table in the internal application database.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Index,
    Integer,
    JSON,
    String,
    Text,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.models.history import QueryHistoryItem


class Base(DeclarativeBase):
    """Base declarative class for internal application database models."""
    pass


class QueryHistoryItemModel(Base):
    """SQLAlchemy model representing a query history record in query_history table."""

    __tablename__ = "query_history"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
    )
    database_name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        default="database",
    )
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    sql: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="success",
    )
    execution_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )
    row_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    chart_config: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )
    summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )
    is_saved: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("idx_query_history_user_created", "user_id", text("created_at DESC")),
        Index("idx_query_history_user_saved", "user_id", "is_saved"),
    )

    def to_pydantic(self) -> QueryHistoryItem:
        """Convert SQLAlchemy model to Pydantic QueryHistoryItem schema."""
        return QueryHistoryItem(
            id=self.id,
            user_id=self.user_id,
            database_name=self.database_name,
            question=self.question,
            sql=self.sql,
            status=self.status,  # type: ignore[arg-type]
            execution_time_ms=self.execution_time_ms,
            row_count=self.row_count,
            chart_config=self.chart_config,
            summary=self.summary,
            error_message=self.error_message,
            is_saved=self.is_saved,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )
