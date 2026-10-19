# DataSpeak — Project Memory Log

> Maintained by the AI coding agent. Updated after every implementation phase.
> Acts as a living changelog and architectural decision log for the project.

---

## Current Project Status

| Dimension | Status |
|---|---|
| **Phase** | Phase 3 ✅ Complete |
| **Next Phase** | Phase 4 — AI Agent Orchestration (LangGraph + Groq/OpenRouter) |
| **Backend** | FastAPI — auth guard active, /api/v1/auth/me, connections & schema active |
| **Frontend** | React 19 + ClerkProvider + Axios JWT interceptor active |
| **Auth** | ✅ Clerk JWKS JWT verification + get_current_user dependency |
| **SQL Guardrails** | ✅ sqlglot AST validator & auto LIMIT injection (51/51 tests passing) |
| **Database Connectivity** | ✅ SQLAlchemy async factory (Postgres/Neon/Supabase/MySQL/SQLite) + Inspector |
| **AI Agent** | ❌ Not implemented (Phase 4) |
| **UI Components** | Base layout + Auth Navbar + ProtectedRoute (Phase 5 full components) |

---

## Phase 1 — Project Setup & Core Infrastructure

**Completed:** 2026-10-14  
**Goal:** Establish a runnable monorepo with backend scaffold and frontend base layout.

### What Was Added

#### Backend (`backend/`)

| File | Purpose |
|---|---|
| `backend/requirements.txt` | All Python dependencies pinned: FastAPI, Uvicorn, SQLAlchemy 2.0 async, asyncpg/aiomysql/aiosqlite drivers, sqlglot, LangChain/LangGraph/Groq, PyJWT, Cryptography, structlog, pydantic-settings |
| `backend/main.py` | FastAPI app factory (`create_app()`), CORS middleware, lifespan handler (startup/shutdown logging), module-level `app` instance for Uvicorn |
| `backend/app/core/config.py` | Pydantic-settings `Settings` class loading all env vars; cached singleton via `get_settings()`. Never re-parses `.env` on every call. |
| `backend/app/core/logging.py` | structlog configuration — pretty console in dev, JSON in production. `get_logger()` factory used everywhere instead of stdlib logging. |
| `backend/app/api/v1/__init__.py` | APIRouter aggregator for all v1 sub-routers (sub-routers added per phase) |
| Package stubs | `app/agent/`, `app/guardrails/`, `app/db/`, `app/models/`, `app/services/` — empty `__init__.py` files establishing the module tree for future phases |

**Health check endpoint:**
```
GET /health → {"status": "ok", "environment": "development", "version": "0.1.0", "uptime_seconds": <n>}
```

**Run command:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (`frontend/`)

| File | Purpose |
|---|---|
| `frontend/vite.config.ts` | Added `@tailwindcss/vite` plugin; dev-server proxy routes `/api/*` → `http://localhost:8000` |
| `frontend/src/index.css` | **DataSpeak Design System** — CSS custom properties (brand palette, surface layers, shadows, transitions), `ds-glass`, `ds-card`, `ds-gradient-text` utility classes, Inter + JetBrains Mono typography, shimmer/fade-in keyframes, custom scrollbar |
| `frontend/src/App.tsx` | Base layout: glassmorphic sticky nav (logo, status pill, sign-in button), animated hero (gradient headline, CTA buttons, feature pills), footer. Uses Lucide React icons. |
| `frontend/src/types/index.ts` | Central TypeScript type definitions: `ApiResponse`, `HealthCheckResponse`, `DatabaseConnection`, `TableSchema`, `QueryResult`, `ChartConfig`, `LoadingState`, `AppNotification` |
| `frontend/index.html` | Updated with DataSpeak SEO title and meta description |

**Run command:**
```bash
cd frontend
npm install       # install tailwindcss @tailwindcss/vite lucide-react if not done
npm run dev       # http://localhost:5173
```

### Why These Decisions Were Made

| Decision | Rationale |
|---|---|
| `pydantic-settings` for config | Type-safe env loading with validation; `@lru_cache` avoids disk I/O on every request |
| structlog over stdlib | JSON-structured logs in production are essential for log aggregators (Datadog, Loki); pretty console in dev |
| `@tailwindcss/vite` plugin | Official Vite-native Tailwind v4 integration — no PostCSS config needed |
| CSS custom properties alongside Tailwind | DS design tokens are referenced in inline styles and JS for dynamic theming (chart colors, hover effects) |
| Dev-server proxy in Vite | Eliminates CORS issues during local development without changing backend config |
| Package stubs (empty `__init__.py`) | Locks down the module tree early — avoids import errors when Phase 2+ modules start referencing sibling packages |

---

## Architecture Invariants (Never Violate)

- **All SQL must pass sqlglot AST validation before execution** (Phase 2+)
- **Only `SELECT` statements are permitted** — no mutations, no DDL
- **All private API endpoints require Clerk Bearer JWT** (Phase 2+)
- **Database credentials never returned in API responses**
- **LLM API keys never exposed to the frontend**
- **Max row limit: 100 (configurable via `DEFAULT_QUERY_ROW_LIMIT`)**
- **Query execution timeout: 10 seconds (configurable)**

---

## Pending TODOs (Carry-Forward)

- [x] Install Python venv and `pip install -r requirements.txt` (user's local machine)
- [x] Install frontend deps: `npm install tailwindcss @tailwindcss/vite lucide-react @clerk/clerk-react axios`
- [x] Copy `.env.example` → `.env` template in repository root
- [x] Phase 2: Clerk JWT auth guard + SQL AST guardrail module + unit tests (59/59 passing)
- [x] Phase 3: SQLAlchemy async engine factory, schema reflection, connection endpoints, sample DB
- [ ] Phase 4: LangGraph agent, Groq LLM client, query execution pipeline
- [ ] Phase 5: Full UI (connection modal, schema explorer, query input, data table, charts)
- [ ] Phase 6: Integration tests, security hardening, README

---

## File Tree (After Phase 1)

```
text-to-sql/
├── AGENTS.md                       ✅ Root agent context
├── MEMORY.md                       ✅ This file — project log
├── .env.example                    ✅ All config variables documented
├── .gitignore
├── docs/
│   ├── TASK.md                     ✅ Phase 1 tasks marked complete
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── RULES.md
│   ├── SECURITY.md
│   └── DECISIONS.md
├── backend/
│   ├── requirements.txt            ✅ All deps pinned
│   ├── main.py                     ✅ FastAPI app + /health endpoint
│   └── app/
│       ├── __init__.py
│       ├── api/
│       │   ├── __init__.py
│       │   └── v1/
│       │       └── __init__.py     ✅ APIRouter aggregator
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py           ✅ Pydantic-settings config
│       │   └── logging.py          ✅ structlog setup
│       ├── agent/        __init__.py  (stub — Phase 4)
│       ├── guardrails/   __init__.py  (stub — Phase 2)
│       ├── db/           __init__.py  (stub — Phase 3)
│       ├── models/       __init__.py  (stub — Phases 2-5)
│       └── services/     __init__.py  (stub — Phases 4-5)
└── frontend/
    ├── index.html                  ✅ DataSpeak SEO title + meta
    ├── vite.config.ts              ✅ Tailwind plugin + API proxy
    ├── package.json
    └── src/
        ├── main.tsx                ✅ Clean entry point
        ├── index.css               ✅ DataSpeak design system
        ├── App.tsx                 ✅ Base layout (nav + hero + footer)
        └── types/
            └── index.ts            ✅ Central TS type definitions
```
