# Architecture Decisions


## ADR-001


Decision:
Use Python FastAPI with LangGraph for backend and agent orchestration.


Reason:
Python has the richest ecosystem for AI engineering and database introspection. LangGraph enables stateful multi-step agent workflows with automated self-correction loops for SQL generation.


## ADR-002


Decision:
Use Groq with OpenRouter fallback for LLM inference.


Reason:
Groq delivers ultra-fast token generation speeds required for conversational data exploration, while OpenRouter provides multi-model resilience and fallback reliability without vendor lock-in.


## ADR-003


Decision:
Use React + Vite instead of Streamlit or Next.js.


Reason:
Provides a fast, lightweight client-side SPA with complete design control for custom tables, charts, and micro-interactions, maintaining a clean architectural decoupling from the Python backend.


## ADR-004


Decision:
Use Clerk for authentication and session management.


Reason:
Provides secure, modern pre-built UI components for user login and generates standard JWT tokens that can be validated statelessly on FastAPI using Clerk JWKS public keys.


## ADR-005


Decision:
Use sqlglot for SQL Abstract Syntax Tree (AST) validation and guardrails.


Reason:
Regex-based SQL filtering is vulnerable to injection bypasses. Parsing the AST guarantees that only read-only SELECT queries are executed and completely blocks mutations like INSERT, UPDATE, DELETE, and DROP.


## ADR-006


Decision:
Use Recharts for frontend data visualization.


Reason:
It is React-native, composable, responsive, and easily configured dynamically based on the AI agent's recommended visualization type (bar, line, or pie).


## ADR-007


Decision:
Use SQLAlchemy 2.0 async engine for database connections and schema reflection.


Reason:
Enables unified connection pooling, schema reflection, and asynchronous query execution across PostgreSQL, MySQL, and SQLite without maintaining separate database drivers per engine.


## ADR-008


Decision:
Support managed cloud PostgreSQL providers (Neon and Supabase) with SSL/TLS and connection pooling modes.


Reason:
Neon and Supabase are the most widely adopted cloud PostgreSQL platforms. Supporting their pooled connection strings (`sslmode=require`, transaction and session poolers) ensures zero-friction connectivity for users without timeout issues or connection exhaustion.
