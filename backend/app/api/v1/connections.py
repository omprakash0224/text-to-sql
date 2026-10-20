"""
DataSpeak Backend — Database Connection Endpoints
Provides test, connect, current status, and disconnect operations.
Protected by Clerk Bearer JWT authentication.
"""

from __future__ import annotations

from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.logging import get_logger
from app.core.rate_limit import RateLimiter, RateLimitResult
from app.db.connection import (
    build_async_engine,
    test_connection,
    _sanitize_connection_error,
)
from app.db.inspector import reflect_database_schema
from app.db.session_manager import session_manager
from app.models.connection import (
    ConnectionConnectRequest,
    ConnectionInfoResponse,
    ConnectionTestRequest,
    ConnectionTestResponse,
    DatabaseDialect,
)
from app.models.user import AuthenticatedUser

logger = get_logger("api.connections")

router = APIRouter(prefix="/connections", tags=["connections"])


@router.post(
    "/test",
    response_model=ConnectionTestResponse,
    summary="Test database connectivity",
    description="Validates connection parameters and tests latency/reachability without creating a session.",
)
async def test_database_connection(
    request: ConnectionTestRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=30, seconds=60, namespace="connections")
    ),
) -> ConnectionTestResponse:
    """Test connectivity against the target database."""
    logger.info("Testing database connection", user_id=current_user.user_id, is_sample=request.is_sample_db)
    return await test_connection(request)


@router.post(
    "/connect",
    response_model=ConnectionInfoResponse,
    summary="Establish active database connection",
    description="Validates credentials, establishes connection pool, inspects schema, and registers user session.",
)
async def connect_database(
    request: ConnectionConnectRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(times=30, seconds=60, namespace="connections")
    ),
) -> ConnectionInfoResponse:
    """Connect to database, reflect schema, and store in tenant session cache."""
    logger.info("Establishing database connection", user_id=current_user.user_id, is_sample=request.is_sample_db)

    try:
        # 1. Build persistent pooled engine
        engine, dialect = build_async_engine(request, is_transient=False)

        # 2. Perform schema reflection
        db_name = request.database or ("demo_ecommerce.db" if request.is_sample_db else "main")
        schema_response = await reflect_database_schema(engine, dialect, database_name=db_name)

        # 3. Formulate safe public connection metadata
        conn_id = str(uuid.uuid4())
        display_name = request.name or (
            "Sample E-Commerce Database" if request.is_sample_db else f"{dialect.value.capitalize()} Database"
        )

        connection_info = ConnectionInfoResponse(
            id=conn_id,
            name=display_name,
            dialect=dialect,
            host=request.host if dialect != DatabaseDialect.SQLITE else None,
            port=request.port if dialect != DatabaseDialect.SQLITE else None,
            database=db_name,
            username=request.username if dialect != DatabaseDialect.SQLITE else None,
            ssl=request.ssl,
            is_sample_db=request.is_sample_db,
            table_count=schema_response.table_count,
            connected_at=datetime.now().isoformat(),
        )

        # 4. Register in session manager
        await session_manager.set_session(
            user_id=current_user.user_id,
            engine=engine,
            connection_info=connection_info,
            schema=schema_response,
        )

        return connection_info

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to establish active database session", error=str(exc))
        sanitized = _sanitize_connection_error(str(exc), request.dialect)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {sanitized}",
        )


@router.get(
    "/current",
    response_model=ConnectionInfoResponse,
    summary="Get current active database connection",
    description="Returns metadata of the database currently connected to the user session.",
)
async def get_current_connection(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ConnectionInfoResponse:
    """Retrieve active connection metadata for current authenticated user."""
    session = session_manager.get_session(current_user.user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active database connection found. Please connect to a database first.",
        )
    return session.connection_info


@router.post(
    "/disconnect",
    summary="Disconnect active database",
    description="Closes the active connection pool and purges schema cache for the current user.",
)
async def disconnect_database(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Disconnect active database and clear user session cache."""
    cleared = await session_manager.clear_session(current_user.user_id)
    if not cleared:
        return {"message": "No active connection was found to disconnect."}
    return {"message": "Database disconnected successfully."}
