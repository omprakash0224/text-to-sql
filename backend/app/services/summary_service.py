"""
DataSpeak Backend — Plain-English Summary Service
Translates structured database query results into clear, concise,
2 to 3 sentence executive narratives for business stakeholders.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.agent.llm import LLMClient, default_llm_client
from app.agent.prompts import NARRATIVE_SUMMARY_SYSTEM_PROMPT
from app.core.logging import get_logger

logger = get_logger("services.summary")


class SummaryService:
    """Generates plain-English business summaries from query result datasets."""

    @classmethod
    async def generate_summary(
        cls,
        user_question: str,
        columns: List[str],
        rows: List[Dict[str, Any]],
        llm: Optional[LLMClient] = None,
    ) -> str:
        """
        Creates a high-level narrative summary of query findings.
        """
        row_count = len(rows)

        # Edge case: No results
        if row_count == 0:
            return "No matching records were found in the database matching your criteria."

        # Edge case: Single scalar value or single row
        if row_count == 1:
            row = rows[0]
            if len(columns) == 1:
                col = columns[0]
                val = row.get(col)
                formatted_col = col.replace("_", " ").title()
                return f"The database returned a single result for your inquiry: {formatted_col} is {val}."
            items = [f"{k.replace('_', ' ').title()}: {v}" for k, v in row.items() if v is not None][:4]
            return f"Found 1 matching record: {', '.join(items)}."

        # Multi-row: Invoke LLM with top 5 rows
        preview_rows = rows[:5]
        preview_str = json.dumps(preview_rows, default=str, indent=2)

        client = llm or default_llm_client
        prompt = NARRATIVE_SUMMARY_SYSTEM_PROMPT.format(
            user_question=user_question,
            results_preview=preview_str,
            row_count=row_count,
        )

        try:
            summary = await client.ainvoke(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=300,
            )
            clean_summary = (summary or "").strip().strip('"').strip("'")
            if clean_summary and clean_summary.lower() not in ("none", "null"):
                return clean_summary
        except Exception as exc:
            logger.warn("LLM summary generation failed, using rule-based fallback", error=str(exc))

        # Fallback heuristic summary
        first_row = rows[0]
        first_items = [f"{k.replace('_', ' ').title()}: {v}" for k, v in first_row.items() if v is not None][:3]
        return (
            f"The query returned {row_count} records for '{user_question}'. "
            f"Top result includes {', '.join(first_items)}."
        )


summary_service = SummaryService()
