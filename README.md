# DataSpeak

> **Safe, Self-Service Conversational Text-to-SQL Platform with Absolute Read-Only Guardrails and Automated Visual Analytics.**

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%206.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_Workflow-FF6F00?style=for-the-badge&logo=langchain&logoColor=white)
![Groq LPU](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Clerk Auth](https://img.shields.io/badge/Auth-Clerk_JWKS-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![PostgreSQL & Redis](https://img.shields.io/badge/Storage-PostgreSQL_%26_Redis-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

---

## Table of Contents

- [The Origin: What It Was](#the-origin-what-it-was)
- [The Solution: What Problem It Solves](#the-solution-what-problem-it-solves)
- [How It Is Made](#how-it-is-made)
- [System Architecture](#system-architecture)
- [Core Features](#core-features)
- [Installation & Quickstart](#installation--quickstart)
  - [Prerequisites](#prerequisites)
  - [1. Environment Configuration](#1-environment-configuration)
  - [2. Start Local Infrastructure (Docker)](#2-start-local-infrastructure-docker)
  - [3. Backend Setup (FastAPI)](#3-backend-setup-fastapi)
  - [4. Frontend Setup (React 19 + Vite)](#4-frontend-setup-react-19--vite)
- [Verification & Testing](#verification--testing)
- [Production Deployment](#production-deployment)
- [Project Structure & Documentation](#project-structure--documentation)
- [License](#license)

---

## The Origin: What It Was

In traditional organizations, business intelligence and data access have long suffered from an intractable structural bottleneck:

1. **The "Ticket to Nowhere" Engineering Queue:** Operations managers, product leads, and business analysts needing routine business answers (e.g., *"Which customer cohorts had the highest churn after onboarding last month?"* or *"What is our top-selling SKU by region?"*) were forced to file tickets with data engineering teams. Turnaround times were measured in **days or weeks**, causing missed market windows and stalling operational decisions.
2. **The "Shadow IT" Security Nightmare:** Frustrated by wait times, teams turned to risky workarounds: sharing raw read/write database credentials across teams, copying production credentials into unvetted desktop SQL clients, or asking non-technical users to run ad-hoc scripts. A single accidental `DELETE` without a `WHERE` clause, an unchecked `UPDATE`, or an unindexed query could corrupt production databases or trigger catastrophic downtime.
3. **The Fragile First-Gen Text-to-SQL Era:** Early attempts to leverage LLMs for SQL generation were dangerously brittle:
   - **No AST Guardrails:** Naive regex checks were easily bypassed by multi-statement queries or subtle SQL injection techniques.
   - **Schema Hallucinations:** Models invented non-existent table and column names without dynamic schema ground truth.
   - **Zero Fault Tolerance:** When a database threw a syntax or typing error, the tool crashed and displayed an intimidating traceback to business users.
   - **Raw SQL Dumps:** Models returned cold SQL code blocks or unformatted JSON blobs, leaving non-technical users right back where they started—unable to visualize or interpret the results.

---

## The Solution: What Problem It Solves

**DataSpeak** bridges the divide between non-technical business operators and relational databases through a conversational, autonomous, and mathematically safe interface:

- **Self-Service Analytics in Plain English:** Anyone can query business data by asking questions in conversational English. Queries execute in **sub-2-second turnaround** time.
- **Absolute Read-Only Guardrails (Zero Mutation Risk):** Every generated query passes through a strict [sqlglot](https://github.com/tobymao/sqlglot) Abstract Syntax Tree (AST) parser prior to execution. Any mutation statement (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`) or multi-statement injection attempt is blocked before touching the database.
- **Autonomous Self-Correction Loop:** If an initial SQL draft triggers a database syntax error or column mismatch, [LangGraph](https://github.com/langchain-ai/langgraph) catches the database error and feeds the compiler diagnostic back to the LLM for automatic self-healing (up to 2 retry attempts) without user intervention.
- **Cognitive Clarity Over Raw Code:** Non-technical operators do not want to inspect raw SQL. DataSpeak returns a comprehensive **4-part structured answer**:
  1. **Plain-English Executive Summary:** Contextual narrative explaining what the data indicates.
  2. **Automated Visual Charts:** Dynamic [Recharts](https://recharts.org/) (Bar, Line, Area, or Pie) intelligently chosen based on data cardinality.
  3. **Interactive Data Grid:** Sortable, paginated [TanStack Table](https://tanstack.com/table/v8) with numerical formatting.
  4. **Collapsible SQL Inspector:** Full transparency with verified read-only badges and execution runtime stats.
- **Universal Cloud & Local Database Support:** Out-of-the-box native support for PostgreSQL (including [Neon](https://neon.tech/) and [Supabase](https://supabase.com/) with SSL/TLS and connection pooling modes), MySQL, and SQLite.
- **Production Defense in Depth:** Includes stateless Clerk JWKS JWT authentication, Redis sliding-window rate limiting, and CSV export formula sanitization (`=`, `+`, `-`, `@`).

---

## How It Is Made

DataSpeak is built using a modern, decoupled cloud-native architecture combining an asynchronous Python agent backend with a reactive TypeScript single-page application.

### 1. Frontend Client Architecture
- **Framework & Build:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/) for rapid hot-reloading and micro-interaction responsiveness.
- **Design System & Aesthetics:** PostHog- and Notion-inspired aesthetic—featuring a warm paper canvas (`#f6f5f4`), crisp white cards, olive-charcoal code surfaces (`#23251d`), and [Tailwind CSS v4](https://tailwindcss.com/) design tokens with [Lucide React](https://lucide.dev/) icons.
- **Interactive Tables & Visualizations:** [TanStack Table v8](https://tanstack.com/table/v8) for high-performance sorting, filtering, and pagination; [Recharts](https://recharts.org/) for responsive, theme-tailored charts.
- **Client Identity & Security:** Pre-built authentication components via [`@clerk/clerk-react`](https://clerk.com/docs/quickstarts/react) paired with an Axios Bearer token interceptor.

### 2. Backend Gateway & Security Layer
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+) running on [Uvicorn](https://www.uvicorn.org/) for high-concurrency asynchronous I/O.
- **Authentication & Tenant Isolation:** Stateless server-side verification using Clerk JWKS public keys via [`PyJWT`](https://pyjwt.readthedocs.io/) and [`cryptography`](https://cryptography.io/). Every query, history item, and bookmark is isolated to the authenticated user ID.
- **Abuse Prevention:** Redis-backed sliding-window rate limiter preventing inference endpoint flooding with configurable burst caps.
- **Data Validation:** Strict [Pydantic v2](https://docs.pydantic.dev/latest/) schemas for all incoming API payloads and outbound JSON contracts.

### 3. AI Agent Core & Self-Correction Engine
- **Agent Workflow:** Orchestrated by [LangChain](https://www.langchain.com/) and [LangGraph](https://www.langchain.com/langgraph) state machines. The graph compiles dedicated nodes for schema injection, prompt assembly, AST safety validation, execution, self-correction, and visualization synthesis.
- **Ultra-Fast LLM Inference:** Powered by [Groq](https://groq.com/) running `llama-3.3-70b-versatile` on specialized LPUs for sub-second text-to-SQL generation, backed by [OpenRouter](https://openrouter.ai/) for multi-model fallback resilience (`qwen-2.5-coder-32b`).
- **AST Guardrails:** Every generated query is parsed into an Abstract Syntax Tree via [`sqlglot`](https://github.com/tobymao/sqlglot). Enforces strict `SELECT`-only execution, automatic `LIMIT 100` injection, and multi-statement blocking.

### 4. Database Engine & Schema Reflection
- **Engine & Drivers:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) Async engine leveraging `asyncpg` (PostgreSQL / Neon / Supabase), `aiomysql` (MySQL), and `aiosqlite` (SQLite).
- **Automated Metadata Reflection:** Inspects database catalogs to extract table names, column data types, primary keys, foreign keys, and 3-row sample records to ground the LLM in real data semantics.
- **Internal Platform Database:** PostgreSQL stores user query histories, execution latencies, and bookmarks, with automated [Alembic](https://alembic.sqlalchemy.org/) migrations.

---

## System Architecture

The following diagram illustrates the end-to-end request lifecycle and component boundaries:

```mermaid
graph TD
    subgraph Client["Frontend Layer (React 19 + TypeScript + Vite)"]
        UI["User Interface (Tailwind CSS v4 + Lucide)"]
        ClerkClient["Clerk Auth Provider (JWT Issuer)"]
        PromptBox["Natural Language Query Input"]
        ResultsView["Results View (Summary + Recharts + TanStack Table + SQL)"]
    end

    subgraph Gateway["Backend Security & Gateway (FastAPI)"]
        API["FastAPI REST Router (/api/v1)"]
        ClerkJWKS["Clerk JWKS Token Verifier"]
        RateLimiter["Redis Sliding-Window Rate Limiter"]
    end

    subgraph Agent["AI Agent Core (LangGraph)"]
        SchemaInjector["Schema Context Injector & Sampler"]
        SQLGen["SQL Generator Node (Prompt Construction)"]
        ASTValidator["sqlglot AST Guardrail Node"]
        Executor["Async Query Execution Node"]
        CorrectionCheck{"Syntax / Runtime Error?"}
        Visualizer["Chart Selector & Summary Generator"]
    end

    subgraph LLM["LLM Inference Layer"]
        Groq["Groq API (Llama 3.3 70B / Qwen 27B)"]
        OpenRouter["OpenRouter (Fallback Inference)"]
    end

    subgraph Storage["Storage & Target Relational Databases"]
        AppDB[("Neon / PostgreSQL (Query History & Bookmarks)")]
        RedisCache[("Redis (Sliding Rate Limiter & Cache)")]
        UserDB[("Customer DB: Postgres / Supabase / Neon / MySQL / SQLite")]
    end

    %% Client Interactions
    UI --> ClerkClient
    PromptBox -->|"POST /api/v1/queries/ask (Bearer JWT)"| API
    API --> ClerkJWKS
    API --> RateLimiter
    RateLimiter <--> RedisCache

    %% Agent Flow
    ClerkJWKS -->|"Authorized User Context"| SchemaInjector
    SchemaInjector -->|"Reflect Schema & Samples"| UserDB
    SchemaInjector --> SQLGen
    SQLGen <-->|"LPU Fast Inference"| Groq
    SQLGen <-->|"Multi-Model Fallback"| OpenRouter
    SQLGen --> ASTValidator

    %% AST Guardrails & Routing
    ASTValidator -->|"Forbidden DDL/DML Blocked"| API
    ASTValidator -->|"Validated Clean SELECT"| Executor
    Executor -->|"Execute Read-Only Query"| UserDB
    Executor --> CorrectionCheck

    %% Self-Correction Loop
    CorrectionCheck -->|"Retry with Error Feedback (Attempts <= 2)"| SQLGen
    CorrectionCheck -->|"Success (Valid Results)"| Visualizer

    %% Response Synthesis
    Visualizer <-->|"Synthesize Narrative & Chart Logic"| Groq
    Visualizer -->|"Record Execution & History"| AppDB
    Visualizer -->|"Structured Response (Rows, Charts, Summary)"| API
    API --> ResultsView
```

---

## Core Features

| Feature | Description |
| :--- | :--- |
| **Natural Language to SQL** | Translates ambiguous, conversational business questions into precision ANSI SQL. |
| **AST Safety Guardrails** | Validates query Abstract Syntax Trees via `sqlglot`. Blocks all mutations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.) and enforces default `LIMIT 100`. |
| **LangGraph Self-Correction** | Automatically catches database runtime errors, feeds syntax faults back to the LLM, and self-repairs in up to 2 retry steps. |
| **Dynamic Visual Charts** | Intelligently chooses and renders Bar, Line, Area, or Pie charts with [Recharts](https://recharts.org/) based on query data cardinality. |
| **Interactive Data Grid** | Paginated, sortable table powered by [TanStack Table v8](https://tanstack.com/table/v8) with numerical formatting. |
| **Plain-English Summaries** | Synthesizes an executive narrative highlighting key takeaways, anomalies, and metrics. |
| **Visual Schema Explorer** | Collapsible sidebar detailing all reflected database tables, column names, and inferred data types. |
| **History & Bookmarking** | Server-side query persistence in PostgreSQL allowing users to star, review, and re-execute past queries. |
| **Injection-Safe CSV Export** | Instant CSV download equipped with formula injection protection (neutralizing `=`, `+`, `-`, `@`). |
| **Clerk Authentication** | Enterprise session handling, social SSO, and stateless Bearer JWT verification against Clerk JWKS. |
| **Redis Rate Limiting** | Sliding-window token rate limiting per authenticated user to prevent inference cost runaway. |
| **Cloud Database Support** | Native, SSL/TLS-encrypted connectivity for [Neon](https://neon.tech/) and [Supabase](https://supabase.com/) poolers, MySQL, and SQLite. |

---

## Installation & Quickstart

### Prerequisites

Ensure you have the following installed locally:
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Python 3.11+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/) and `npm`
- Accounts & API keys for:
  - [Groq Console](https://console.groq.com/keys) (Primary LLM)
  - [Clerk Dashboard](https://dashboard.clerk.com/) (Authentication)
  - *(Optional)* [OpenRouter](https://openrouter.ai/) (Fallback LLM)

---

### 1. Environment Configuration

Clone the repository and copy the environment template:

```bash
git clone https://github.com/your-username/text-to-sql.git
cd text-to-sql

# Copy template to .env
cp .env.example .env
```

Configure your credentials inside [`.env`](file:///d:/text-to-sql/.env.example):

```ini
# Backend Settings
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Clerk Authentication (Get these from Clerk Dashboard -> API Keys & JWT Templates)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_ISSUER=https://your-instance.clerk.accounts.dev
CLERK_JWKS_URL=https://your-instance.clerk.accounts.dev/.well-known/jwks.json

# LLM Providers
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen-2.5-coder-32b-instruct

# Local Internal App Database (Docker Compose)
APP_DATABASE_URL=postgresql+asyncpg://dataspeak_app:dataspeak_secure_pass@localhost:5432/dataspeak_internal

# Local Redis Cache & Rate Limiter (Docker Compose)
REDIS_URL=redis://localhost:6379/0

# Frontend Settings (React + Vite)
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

---

### 2. Start Local Infrastructure (Docker)

DataSpeak provides a [`docker-compose.yml`](file:///d:/text-to-sql/docker-compose.yml) with PostgreSQL 16 (for query history and platform state) and Redis 7 (for rate limiting):

```bash
# Start background containers
docker compose up -d

# Verify containers are healthy
docker compose ps
```

| Service | Container Name | Port | Credentials |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | `dataspeak-postgres` | `5432` | User: `dataspeak_app` / Pass: `dataspeak_secure_pass` / DB: `dataspeak_internal` |
| **Redis 7** | `dataspeak-redis` | `6379` | `redis://localhost:6379/0` (In-memory, persistent volume) |

---

### 3. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations for internal state
alembic upgrade head

# Start FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

### 4. Frontend Setup (React 19 + Vite)

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

- **DataSpeak Web Application:** [http://localhost:5173](http://localhost:5173)

---

## Verification & Testing

Execute the backend test suite covering AST guardrails, Clerk JWT authentication, schema reflection, and agent self-correction logic:

```bash
# Run backend pytest suite
backend\venv\Scripts\pytest.exe backend/tests/ -v
```

Verify frontend TypeScript compilation and production bundle build:

```bash
# Run TypeScript type check and production build
cd frontend
npm run build
```

---

## Production Deployment

DataSpeak is architected for zero-downtime, low-cost cloud deployment across modern serverless platforms:
- **Frontend:** [Vercel](https://vercel.com/) (Global Edge CDN, automatic TLS, SPA rewrites).
- **Backend:** [Render](https://render.com/) or [Google Cloud Run](https://cloud.google.com/run) (Asynchronous FastAPI server with Docker).
- **Internal Database:** [Neon Serverless PostgreSQL](https://neon.tech/) (SSL/TLS connection pooling).
- **Rate Limiting:** [Upstash Redis](https://upstash.com/) (Serverless TLS `rediss://`).

**Read the complete, step-by-step [DEPLOYMENT.md](file:///d:/text-to-sql/DEPLOYMENT.md) for detailed cloud configuration guides, secrets management, and cost analyses ($0/month free tier vs. $7–$27/month production tier).**

---

## Project Structure & Documentation

```
text-to-sql/
├── AGENTS.md                  # Root agent instructions and operational rules
├── DEPLOYMENT.md              # Production deployment & infrastructure guide
├── README.md                  # Project overview and quickstart guide (this file)
├── docker-compose.yml         # Local PostgreSQL 16 & Redis 7 services
├── .env.example               # Environment variables template
├── docs/
│   ├── PRD.md                 # Product Requirements Document & MVP scope
│   ├── ARCHITECTURE.md        # Technical architecture, workflows, & diagrams
│   ├── RULES.md               # Coding standards, AST safety, & frontend rules
│   ├── SECURITY.md            # Threat model, auth policy, & guardrail details
│   ├── DECISIONS.md           # Architecture Decision Records (ADRs)
│   ├── TASK.md                # Phase-by-phase implementation roadmap
│   └── DESIGN.md              # PostHog-inspired design tokens and aesthetics
├── backend/
│   ├── app/
│   │   ├── api/v1/            # Endpoints: connections, queries, schema, history
│   │   ├── core/              # Config, Clerk JWT verification, security guards
│   │   ├── agent/             # LangGraph state, workflow graph, prompts, LLM client
│   │   ├── guardrails/        # sqlglot AST validator & query row-limiter
│   │   ├── db/                # SQLAlchemy async engine, schema inspector, executor
│   │   ├── models/            # Pydantic v2 schemas and request/response models
│   │   └── services/          # Dynamic chart selector and narrative summaries
│   ├── tests/                 # Unit & integration test suites
│   ├── requirements.txt       # Python backend dependencies
│   └── main.py                # FastAPI entrypoint
└── frontend/
    ├── src/
    │   ├── components/        # Auth, chat, data tables, Recharts, schema explorer
    │   ├── hooks/             # Custom React hooks (useQueryExecution, useDatabase)
    │   ├── services/          # Axios API client with Clerk Bearer interceptor
    │   ├── types/             # TypeScript interface definitions
    │   ├── utils/             # CSV export sanitization and formatters
    │   ├── App.tsx            # Root layout with ClerkProvider
    │   └── main.tsx           # React DOM entry point
    ├── package.json           # Frontend dependencies
    └── vite.config.ts         # Vite configuration
```

---

## License

This project is licensed under the MIT License.
