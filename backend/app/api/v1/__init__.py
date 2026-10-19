"""
DataSpeak Backend — API v1 Router
Aggregates all v1 sub-routers into a single router mounted at /api/v1.
"""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router

api_router = APIRouter()

# Register sub-routers
api_router.include_router(auth_router)

# Future sub-routers (Phase 3 & 4):
# from app.api.v1.connections import router as connections_router
# from app.api.v1.queries import router as queries_router
# api_router.include_router(connections_router, prefix="/connections", tags=["connections"])
# api_router.include_router(queries_router, prefix="/queries", tags=["queries"])
