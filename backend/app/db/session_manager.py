"""
DataSpeak Backend — In-Memory Database Session & Cache Manager
Provides tenant-isolated storage for active SQLAlchemy engines and reflected schemas
keyed by the authenticated Clerk user_id.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.logging import get_logger
from app.models.connection import ConnectionInfoResponse
from app.models.schema import DatabaseSchemaResponse

logger = get_logger("db.session_manager")


@dataclass
class ActiveDatabaseSession:
    """Represents an active, authenticated database connection session."""
    session_id: str
    user_id: str
    engine: AsyncEngine
    connection_info: ConnectionInfoResponse
    schema: DatabaseSchemaResponse
    connected_at: datetime = field(default_factory=datetime.now)
    last_accessed_at: datetime = field(default_factory=datetime.now)

    def touch(self) -> None:
        """Update last access timestamp."""
        self.last_accessed_at = datetime.now()


class DatabaseSessionManager:
    """
    Singleton manager maintaining tenant-isolated database sessions in memory.
    Guarantees that User A cannot view or query databases belonging to User B.
    """

    def __init__(self) -> None:
        self._sessions: Dict[str, ActiveDatabaseSession] = {}
        self._lock = asyncio.Lock()

    def has_session(self, user_id: str) -> bool:
        """Check if an active session exists for user."""
        return user_id in self._sessions

    def get_session(self, user_id: str) -> Optional[ActiveDatabaseSession]:
        """
        Retrieve the active database session for a user.
        Updates access timestamp.
        """
        session = self._sessions.get(user_id)
        if session:
            session.touch()
        return session

    async def set_session(
        self,
        user_id: str,
        engine: AsyncEngine,
        connection_info: ConnectionInfoResponse,
        schema: DatabaseSchemaResponse,
    ) -> ActiveDatabaseSession:
        """
        Register a new active database connection for the user.
        If a prior engine existed, gracefully disposes its connection pool.
        """
        async with self._lock:
            prior_session = self._sessions.get(user_id)
            if prior_session:
                logger.info(
                    "Replacing existing database session for user",
                    user_id=user_id,
                    old_session_id=prior_session.session_id,
                )
                try:
                    await prior_session.engine.dispose()
                except Exception as exc:
                    logger.warn("Error disposing prior engine", error=str(exc))

            new_session = ActiveDatabaseSession(
                session_id=str(uuid.uuid4()),
                user_id=user_id,
                engine=engine,
                connection_info=connection_info,
                schema=schema,
            )
            self._sessions[user_id] = new_session

            logger.info(
                "Active database session registered",
                user_id=user_id,
                session_id=new_session.session_id,
                dialect=connection_info.dialect.value,
                tables=connection_info.table_count,
            )
            return new_session

    async def clear_session(self, user_id: str) -> bool:
        """
        Closes and disposes the active database connection for the user.
        Returns True if a session was cleared, False otherwise.
        """
        async with self._lock:
            session = self._sessions.pop(user_id, None)
            if not session:
                return False

            logger.info("Disposing database session", user_id=user_id, session_id=session.session_id)
            try:
                await session.engine.dispose()
            except Exception as exc:
                logger.warn("Error during engine disposal", error=str(exc))

            return True

    async def update_schema(self, user_id: str, new_schema: DatabaseSchemaResponse) -> bool:
        """Update cached schema for an active session."""
        session = self._sessions.get(user_id)
        if not session:
            return False
        session.schema = new_schema
        session.connection_info.table_count = new_schema.table_count
        session.touch()
        return True

    async def dispose_all_sessions(self) -> None:
        """Gracefully disposes all open database engines during server shutdown."""
        async with self._lock:
            count = len(self._sessions)
            if count == 0:
                return

            logger.info("Disposing all active database engines during shutdown", total_sessions=count)
            for user_id, session in list(self._sessions.items()):
                try:
                    await session.engine.dispose()
                except Exception as exc:
                    logger.warn("Error closing engine during shutdown", user_id=user_id, error=str(exc))
            self._sessions.clear()


# Global singleton instance
session_manager = DatabaseSessionManager()
