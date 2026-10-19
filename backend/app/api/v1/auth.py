"""
DataSpeak Backend — Authentication API Endpoints
Provides user session inspection and authentication status checks.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.core.logging import get_logger
from app.models.user import AuthenticatedUser

logger = get_logger("api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get(
    "/me",
    response_model=AuthenticatedUser,
    summary="Get current authenticated user profile",
    description=(
        "Returns the authenticated user details extracted and verified "
        "from the Clerk Bearer JWT token in the Authorization header."
    ),
)
async def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Returns the current user profile from the validated Clerk session."""
    logger.info(
        "User profile requested",
        user_id=current_user.user_id,
        email=current_user.email,
        org_id=current_user.org_id,
    )
    return current_user
