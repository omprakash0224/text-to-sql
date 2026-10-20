"""
DataSpeak Backend — Queries API Router
Exposes natural language query endpoints orchestrating LangGraph Text-to-SQL execution.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.agent.graph import agent_app
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.rate_limit import RateLimiter, RateLimitResult
from app.db.app_database import get_app_db
from app.db.repositories.history_repository import HistoryRepository
from app.db.session_manager import session_manager
from app.models.history import QueryHistoryCreate
from app.models.query import (
    ChartConfigResponse,
    QueryAskRequest,
    QueryAskResponse,
)
from app.models.user import AuthenticatedUser

logger = get_logger("api.v1.queries")

router = APIRouter(prefix="/queries", tags=["queries"])


@router.post(
    "/ask",
    response_model=QueryAskResponse,
    summary="Process natural language question and return SQL, results, chart, and summary",
)
async def ask_query(
    payload: QueryAskRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    app_db: AsyncSession = Depends(get_app_db),
    _rate_limit: RateLimitResult = Depends(
        RateLimiter(
            times=get_settings().RATE_LIMIT_QUERY_PER_MINUTE,
            seconds=60,
            namespace="queries_ask",
        )
    ),
) -> QueryAskResponse:
    """
    Translates a plain-English question into dialect-specific SQL, validates guardrails,
    executes against the user's active database connection, and returns data with
    automated chart recommendations and narrative summary.
    """
    user_id = current_user.user_id
    logger.info("Received query request", user_id=user_id, question=payload.question)

    # 1. Tenant session check
    session = session_manager.get_session(user_id)
    if not session:
        logger.warn("Query attempt with no active database session", user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active database connection found. Please connect to a database first.",
        )

    # 2. Prepare initial state for LangGraph agent
    initial_state = {
        "user_question": payload.question,
        "dialect": session.schema.dialect,
        "schema_prompt": session.schema.summary_prompt,
        "engine": session.engine,
    }

    # 3. Execute LangGraph workflow
    try:
        final_state = await agent_app.ainvoke(initial_state)
    except Exception as exc:
        logger.error("LangGraph workflow error", error=str(exc), user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query orchestration failed: {str(exc)}",
        ) from exc

    # 4. Check for guardrail security blocks
    if final_state.get("status") == "blocked":
        response = QueryAskResponse(
            sql=final_state.get("generated_sql", ""),
            columns=[],
            rows=[],
            row_count=0,
            execution_time_ms=0.0,
            chart=ChartConfigResponse(type="none"),
            summary="This query was blocked because it violates the zero-trust read-only policy.",
            status="blocked",
            error_message=final_state.get("fatal_error") or "Operation prohibited by security guardrails.",
        )

    # 5. Check for unrecoverable errors (syntax or db error after max retries)
    elif final_state.get("status") == "error":
        response = QueryAskResponse(
            sql=final_state.get("generated_sql", ""),
            columns=[],
            rows=[],
            row_count=0,
            execution_time_ms=0.0,
            chart=ChartConfigResponse(type="none"),
            summary="We were unable to process this query against the current database schema.",
            status="error",
            error_message=final_state.get("fatal_error") or final_state.get("error_message"),
        )

    else:
        # 6. Parse chart recommendation
        chart_config = None
        if final_state.get("chart"):
            chart_data = final_state["chart"]
            chart_config = ChartConfigResponse(
                type=chart_data.get("type", "none"),
                x_key=chart_data.get("x_key"),
                y_key=chart_data.get("y_key"),
                title=chart_data.get("title"),
            )

        response = QueryAskResponse(
            sql=final_state.get("sanitized_sql") or final_state.get("generated_sql", ""),
            columns=final_state.get("columns", []),
            rows=final_state.get("rows", []),
            row_count=final_state.get("row_count", 0),
            execution_time_ms=final_state.get("execution_time_ms", 0.0),
            chart=chart_config,
            summary=final_state.get("summary", ""),
            status="success",
            error_message=None,
        )

    # 7. Auto-record query into application database history (fail-safe)
    try:
        db_name = "database"
        if hasattr(session, "schema") and getattr(session.schema, "dialect", None):
            d = session.schema.dialect
            db_name = d.value if hasattr(d, "value") else str(d)

        history_dto = QueryHistoryCreate(
            user_id=user_id,
            database_name=db_name,
            question=payload.question,
            sql=response.sql,
            status=response.status,
            execution_time_ms=response.execution_time_ms,
            row_count=response.row_count,
            chart_config=response.chart.model_dump() if response.chart else None,
            summary=response.summary,
            error_message=response.error_message,
            is_saved=False,
        )
        await HistoryRepository.create_query_history(app_db, history_dto)
    except Exception as exc:
        logger.warning("Auto-recording query history failed (fail-open)", error=str(exc))

    return response
