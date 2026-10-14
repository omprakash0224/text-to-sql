"""
DataSpeak Backend — FastAPI Application Entry Point

Responsibilities:
  - Create and configure the FastAPI application instance.
  - Register CORS middleware with allowed origins from settings.
  - Mount the /api/v1 router.
  - Expose /health check endpoint.
  - Configure structured logging on startup.
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger

# ── Application startup time (used in /health uptime calculation) ────────────
_START_TIME: float = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.
    Runs setup logic on startup and teardown logic on shutdown.
    """
    configure_logging()
    logger = get_logger("startup")
    settings = get_settings()

    logger.info(
        "DataSpeak backend starting",
        environment=settings.ENVIRONMENT,
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
    )

    yield  # ── Application runs here ──────────────────────────────────────────

    logger.info("DataSpeak backend shutting down")


# ── FastAPI application instance ─────────────────────────────────────────────
def create_app() -> FastAPI:
    """Factory function that creates and configures the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="DataSpeak API",
        description=(
            "AI-powered conversational Text-to-SQL platform. "
            "Transforms natural language questions into safe, read-only SQL queries."
        ),
        version="0.1.0",
        docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
        lifespan=lifespan,
    )

    # ── CORS middleware ───────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── API v1 router ─────────────────────────────────────────────────────────
    app.include_router(api_router, prefix="/api/v1")

    # ── Health check endpoint ─────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], summary="Health check")
    async def health_check() -> JSONResponse:
        """
        Returns the server status, environment, and uptime.
        Used by load balancers, monitoring tools, and CI pipelines
        to verify the service is running correctly.
        """
        uptime_seconds = round(time.time() - _START_TIME, 2)
        return JSONResponse(
            content={
                "status": "ok",
                "environment": settings.ENVIRONMENT,
                "version": "0.1.0",
                "uptime_seconds": uptime_seconds,
            }
        )

    return app


# ── Module-level app instance (used by Uvicorn) ───────────────────────────────
app = create_app()
