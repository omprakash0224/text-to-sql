"""
DataSpeak Backend — Query History API Router
Provides multi-tenant endpoints for listing, searching, bookmarking,
deleting, and batch-importing query execution histories.
"""

from __future__ import annotations

import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.logging import get_logger
from app.core.rate_limit import RateLimiter, RateLimitResult
from app.db.app_database import get_app_db
from app.db.repositories.history_repository import HistoryRepository
from app.models.history import (
    BatchImportResponse,
    DeleteHistoryResponse,
    QueryHistoryBatchImportRequest,
    QueryHistoryItemResponse,
    QueryHistoryListResponse,
)
from app.models.user import AuthenticatedUser

logger = get_logger("api.v1.history")

router = APIRouter(prefix="/history", tags=["history"])


@router.get(
    "",
    response_model=QueryHistoryListResponse,
    summary="List query history",
    description="Retrieve paginated query history for the authenticated user with search and bookmark filters.",
)
async def list_query_history(
    saved_only: bool = Query(default=False, description="Filter only bookmarked/starred queries"),
    q: Optional[str] = Query(default=None, description="Search query across question text or SQL"),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=60, seconds=60, namespace="history_list")
    ),
) -> QueryHistoryListResponse:
    """Retrieve paginated user query history."""
    user_id = current_user.user_id
    items, total_count = await HistoryRepository.list_query_history(
        db=db,
        user_id=user_id,
        page=page,
        page_size=limit,
        is_saved=True if saved_only else None,
        search_q=q,
    )

    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

    return QueryHistoryListResponse(
        items=[m.to_pydantic() for m in items],
        total_count=total_count,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.post(
    "/import",
    response_model=BatchImportResponse,
    summary="Batch import localStorage query history",
    description="Migrate legacy client-side localStorage query history items to the server.",
)
async def batch_import_history(
    payload: QueryHistoryBatchImportRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=30, seconds=60, namespace="history_import")
    ),
) -> BatchImportResponse:
    """Batch import client-side queries for current user."""
    user_id = current_user.user_id
    imported_count = await HistoryRepository.batch_import_history(
        db=db,
        user_id=user_id,
        items=payload.items,
    )
    logger.info("Batch imported query history", user_id=user_id, count=imported_count)
    return BatchImportResponse(
        success=True,
        imported_count=imported_count,
        message=f"Successfully imported {imported_count} queries.",
    )


@router.get(
    "/{id}",
    response_model=QueryHistoryItemResponse,
    summary="Get single query history item",
    description="Fetch full details of a specific historical query record.",
)
async def get_query_history_item(
    id: str = Path(..., description="Unique ID of the query history item"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=60, seconds=60, namespace="history_get")
    ),
) -> QueryHistoryItemResponse:
    """Retrieve single historical query ensuring tenant isolation."""
    item = await HistoryRepository.get_by_id(db=db, user_id=current_user.user_id, query_id=id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query history item not found.",
        )
    return item.to_pydantic()


@router.post(
    "/{id}/toggle-save",
    response_model=QueryHistoryItemResponse,
    summary="Toggle bookmark status",
    description="Bookmark or unbookmark a historical query.",
)
async def toggle_save_query(
    id: str = Path(..., description="Unique ID of the query history item"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=60, seconds=60, namespace="history_toggle")
    ),
) -> QueryHistoryItemResponse:
    """Toggle the bookmark (is_saved) flag for a query."""
    item = await HistoryRepository.toggle_save_query(db=db, user_id=current_user.user_id, query_id=id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query history item not found.",
        )
    return item.to_pydantic()


@router.delete(
    "/{id}",
    response_model=DeleteHistoryResponse,
    summary="Delete a query history item",
    description="Permanently delete a specific historical query.",
)
async def delete_query_history_item(
    id: str = Path(..., description="Unique ID of the query to delete"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=30, seconds=60, namespace="history_delete")
    ),
) -> DeleteHistoryResponse:
    """Delete a single query record owned by the authenticated user."""
    deleted = await HistoryRepository.delete_query_history_item(
        db=db,
        user_id=current_user.user_id,
        query_id=id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query history item not found.",
        )
    return DeleteHistoryResponse(
        success=True,
        message="Query history item deleted successfully.",
        id=id,
    )


@router.delete(
    "",
    response_model=DeleteHistoryResponse,
    summary="Clear unsaved query history",
    description="Clear all recent unsaved queries while preserving bookmarked (saved) items.",
)
async def clear_recent_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=10, seconds=60, namespace="history_clear")
    ),
) -> DeleteHistoryResponse:
    """Clear unsaved queries for the current user."""
    deleted_count = await HistoryRepository.clear_recent_history(
        db=db,
        user_id=current_user.user_id,
    )
    logger.info("Cleared recent history", user_id=current_user.user_id, deleted_count=deleted_count)
    return DeleteHistoryResponse(
        success=True,
        message=f"Cleared {deleted_count} recent queries.",
        deleted_count=deleted_count,
    )
