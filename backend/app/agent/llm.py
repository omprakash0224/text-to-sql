"""
DataSpeak Backend — LLM Provider Client
Multi-provider LLM abstraction supporting Groq (llama-3.3-70b-versatile) as primary,
OpenRouter as secondary fallback, and test mock fallback for CI/unit testing.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Union
import httpx
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("agent.llm")


class LLMProviderError(Exception):
    """Raised when all LLM providers fail or are unconfigured."""
    pass


class LLMClient:
    """
    Unified LLM inference client with automatic fallback across providers:
    1. Primary: Groq (llama-3.3-70b-versatile)
    2. Fallback: OpenRouter (qwen-2.5-coder-32b-instruct or configured model)
    3. Test / Mock Provider (when explicitly registered or during offline testing)
    """

    def __init__(self) -> None:
        self._mock_handler: Optional[Any] = None

    def set_mock_handler(self, handler: Optional[Any]) -> None:
        """Register a mock generator callback for deterministic testing."""
        self._mock_handler = handler

    async def ainvoke(
        self,
        messages: List[Union[BaseMessage, Dict[str, str]]],
        temperature: float = 0.0,
        max_tokens: int = 1500,
    ) -> str:
        """
        Asynchronously invokes LLM inference with automated fallback.
        Accepts LangChain BaseMessage objects or role/content dictionaries.
        """
        # 1. Test Mock Check
        if self._mock_handler is not None:
            logger.debug("Executing mock LLM handler")
            if callable(self._mock_handler):
                res = self._mock_handler(messages)
                if hasattr(res, "__await__"):
                    res = await res
                return str(res)
            return str(self._mock_handler)

        settings = get_settings()

        # Normalize messages to standard LangChain format
        normalized_messages: List[BaseMessage] = []
        for m in messages:
            if isinstance(m, BaseMessage):
                normalized_messages.append(m)
            elif isinstance(m, dict):
                role = m.get("role", "user")
                content = m.get("content", "")
                if role == "system":
                    normalized_messages.append(SystemMessage(content=content))
                elif role == "assistant":
                    normalized_messages.append(AIMessage(content=content))
                else:
                    normalized_messages.append(HumanMessage(content=content))

        # 2. Try Primary: Groq
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
            try:
                logger.debug("Calling Groq LLM", model=settings.GROQ_MODEL)
                groq_llm = ChatGroq(
                    groq_api_key=settings.GROQ_API_KEY,
                    model_name=settings.GROQ_MODEL,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                response = await groq_llm.ainvoke(normalized_messages)
                if isinstance(response.content, str):
                    return response.content
                return str(response.content)
            except Exception as exc:
                logger.warn(
                    "Groq LLM invocation failed, attempting fallback to OpenRouter",
                    error=str(exc),
                )

        # 3. Try Fallback: OpenRouter
        if settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip():
            try:
                logger.debug("Calling OpenRouter fallback LLM", model=settings.OPENROUTER_MODEL)
                return await self._call_openrouter(
                    normalized_messages,
                    model=settings.OPENROUTER_MODEL,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    api_key=settings.OPENROUTER_API_KEY,
                )
            except Exception as exc:
                logger.warn("OpenRouter invocation failed", error=str(exc))

        # 4. If in test or dev mode with no keys configured, provide a safe synthetic response
        if settings.ENVIRONMENT in ("test", "development"):
            logger.warn("No LLM API keys configured in development/test. Generating heuristic response.")
            return self._heuristic_offline_response(normalized_messages)

        raise LLMProviderError(
            "All LLM providers failed or no valid API keys are configured (GROQ_API_KEY / OPENROUTER_API_KEY)."
        )

    async def _call_openrouter(
        self,
        messages: List[BaseMessage],
        model: str,
        temperature: float,
        max_tokens: int,
        api_key: str,
    ) -> str:
        """Direct async HTTP call to OpenRouter's OpenAI-compatible completions API."""
        formatted_messages = []
        for m in messages:
            if isinstance(m, SystemMessage):
                formatted_messages.append({"role": "system", "content": m.content})
            elif isinstance(m, AIMessage):
                formatted_messages.append({"role": "assistant", "content": m.content})
            else:
                formatted_messages.append({"role": "user", "content": m.content})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dataspeak.ai",
            "X-Title": "DataSpeak",
        }
        payload = {
            "model": model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _heuristic_offline_response(self, messages: List[BaseMessage]) -> str:
        """Fallback heuristic for dev environments without configured API keys."""
        # Find the last human message
        last_msg = ""
        for m in reversed(messages):
            if isinstance(m, HumanMessage):
                last_msg = str(m.content).lower()
                break

        # Check if asking for summary
        if "summary" in last_msg or "findings" in last_msg:
            return "The query was executed successfully and the requested data points have been retrieved."

        # Otherwise assume SQL generation
        if "customer" in last_msg:
            return "```sql\nSELECT * FROM customers LIMIT 10;\n```"
        if "product" in last_msg:
            return "```sql\nSELECT * FROM products ORDER BY price DESC LIMIT 10;\n```"
        if "order" in last_msg:
            return "```sql\nSELECT * FROM orders ORDER BY total_amount DESC LIMIT 10;\n```"

        return "```sql\nSELECT 1 AS status;\n```"


# Global singleton instance
default_llm_client = LLMClient()
