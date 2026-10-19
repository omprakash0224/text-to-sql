"""
DataSpeak Backend — Database Connection Models
Pydantic v2 schemas for connection requests, testing, and connection state.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class DatabaseDialect(str, Enum):
    """Supported database dialects."""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLITE = "sqlite"


class ConnectionParams(BaseModel):
    """
    Database connection parameters supplied by the client.
    Supports either direct connection string or discrete host/port/credentials.
    """
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = Field(default=None, description="User-friendly connection nickname")
    dialect: Optional[DatabaseDialect] = Field(default=None, description="Database engine type")
    host: Optional[str] = Field(default=None, description="Host address or server hostname")
    port: Optional[int] = Field(default=None, description="Port number")
    database: Optional[str] = Field(default=None, description="Database name or SQLite file path")
    username: Optional[str] = Field(default=None, description="Authentication username")
    password: Optional[str] = Field(default=None, repr=False, description="Authentication password")
    connection_string: Optional[str] = Field(default=None, repr=False, description="Full connection URI")
    ssl: bool = Field(default=False, description="Whether to require SSL/TLS encryption")
    is_sample_db: bool = Field(default=False, description="Whether to connect to the built-in SQLite sample")

    @model_validator(mode="after")
    def validate_connection_inputs(self) -> ConnectionParams:
        """Ensure sufficient connection information is provided."""
        if self.is_sample_db:
            if not self.dialect:
                self.dialect = DatabaseDialect.SQLITE
            if not self.name:
                self.name = "Sample E-Commerce Database"
            return self

        if self.connection_string:
            # Scheme will be normalized in connection factory
            return self

        if not self.dialect:
            raise ValueError("Either 'connection_string', 'is_sample_db=True', or 'dialect' must be specified.")

        if self.dialect != DatabaseDialect.SQLITE and not self.host:
            raise ValueError("Hostname ('host') is required for PostgreSQL and MySQL connections.")

        return self


class ConnectionTestRequest(ConnectionParams):
    """Payload to test database connectivity without establishing a persistent session."""
    pass


class ConnectionTestResponse(BaseModel):
    """Result of a database connectivity validation attempt."""
    model_config = ConfigDict(extra="ignore")

    success: bool = Field(..., description="Whether the connection test succeeded")
    message: str = Field(..., description="Human-readable result or sanitized error description")
    latency_ms: Optional[float] = Field(default=None, description="Round-trip ping time in milliseconds")
    dialect: Optional[str] = Field(default=None, description="Detected database dialect")
    database_version: Optional[str] = Field(default=None, description="Database server version banner")


class ConnectionConnectRequest(ConnectionParams):
    """Payload to establish an active database connection and index schema."""
    pass


class ConnectionInfoResponse(BaseModel):
    """
    Safe public connection state metadata.
    NEVER exposes passwords, tokens, or raw connection strings to the client.
    """
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Connection session identifier")
    name: str = Field(..., description="Display name for this database connection")
    dialect: DatabaseDialect = Field(..., description="Database dialect")
    host: Optional[str] = Field(default=None, description="Database host (omitted for SQLite)")
    port: Optional[int] = Field(default=None, description="Database port (omitted for SQLite)")
    database: Optional[str] = Field(default=None, description="Database or file name")
    username: Optional[str] = Field(default=None, description="Connected username")
    ssl: bool = Field(default=False, description="Whether SSL/TLS is active")
    is_sample_db: bool = Field(default=False, description="Whether this is the built-in sample DB")
    table_count: int = Field(default=0, description="Number of reflected tables")
    connected_at: str = Field(..., description="ISO 8601 timestamp when connection was established")
