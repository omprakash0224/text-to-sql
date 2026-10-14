# DataSpeak — Agent Context & Operational Guidelines

This file serves as the root-level context and operational compass for AI coding agents working in the **DataSpeak** repository. All agents must read and strictly adhere to the guidelines, architectural boundaries, and security policies outlined here.

---

## 1. Project Overview

**DataSpeak** is an AI-powered conversational Text-to-SQL platform built for non-technical users (operations, product managers, business analysts). It transforms natural language questions into safe, read-only SQL queries, executes them against relational databases, and presents the output through interactive data tables, automated visual charts (Recharts), and plain-English insight summaries.

### Primary Objectives
- **Self-Service Analytics:** Empower non-technical teams to query databases without writing SQL.
- **Absolute Guardrail Safety:** Zero tolerance for database mutations, injection vectors, or schema modifications.
- **Sub-Second Performance:** Low-latency conversational SQL generation leveraging ultra-fast LLM inference.
- **Cloud Database Support:** Seamless, secure connectivity to PostgreSQL (including Neon & Supabase with SSL/TLS and connection pooling), MySQL, and SQLite.

---

## 2. Technical Stack

| Domain | Technology / Library | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, Vite, TypeScript | Modern, high-performance client SPA |
| **Styling & UI** | Tailwind CSS, Lucide React | Modular, accessible design system & icons |
| **Tables & Charts** | TanStack Table v8, Recharts | Dynamic sorting, pagination, and visualizations |
| **State & API** | Axios, TanStack Query (React Query) | Server state management and token interceptors |
| **Auth & Identity** | Clerk (`@clerk/clerk-react`) | Authentication, session management, and JWTs |
| **Backend Core** | Python 3.11+, FastAPI, Uvicorn | Asynchronous REST API server |
| **Backend Auth** | PyJWT, Cryptography, HTTPBearer | Server-side Clerk JWKS JWT verification |
| **Agent Core** | LangChain, LangGraph | Stateful multi-step agent and self-correction loop |
| **LLM Inference** | Groq (`llama-3.3-70b-versatile`), OpenRouter | Ultra-fast generation with multi-model fallback |
| **SQL Engine** | SQLAlchemy 2.0 (Async) | Unified async connection pooling and schema inspection |
| **DB Drivers** | `asyncpg`, `aiomysql`, `aiosqlite` | Async drivers for Postgres/Neon/Supabase, MySQL, SQLite |
| **SQL Guardrails** | `sqlglot` | AST parsing, strict SELECT enforcement, LIMIT injection |
| **Data Schemas** | Pydantic v2 | Strict request/response typing and runtime validation |

---

## 3. Monorepo Repository Structure

```
text-to-sql/
├── AGENTS.md                  # Root-level context & agent instructions (this file)
├── .env.example               # Template for environment variables (backend & frontend)
├── docs/                      # Architectural and specification documents
│   ├── PRD.md                 # Product requirements and MVP scope
│   ├── ARCHITECTURE.md        # System architecture, data flows, and diagrams
│   ├── RULES.md               # Coding rules, standards, and conventions
│   ├── SECURITY.md            # Threat model, auth, and guardrail requirements
│   ├── DECISIONS.md           # Architecture Decision Records (ADRs)
│   └── TASK.md                # Phase-by-phase implementation roadmap
├── backend/                   # Python FastAPI & LangGraph application
│   ├── app/
│   │   ├── api/v1/            # API endpoints (connections, queries, schema, history)
│   │   ├── core/              # Config, Clerk JWT auth guard, security utilities
│   │   ├── agent/             # LangGraph state, workflow graph, prompts, LLM client
│   │   ├── guardrails/        # sqlglot AST validator and query row-limiter
│   │   ├── db/                # SQLAlchemy engine factory, schema inspector, executor
│   │   ├── models/            # Pydantic v2 request/response and user models
│   │   └── services/          # Chart selector and narrative summary services
│   ├── tests/                 # Unit and integration test suites
│   ├── requirements.txt       # Backend dependencies
│   └── main.py                # FastAPI application entrypoint
└── frontend/                  # React + Vite TypeScript application
    ├── src/
    │   ├── components/        # UI modules (auth, chat, results, schema, layout)
    │   ├── hooks/             # Custom React hooks (useQueryExecution, useDatabase)
    │   ├── services/          # Axios API client with Clerk Bearer interceptor
    │   ├── types/             # TypeScript type definitions
    │   ├── utils/             # Helper utilities (CSV export, formatting)
    │   ├── App.tsx            # Root layout with ClerkProvider
    │   ├── index.css          # Tailwind CSS and global style definitions
    │   └── main.tsx           # React DOM entry point
    ├── package.json           # Frontend dependencies
    └── vite.config.ts         # Vite build configuration
```

---

## 4. Non-Negotiable Guardrails & Security Policies

Every agent operating in this repository must enforce the following rules:

### A. SQL AST Guardrails & Execution Policy
1. **Strictly Read-Only:** All generated SQL must be validated via `sqlglot` Abstract Syntax Tree (AST) analysis prior to execution. Only `SELECT` statements are permitted.
2. **Prohibited Operations:** Automatically block any query containing mutation or DDL statements:
   - `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`
3. **No Semicolon / Multi-Statement Queries:** Reject queries with stacked statements to prevent SQL injection.
4. **Mandatory Row Caps:** Automatically inject a default row limit (`LIMIT 100`) if omitted by the model.
5. **Read-Only Connections:** Execute queries using read-only roles where supported, with transaction rollbacks after each execution.
6. **Execution Timeouts:** Enforce a maximum query execution timeout (default: 10 seconds).
7. **Cloud SSL/TLS:** Enforce `sslmode=require` for all cloud-hosted databases (Neon, Supabase, AWS RDS).

### B. Authentication & Tenant Isolation
1. **Server-Side Token Verification:** All private backend endpoints must enforce Clerk Bearer JWT validation using Clerk JWKS public keys.
2. **Tenant Isolation:** Users may only inspect or query database connections and query histories belonging to their authenticated session.
3. **Secret Protection:**
   - Never expose LLM provider keys (`GROQ_API_KEY`, `OPENROUTER_API_KEY`) or database passwords to the frontend.
   - Target database credentials must never be returned in API responses.

### C. Data Export & Output Sanitization
1. **CSV Injection Defense:** Neutralize potential CSV formula injection vectors by quoting cells starting with `=`, `+`, `-`, or `@`.
2. **Friendly Error Messages:** Sanitize database errors and stack traces before returning them to the UI to avoid exposing internal schema details to non-technical users.

---

## 5. Coding Standards & Conventions

### Python Backend
- Target **Python 3.11+** with strict type annotations.
- Use **Pydantic v2** models for all API request bodies, response schemas, and agent state objects.
- Keep all I/O asynchronous (`async`/`await`) using `asyncpg`, `aiomysql`, `aiosqlite`, and `httpx`.
- Maintain modular structure: Separation of concern between API routes, agent logic, database inspection, and AST validation.
- Implement automated self-correction loops in LangGraph with a hard cap of 2 retry attempts on SQL syntax errors.

### TypeScript Frontend
- Maintain **strict TypeScript**; avoid `any`. Define clean interfaces in `src/types/index.ts`.
- Build fully responsive, accessible layouts using **Tailwind CSS** and **Lucide React** icons.
- Ensure all interactive states are accounted for:
  - **Loading:** Skeletons and spinners during AI SQL generation.
  - **Empty States:** Friendly placeholders for new connections, zero-row results, or empty histories.
  - **Error States:** Actionable error banners with guidance.
  - **Fallback:** Gracefully fall back to data tables if chart rendering encounters non-visualizable data.

### Testing & Verification
- Unit test all AST guardrail logic in `backend/tests/test_guardrails.py` to ensure 100% rejection of malicious queries.
- Test LangGraph agent state transitions and retry boundaries.
- Run type checks (`tsc --noEmit` on frontend, `mypy`/`ruff` on backend) before submitting work.

### Git & Change Management
- Make small, focused, atomic changes. Do not alter unrelated files.
- Follow Conventional Commits format (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

---

## 6. Development Workflow & Commands

### Backend (FastAPI)
```bash
# Set up virtual environment and install dependencies
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r backend/requirements.txt

# Run backend development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000 --app-dir backend

# Run backend test suite
pytest backend/tests/
```

### Frontend (React + Vite)
```bash
# Install dependencies
cd frontend
npm install

# Run frontend development server
npm run dev

# Run TypeScript type check & production build
npm run build
```

---

## 7. Canonical Documentation Index

Agents must consult the authoritative documentation in the `docs/` folder before proposing major changes or designing new modules:

- [Product Requirements Document](file:///d:/text-to-sql/docs/PRD.md): MVP scope, features, and target user persona.
- [Architecture Specifications](file:///d:/text-to-sql/docs/ARCHITECTURE.md): Full system diagrams, request flows, and directory tree.
- [Development Rules](file:///d:/text-to-sql/docs/RULES.md): Coding rules, SQL safety, and frontend conventions.
- [Security Requirements](file:///d:/text-to-sql/docs/SECURITY.md): Threat mitigation, Clerk JWT auth, and guardrail specifications.
- [Architecture Decisions (ADRs)](file:///d:/text-to-sql/docs/DECISIONS.md): Key architectural choices and design rationales.
- [Task Roadmap & Milestones](file:///d:/text-to-sql/docs/TASK.md): Phased implementation checklist and success criteria.
- [Environment Configuration Template](file:///d:/text-to-sql/.env.example): Complete configuration variables for backend and frontend.
