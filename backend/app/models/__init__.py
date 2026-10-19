"""
DataSpeak Backend — Models Package
Exports Pydantic v2 domain schemas.
"""

from app.models.user import AuthenticatedUser
from app.models.connection import (
    DatabaseDialect,
    ConnectionParams,
    ConnectionTestRequest,
    ConnectionTestResponse,
    ConnectionConnectRequest,
    ConnectionInfoResponse,
)
from app.models.schema import (
    ColumnMetadata,
    ForeignKeyMetadata,
    TableMetadata,
    DatabaseSchemaResponse,
)

__all__ = [
    "AuthenticatedUser",
    "DatabaseDialect",
    "ConnectionParams",
    "ConnectionTestRequest",
    "ConnectionTestResponse",
    "ConnectionConnectRequest",
    "ConnectionInfoResponse",
    "ColumnMetadata",
    "ForeignKeyMetadata",
    "TableMetadata",
    "DatabaseSchemaResponse",
]
