"""
DataSpeak Backend — Database Module
SQLAlchemy async engine factory, schema reflection, and session cache manager.
"""

from app.db.connection import (
    build_async_engine,
    normalize_database_url,
    test_connection,
)
from app.db.inspector import (
    reflect_database_schema,
    build_schema_prompt_summary,
)
from app.db.sample_data import (
    create_sample_database,
    get_sample_db_path,
)
from app.db.session_manager import (
    session_manager,
    ActiveDatabaseSession,
)

__all__ = [
    "build_async_engine",
    "normalize_database_url",
    "test_connection",
    "reflect_database_schema",
    "build_schema_prompt_summary",
    "create_sample_database",
    "get_sample_db_path",
    "session_manager",
    "ActiveDatabaseSession",
]
