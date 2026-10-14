# Project Implementation Plan & Tasks

## Overview
This document outlines the phase-by-phase roadmap for developing **DataSpeak**, an AI-powered Text-to-SQL platform for non-technical users. Each phase defines clear, actionable tasks and measurable success criteria.

---

## Phase 1: Project Setup & Core Infrastructure

### Tasks
- [x] Initialize monorepo structure with `backend/` and `frontend/` directories.
- [x] Configure Python backend environment with `requirements.txt` (FastAPI, Uvicorn, SQLAlchemy, sqlglot, LangGraph, LangChain-Groq, PyJWT, Cryptography).
- [x] Set up `.env.example` with config variables (`CLERK_ISSUER`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, etc.).
- [x] Initialize frontend with Vite + React + TypeScript and configure Tailwind CSS and Lucide React.
- [x] Configure CORS, logging, and health check endpoint (`/health`) in FastAPI.

### Success Criteria
- Backend server runs via `uvicorn main:app --reload` and returns `{"status": "ok"}` on `GET /health`.
- Frontend boots cleanly via `npm run dev` and renders a responsive base layout.

---

## Phase 2: Authentication & Security Guardrails

### Tasks
- [ ] Set up `@clerk/clerk-react` in the frontend with `<ClerkProvider />`, `<SignIn />`, and `<UserButton />`.
- [ ] Configure Axios interceptor in the frontend to attach the Clerk session Bearer token to API calls.
- [ ] Implement Clerk JWT verification dependency (`app/core/auth.py`) in FastAPI using Clerk JWKS public keys.
- [ ] Protect backend API routes with `Depends(get_current_user)`.
- [ ] Build the SQL AST Guardrail module using `sqlglot` (`app/guardrails/validator.py`):
  - Strictly permit only `SELECT` statements.
  - Automatically reject `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, and multiple stacked queries.
  - Automatically inject safety row caps (e.g. `LIMIT 100`) if missing.
- [ ] Write unit tests for the AST guardrail covering safe queries and forbidden malicious SQL attempts.

### Success Criteria
- Requests without a valid Clerk JWT receive `401 Unauthorized`.
- Unit test suite passes with 100% blocking of mutation and DDL statements.

---

## Phase 3: Database Connection & Schema Reflection

### Tasks
- [ ] Build dynamic SQLAlchemy async engine factory (`app/db/connection.py`) supporting PostgreSQL (including Neon & Supabase with SSL/TLS and connection pooling modes), MySQL, and SQLite.
- [ ] Implement schema reflection service (`app/db/inspector.py`) to extract:
  - Table names and column definitions (names, data types, nullability).
  - Primary keys and foreign key relationships.
  - Lightweight data samples (top 3 sample rows per table for semantic LLM context).
- [ ] Build in-memory schema cache associated with the active user session.
- [ ] Create API endpoints:
  - `POST /api/v1/connections/test`: Validate database connectivity.
  - `POST /api/v1/connections/connect`: Save active connection and trigger schema indexing.
  - `GET /api/v1/schema`: Return formatted schema for UI exploration.
- [ ] Prepare a sample SQLite e-commerce database (e.g., customers, orders, products) for immediate local testing.

### Success Criteria
- User can connect to both a local SQLite sample database and cloud-hosted Neon/Supabase PostgreSQL instances with SSL.
- Schema reflection extracts tables, columns, and relationships in under 2 seconds.

---

## Phase 4: AI Agent Orchestration (LangGraph + Groq/OpenRouter)

### Tasks
- [ ] Configure LLM clients (`app/agent/llm.py`) with Groq (`llama-3.3-70b-versatile`) and OpenRouter fallback.
- [ ] Define the LangGraph agent state (`app/agent/state.py`):
  - User query, database dialect, schema context, generated SQL, execution results, error logs, retry count, chart config, and summary.
- [ ] Implement agent nodes and workflow (`app/agent/graph.py`):
  1. **Schema Context Node:** Inject relevant tables and column descriptions.
  2. **SQL Generation Node:** Construct prompt and produce dialect-specific SQL.
  3. **Guardrail Validation Node:** Validate SQL AST via `sqlglot`. Route back to LLM with error message on syntax issues (max 2 retries).
  4. **Execution Node:** Run validated `SELECT` query against target database in a read-only session.
  5. **Insight & Visualization Node:** Recommend chart type (bar, line, pie, or none) and generate a 2-3 sentence plain-English summary.
- [ ] Expose `POST /api/v1/queries/ask` endpoint executing the LangGraph pipeline.

### Success Criteria
- Plain-English question (e.g., "What are the top 5 best-selling products by revenue?") produces valid SQL, executes successfully, and returns structured data, chart metadata, and a plain-English explanation.
- System self-corrects invalid SQL syntax within 2 retry attempts.

---

## Phase 5: Frontend Interface & Visualization

### Tasks
- [ ] Build app layout (`AppLayout.tsx`) with top navigation, connection indicator, and Clerk user controls.
- [ ] Build Database Connection Modal (`DbConnectionModal.tsx`) with one-click presets for SQLite, PostgreSQL, Neon, and Supabase (with automatic SSL & pooler options).
- [ ] Build Schema Explorer sidebar (`SchemaExplorer.tsx`) showing searchable tables and columns.
- [ ] Build Conversational Query Input (`QueryInput.tsx`) with sample suggestion chips.
- [ ] Build Interactive Data Table (`DataTable.tsx`) with sorting and pagination using TanStack Table.
- [ ] Build Dynamic Chart Renderer (`ChartViewer.tsx`) supporting Recharts Bar, Line, and Pie views based on backend recommendation, with manual chart type switcher.
- [ ] Build Plain-English Insight Card (`InsightCard.tsx`) highlighting key takeaways.
- [ ] Build Transparent SQL Preview modal/toggle allowing users to inspect the generated query.
- [ ] Implement CSV export utility (`ExportButton.tsx`).
- [ ] Add loading skeletons, pulse animations, and user-friendly error banners.

### Success Criteria
- Non-technical user can ask a question, inspect the response via table and auto-selected chart, read the narrative summary, and download results to CSV without seeing raw SQL errors.

---

## Phase 6: Testing, Hardening & Documentation

### Tasks
- [ ] Write integration tests for the full query pipeline (`test_api.py`).
- [ ] Add query execution timeout enforcement (default 10 seconds) to prevent slow queries from hanging.
- [ ] Perform security penetration testing on SQL injection vectors and forbidden queries.
- [ ] Write comprehensive [README.md](file:///d:/text-to-sql/README.md) with:
  - Step-by-step local setup instructions for frontend and backend.
  - Environment variable setup guide.
  - Sample database setup instructions.
- [ ] Verify TypeScript and Python type-check cleanliness (`tsc --noEmit` and `mypy` / `ruff`).

### Success Criteria
- All backend tests pass with zero regressions.
- Frontend builds without TypeScript or lint errors (`npm run build`).
- Fresh clone can be set up and running within 5 minutes following the README.
