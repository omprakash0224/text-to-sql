"""create query_history table

Revision ID: 001_initial_history
Revises:
Create Date: 2026-10-20 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_history"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "query_history",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("database_name", sa.String(length=128), server_default="database", nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("sql", sa.Text(), server_default="", nullable=False),
        sa.Column("status", sa.String(length=32), server_default="success", nullable=False),
        sa.Column("execution_time_ms", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("row_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("chart_config", sa.JSON(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("is_saved", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_query_history_id", "query_history", ["id"], unique=False)
    op.create_index("idx_query_history_user_id", "query_history", ["user_id"], unique=False)
    op.create_index("idx_query_history_user_created", "query_history", ["user_id", "created_at"], unique=False)
    op.create_index("idx_query_history_user_saved", "query_history", ["user_id", "is_saved"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_query_history_user_saved", table_name="query_history")
    op.drop_index("idx_query_history_user_created", table_name="query_history")
    op.drop_index("idx_query_history_user_id", table_name="query_history")
    op.drop_index("idx_query_history_id", table_name="query_history")
    op.drop_table("query_history")
