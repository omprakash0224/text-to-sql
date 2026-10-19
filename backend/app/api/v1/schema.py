"""
DataSpeak Backend — Database Schema Inspection Endpoints
Provides cached schema retrieval and live schema re-indexing.
Protected by Clerk Bearer JWT authentication.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.logging import get_logger
from app.db.inspector import reflect_database_schema
from app.db.session_manager import session_manager
from app.models.schema import DatabaseSchemaResponse
from app.models.user import AuthenticatedUser

logger = get_logger("api.schema")

router = APIRouter(prefix="/schema", tags=["schema"])


@router.get(
    "",
    response_model=DatabaseSchemaResponse,
    summary="Get active database schema",
    description="Returns tables, columns, data types, primary keys, foreign keys, and sample rows for the active database.",
)
async def get_active_schema(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DatabaseSchemaResponse:
    """Retrieve cached database schema metadata for the authenticated user."""
    session = session_manager.get_session(current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active database connected. Please connect a database via /api/v1/connections/connect first.",
        )
    return session.schema


@router.post(
    "/refresh",
    response_model=DatabaseSchemaResponse,
    summary="Refresh active database schema",
    description="Forces re-reflection of the active database connection to pick up recent schema or data changes.",
)
async def refresh_active_schema(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DatabaseSchemaResponse:
    """Re-inspect target database schema and update session cache."""
    session = session_manager.get_session(current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active database connected to refresh.",
        )

    logger.info("Refreshing database schema", user_id=current_user.user_id)

    try:
        new_schema = await reflect_database_schema(
            engine=session.engine,
            dialect=session.connection_info.dialect,
            database_name=session.connection_info.database or "main",
        )
        await session_manager.update_schema(current_user.user_id, new_schema)
        return new_schema

    except Exception as exc:
        logger.error("Failed to refresh schema", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Schema refresh failed: {str(exc)}",
        )
