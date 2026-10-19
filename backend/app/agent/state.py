"""
DataSpeak Backend — LangGraph Agent State
Defines the state schema passed between nodes in the agent execution graph.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):
    """
    State object passed between LangGraph nodes during natural language
    query processing and self-correction cycles.
    """
    # ── Initial Context ──────────────────────────────────────────────────────
    user_question: str
    dialect: str
    schema_prompt: str
    engine: Any  # sqlalchemy.ext.asyncio.AsyncEngine

    # ── SQL Generation & AST Guardrails ───────────────────────────────────────
    generated_sql: str
    sanitized_sql: str
    is_valid: bool
    retry_count: int
    error_message: Optional[str]
    fatal_error: Optional[str]

    # ── Target Execution ──────────────────────────────────────────────────────
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float

    # ── Synthesized Insights ─────────────────────────────────────────────────
    chart: Optional[Dict[str, Any]]
    summary: Optional[str]

    # ── Final Status ─────────────────────────────────────────────────────────
    status: str  # "success" | "error" | "blocked"
