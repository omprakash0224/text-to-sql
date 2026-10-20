"""
DataSpeak Backend — Query History Repository
Handles database persistence, multi-tenant isolation, search filtering,
and bookmarking operations for query_history in the application database.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.history import QueryHistoryCreate, QueryHistoryImport
from app.models.history_entity import QueryHistoryItemModel


class HistoryRepository:
    """Repository encapsulating all query_history database operations."""

    @staticmethod
    async def create_query_history(
        db: AsyncSession,
        item: QueryHistoryCreate,
    ) -> QueryHistoryItemModel:
        """Create and persist a new query history record."""
        model = QueryHistoryItemModel(
            id=str(uuid.uuid4()),
            user_id=item.user_id,
            database_name=item.database_name,
            question=item.question,
            sql=item.sql,
            status=item.status,
            execution_time_ms=item.execution_time_ms,
            row_count=item.row_count,
            chart_config=item.chart_config,
            summary=item.summary,
            error_message=item.error_message,
            is_saved=item.is_saved,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(model)
        await db.commit()
        await db.refresh(model)
        return model

    @staticmethod
    async def list_query_history(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        is_saved: Optional[bool] = None,
        search_q: Optional[str] = None,
    ) -> Tuple[List[QueryHistoryItemModel], int]:
        """
        Retrieve paginated query history for a specific user.
        Supports filtering by is_saved flag and case-insensitive question search.
        """
        # Base filter enforcing multi-tenant isolation
        filters = [QueryHistoryItemModel.user_id == user_id]

        if is_saved is not None:
            filters.append(QueryHistoryItemModel.is_saved == is_saved)

        if search_q and search_q.strip():
            clean_search = f"%{search_q.strip()}%"
            filters.append(
                (QueryHistoryItemModel.question.ilike(clean_search))
                | (QueryHistoryItemModel.sql.ilike(clean_search))
            )

        # Count total matching records
        count_stmt = select(func.count(QueryHistoryItemModel.id)).where(*filters)
        total_res = await db.execute(count_stmt)
        total_count = total_res.scalar() or 0

        # Paginated items ordered by most recent first
        offset = max(0, (page - 1) * page_size)
        items_stmt = (
            select(QueryHistoryItemModel)
            .where(*filters)
            .order_by(QueryHistoryItemModel.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items_res = await db.execute(items_stmt)
        items = list(items_res.scalars().all())

        return items, total_count

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        user_id: str,
        query_id: str,
    ) -> Optional[QueryHistoryItemModel]:
        """Retrieve a specific history item ensuring tenant ownership."""
        stmt = select(QueryHistoryItemModel).where(
            QueryHistoryItemModel.id == query_id,
            QueryHistoryItemModel.user_id == user_id,
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def toggle_save_query(
        db: AsyncSession,
        user_id: str,
        query_id: str,
    ) -> Optional[QueryHistoryItemModel]:
        """Toggle the bookmark (is_saved) status of a user's query."""
        model = await HistoryRepository.get_by_id(db, user_id=user_id, query_id=query_id)
        if not model:
            return None

        model.is_saved = not model.is_saved
        model.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(model)
        return model

    @staticmethod
    async def delete_query_history_item(
        db: AsyncSession,
        user_id: str,
        query_id: str,
    ) -> bool:
        """Delete a single query history item owned by the user."""
        model = await HistoryRepository.get_by_id(db, user_id=user_id, query_id=query_id)
        if not model:
            return False

        await db.delete(model)
        await db.commit()
        return True

    @staticmethod
    async def clear_recent_history(
        db: AsyncSession,
        user_id: str,
    ) -> int:
        """
        Delete all unsaved queries for a user while preserving bookmarked (is_saved=True) queries.
        Returns the count of deleted records.
        """
        stmt = (
            delete(QueryHistoryItemModel)
            .where(
                QueryHistoryItemModel.user_id == user_id,
                QueryHistoryItemModel.is_saved.is_(False),
            )
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount or 0

    @staticmethod
    async def batch_import_history(
        db: AsyncSession,
        user_id: str,
        items: List[QueryHistoryImport],
    ) -> int:
        """
        Batch import client-side localStorage items on initial sync.
        Prevents duplicate imports if ID matches an existing record.
        """
        if not items:
            return 0

        imported_count = 0
        for item in items:
            record_id = item.id or str(uuid.uuid4())

            # Check if record already exists to prevent duplicate insertion
            existing = await HistoryRepository.get_by_id(db, user_id=user_id, query_id=record_id)
            if existing:
                continue

            created_time = item.created_at or datetime.now(timezone.utc)
            model = QueryHistoryItemModel(
                id=record_id,
                user_id=user_id,
                database_name=item.database_name or "database",
                question=item.question,
                sql=item.sql or "",
                status=item.status or "success",
                execution_time_ms=item.execution_time_ms or 0.0,
                row_count=item.row_count or 0,
                chart_config=item.chart_config,
                summary=item.summary,
                error_message=item.error_message,
                is_saved=item.is_saved or False,
                created_at=created_time,
                updated_at=created_time,
            )
            db.add(model)
            imported_count += 1

        if imported_count > 0:
            await db.commit()

        return imported_count
