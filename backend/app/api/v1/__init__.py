"""
DataSpeak Backend — API v1 Router
Aggregates all v1 sub-routers into a single router mounted at /api/v1.
"""

from fastapi import APIRouter

api_router = APIRouter()

# Sub-routers will be registered here as each phase adds new endpoints.
# Example (Phase 3+):
#   from app.api.v1.connections import router as connections_router
#   api_router.include_router(connections_router, prefix="/connections", tags=["connections"])
