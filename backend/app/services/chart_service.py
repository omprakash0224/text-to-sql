"""
DataSpeak Backend — Automated Chart Recommendation Service
Analyzes column types, cardinality, and semantics to select optimal
Recharts visualization types (bar, line, pie, or none).
"""

from __future__ import annotations

from datetime import date, datetime
import re
from typing import Any, Dict, List, Optional, Set
from app.models.query import ChartConfigResponse


TEMPORAL_KEYWORDS = {
    "date", "time", "created_at", "updated_at", "month", "year",
    "day", "week", "quarter", "period", "timestamp", "hour",
}

ID_KEYWORDS = {"id", "uuid", "pk", "fk"}


def _is_numeric(val: Any) -> bool:
    """Check if value is numeric and not boolean."""
    if isinstance(val, bool):
        return False
    return isinstance(val, (int, float))


def _is_temporal_string(val: Any) -> bool:
    """Check if a string looks like an ISO date/time."""
    if not isinstance(val, str):
        return False
    # Check YYYY-MM or YYYY-MM-DD
    return bool(re.match(r"^\d{4}-\d{2}(-\d{2})?", val.strip()))


class ChartRecommendationService:
    """
    Deterministic visualization selector mapping query result shapes to
    frontend Recharts component specifications.
    """

    @classmethod
    def recommend_chart(
        cls,
        columns: List[str],
        rows: List[Dict[str, Any]],
        user_question: Optional[str] = None,
    ) -> ChartConfigResponse:
        """
        Determines the most insightful chart type and axes for a given dataset.
        """
        row_count = len(rows)

        # Edge Case 1: Empty or single-row dataset without distribution
        if row_count < 2:
            return ChartConfigResponse(type="none")

        # Categorize columns based on inspection across rows
        numeric_cols: List[str] = []
        temporal_cols: List[str] = []
        categorical_cols: List[str] = []

        sample_rows = rows[:20]

        for col in columns:
            col_lower = col.lower()
            vals = [r.get(col) for r in sample_rows if r.get(col) is not None]

            if not vals:
                continue

            # Check if temporal
            if any(k in col_lower for k in TEMPORAL_KEYWORDS) or any(
                isinstance(v, (datetime, date)) or _is_temporal_string(v) for v in vals
            ):
                temporal_cols.append(col)
                continue

            # Check if numeric (ignore pure ID columns unless no other numerics exist)
            all_numeric = all(_is_numeric(v) for v in vals)
            if all_numeric:
                if not any(col_lower.endswith(k) for k in ID_KEYWORDS) or col_lower in ("order_id", "product_id"):
                    numeric_cols.append(col)
                continue

            # Otherwise categorical
            categorical_cols.append(col)

        # If no numeric columns exist, chart cannot be rendered
        if not numeric_cols:
            return ChartConfigResponse(type="none")

        primary_numeric = numeric_cols[0]

        # 1. Line Chart: Temporal dimension on X axis
        if temporal_cols and row_count >= 2:
            x_col = temporal_cols[0]
            title = f"{primary_numeric.replace('_', ' ').title()} over {x_col.replace('_', ' ').title()}"
            return ChartConfigResponse(
                type="line",
                x_key=x_col,
                y_key=primary_numeric,
                title=title,
            )

        # 2. Pie Chart: Small category count (2 to 7) representing distribution
        q_lower = (user_question or "").lower()
        pie_keywords = {"share", "percentage", "distribution", "breakdown", "ratio", "proportion"}
        has_pie_intent = any(k in q_lower for k in pie_keywords)

        if categorical_cols and (2 <= row_count <= 7):
            x_col = categorical_cols[0]
            # Verify distinct categories
            distinct_cats = len({r.get(x_col) for r in rows})
            if 2 <= distinct_cats <= 7 and (has_pie_intent or row_count <= 5):
                title = f"{primary_numeric.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
                return ChartConfigResponse(
                    type="pie",
                    x_key=x_col,
                    y_key=primary_numeric,
                    title=title,
                )

        # 3. Bar Chart: Categorical dimension on X axis (2 to 25 rows)
        if categorical_cols and (2 <= row_count <= 25):
            x_col = categorical_cols[0]
            title = f"{primary_numeric.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
            return ChartConfigResponse(
                type="bar",
                x_key=x_col,
                y_key=primary_numeric,
                title=title,
            )

        # 4. Fallback: If no explicit categorical column, but a non-primary numeric column exists (e.g. rank/id)
        if len(columns) >= 2 and (2 <= row_count <= 20):
            other_cols = [c for c in columns if c != primary_numeric]
            if other_cols:
                x_col = other_cols[0]
                title = f"{primary_numeric.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
                return ChartConfigResponse(
                    type="bar",
                    x_key=x_col,
                    y_key=primary_numeric,
                    title=title,
                )

        return ChartConfigResponse(type="none")


chart_service = ChartRecommendationService()
