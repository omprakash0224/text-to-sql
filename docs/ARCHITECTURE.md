# Architecture Document

## System Overview
DataSpeak is an AI-powered Text-to-SQL platform designed for non-technical users. It converts natural language queries into safe, read-only SQL queries against relational databases (PostgreSQL including Neon & Supabase, MySQL, SQLite), executes them, and returns structured data tables, auto-generated visual charts, and plain-English narrative summaries. 

User identity, session management, and API access are secured using **Clerk**.

---

## 1. Tech Stack

### Authentication & User Management
- **Auth Provider:** Clerk
- **Frontend Integration:** `@clerk/clerk-react` (Pre-built `<SignIn />`, `<SignUp />`, `<UserButton />`, and `useAuth` token hook)
- **Backend Verification:** FastAPI dependency with Clerk JWKS verification (`PyJWT` / `cryptography`) enforcing Bearer JWT token validation on protected endpoints

### Frontend
- **Framework:** React 18 + Vite (TypeScript)
- **Authentication:** `@clerk/clerk-react`
- **Styling:** Tailwind CSS
- **Component & UI Icons:** Lucide React
- **Data Visualization:** Recharts (Dynamic Bar, Line, Area, and Pie charts)
- **Data Tables:** TanStack Table (React Table v8) for sorting and pagination
- **HTTP Client & State:** Axios (with Clerk Authorization Bearer interceptor) + TanStack Query (React Query)

### Backend
- **Framework:** Python 3.11+ with FastAPI & Uvicorn (Asynchronous REST API)
- **Authentication:** Clerk JWT Bearer Authentication (`fastapi.security.HTTPBearer`)
- **Agent Orchestration:** LangChain & LangGraph (Stateful graph for query generation, validation, and self-correction)
- **LLM Inference:** Groq API (`ChatGroq`) or OpenRouter API (`ChatOpenAI`)
  - Primary Models: `llama-3.3-70b-versatile` (Groq) or `qwen-2.5-coder-32b` / `deepseek-chat` (OpenRouter)
- **Database Access & ORM:** SQLAlchemy 2.0 (Async engine)
  - Connectors: `asyncpg` (PostgreSQL, Neon, Supabase with SSL/TLS and connection pooling support), `aiomysql` (MySQL), `aiosqlite` (SQLite)
  - Cloud PostgreSQL Compatibility: Native support for Neon (`sslmode=require`, pooled endpoints) and Supabase (Transaction/Session pooler on port 6543 / 5432)
- **SQL Security & AST Parsing:** `sqlglot` (Strict read-only AST parser, statement type validation, automatic `LIMIT` enforcement)
- **Data Serialization:** Pydantic v2

---

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph Auth["Identity & Authentication (Clerk)"]
        ClerkAuth["Clerk Identity Platform"]
        ClerkJWKS["Clerk Public JWKS Key Endpoint"]
    end

    subgraph Client["Frontend Layer (React + Vite)"]
        ClerkUI["Clerk Auth UI (Sign In / UserButton)"]
        PromptBox["Natural Language Query Input"]
        TableComp["Interactive Data Table"]
        ChartComp["Dynamic Recharts Component"]
        SummaryComp["Plain-English Insight Card"]
    end

    subgraph API["Backend Gateway (FastAPI)"]
        Router["FastAPI REST Router"]
        AuthGuard["Clerk JWT Auth Guard (Depends: get_current_user)"]
        ConnManager["DB Connection Manager"]
        SchemaService["Schema Inspector & Cache"]
    end

    subgraph Agent["AI Agent Core (LangGraph)"]
        Graph["LangGraph Workflow"]
        SchemaTool["Schema Context Injector"]
        SQLGen["SQL Generator Node"]
        Validator["AST SQL Guardrail Node (sqlglot)"]
        Visualizer["Chart & Summary Node"]
    end

    subgraph LLM["LLM Inference Providers"]
        Groq["Groq API (Llama 3.3 70B)"]
        OpenRouter["OpenRouter API (Multi-model Fallback)"]
    end

    subgraph Storage["Target Relational Databases"]
        Postgres[("PostgreSQL / Neon / Supabase")]
        MySQL[("MySQL")]
        SQLite[("SQLite")]
    end

    ClerkUI <-->|"Authenticate & Issue JWT"| ClerkAuth
    PromptBox -->|"POST /api/v1/query (Bearer JWT)"| Router
    Router --> AuthGuard
    AuthGuard <-->|"Verify Token via JWKS"| ClerkJWKS
    AuthGuard -->|"Authorized (User Context)"| Graph

    ConnManager -->|"Inspect Tables/Columns"| Storage
    ConnManager --> SchemaService
    SchemaService --> SchemaTool

    Graph --> SchemaTool
    SchemaTool --> SQLGen
    SQLGen <-->|"Fast Inference"| Groq
    SQLGen <-->|"Fallback Inference"| OpenRouter
    SQLGen --> Validator

    Validator -->|"Safe SELECT"| Storage
    Validator -->|"Forbidden DDL/DML"| Graph

    Storage -->|"Query Result (Rows)"| Visualizer
    Visualizer <-->|"Chart Suggestion & Narrative"| Groq

    Visualizer --> Router
    Router -->|"JSON (Rows, Chart Config, Summary)"| Client

    Client --> TableComp
    Client --> ChartComp
    Client --> SummaryComp
```

---

## 3. Flow Charts

### User Authentication & Protected Query Flow

```mermaid
flowchart TD
    User(["User"]) --> OpenApp["Open DataSpeak Web App"]
    OpenApp --> AuthCheck{"Is user authenticated in Clerk?"}
    
    AuthCheck -- "No" --> ShowLogin["Render Clerk SignIn / SignUp modal"]
    ShowLogin --> UserLogin["User logs in via Clerk (Email, Google, etc.)"]
    UserLogin --> AuthCheck

    AuthCheck -- "Yes" --> LoadDashboard["Load Main Dashboard & Active DB Connection"]
    LoadDashboard --> SubmitPrompt["User enters question & submits query"]
    SubmitPrompt --> AttachJWT["Frontend Axios interceptor attaches Clerk Bearer JWT"]
    
    AttachJWT --> SendReq["Send POST request to FastAPI backend"]
    SendReq --> VerifyJWT{"Verify JWT signature against Clerk JWKS"}
    
    VerifyJWT -- "Invalid / Expired" --> Return401["Return 401 Unauthorized"]
    VerifyJWT -- "Valid" --> ExtractUser["Extract User ID & Permissions"]
    
    ExtractUser --> FetchSchema["Retrieve database schema context"]
    FetchSchema --> BuildPrompt["Assemble prompt with schema and question"]
    BuildPrompt --> CallLLM["Invoke LLM (Groq / OpenRouter)"]
    CallLLM --> ExtractSQL["Extract generated SQL statement"]
    ExtractSQL --> ASTCheck{"Is SQL valid and strictly read-only?"}

    ASTCheck -- "Forbidden (Mutation DDL/DML)" --> BlockQuery["Block execution and return security warning"]
    ASTCheck -- "Syntax Error" --> Retry["Feed error back to LLM for self-correction (max 2 retries)"]
    Retry --> CallLLM

    ASTCheck -- "Clean SELECT" --> EnforceLimit["Enforce query limit (default LIMIT 100)"]
    EnforceLimit --> ExecQuery["Execute query on target database (Read-Only session)"]
    ExecQuery --> ProcessResults["Format tabular data & auto-generate charts & summary"]
    ProcessResults --> ReturnPayload(["Send response to frontend"])
```

### Database Connection & Schema Ingestion Flow

```mermaid
flowchart TD
    InputConn(["User submits connection parameters"]) --> AuthValidation["Verify Clerk JWT token"]
    AuthValidation --> TestConn{"Test database connectivity"}
    TestConn -- "Failed" --> ConnError["Return connection error message"]
    TestConn -- "Success" --> InspectSchema["Run SQLAlchemy reflection"]

    InspectSchema --> ExtractMeta["Extract tables, column names, types, primary keys, and foreign keys"]
    ExtractMeta --> SampleRows["Fetch small data sample (3 rows per table) for semantic hints"]
    SampleRows --> StoreCache["Cache normalized schema representation in memory tagged by User/Org"]
    StoreCache --> ReadyStatus(["Database status: CONNECTED & READY"])
```

---

## 4. Folder Structure

```
text-to-sql/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── connections.py      # Connect, test, and disconnect database
│   │   │   │   ├── queries.py          # Process natural language queries
│   │   │   │   ├── schema.py           # Get active schema and table details
│   │   │   │   └── history.py          # Query history and bookmarks
│   │   │   └── api_router.py
│   │   ├── core/
│   │   │   ├── config.py               # App configuration & environment settings
│   │   │   ├── auth.py                 # Clerk JWT verification & get_current_user dependency
│   │   │   └── security.py             # Read-only policy & sanitization helpers
│   │   ├── agent/
│   │   │   ├── state.py                # LangGraph agent state definition
│   │   │   ├── graph.py                # Graph compilation (nodes and conditional edges)
│   │   │   ├── prompts.py              # System prompts for SQL generation & summarization
│   │   │   └── llm.py                  # Groq and OpenRouter client providers
│   │   ├── guardrails/
│   │   │   ├── validator.py            # sqlglot-based read-only AST validator
│   │   │   └── sanitizer.py            # SQL cleanup and LIMIT enforcement
│   │   ├── db/
│   │   │   ├── connection.py           # Dynamic SQLAlchemy async engine factory
│   │   │   ├── inspector.py            # Schema reflection & metadata extractor
│   │   │   └── executor.py             # Safe query execution handler
│   │   ├── models/
│   │   │   ├── user.py                 # Clerk authenticated user representation
│   │   │   ├── request.py              # Pydantic request models
│   │   │   └── response.py             # Pydantic response models (Table, Chart, Summary)
│   │   └── services/
│   │       ├── chart_service.py        # Chart type selector (bar, line, pie)
│   │       └── summary_service.py      # Plain-English insight generator
│   ├── tests/
│   │   ├── test_auth.py                # Unit tests for Clerk JWT verification
│   │   ├── test_guardrails.py          # Unit tests for query blocking
│   │   ├── test_agent.py               # Unit tests for text-to-SQL logic
│   │   └── test_api.py                 # Endpoint integration tests
│   ├── requirements.txt                # Python dependencies (includes pyjwt, cryptography)
│   ├── .env.example                    # Environment variable template (CLERK_ISSUER, etc.)
│   └── main.py                         # Application entrypoint
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── ProtectedRoute.tsx  # Clerk auth protection gate
│   │   │   │   └── AuthNavbar.tsx      # Clerk UserButton & organization switcher
│   │   │   ├── chat/
│   │   │   │   ├── QueryInput.tsx      # Natural language search box
│   │   │   │   ├── QueryHistory.tsx    # Recent questions & saved queries
│   │   │   │   └── SqlPreviewModal.tsx # Transparent SQL preview modal
│   │   │   ├── results/
│   │   │   │   ├── DataTable.tsx       # Interactive paginated results table
│   │   │   │   ├── ChartViewer.tsx     # Dynamic Recharts renderer (Bar, Line, Pie)
│   │   │   │   ├── InsightCard.tsx     # AI plain-English summary card
│   │   │   │   └── ExportButton.tsx    # CSV/Excel export trigger
│   │   │   ├── schema/
│   │   │   │   └── SchemaExplorer.tsx  # Sidebar listing available tables & columns
│   │   │   ├── settings/
│   │   │   │   └── DbConnectionModal.tsx # Connection configuration modal
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── AppLayout.tsx
│   │   ├── hooks/
│   │   │   ├── useQueryExecution.ts    # React Query hook for running queries
│   │   │   └── useDatabase.ts          # Hook for managing connection state
│   │   ├── services/
│   │   │   └── api.ts                  # Axios client with Clerk Bearer token interceptor
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces (QueryResponse, Schema, User)
│   │   ├── utils/
│   │   │   └── exportUtils.ts          # CSV generation and download helper
│   │   ├── App.tsx                     # ClerkProvider wrapper & main layout
│   │   ├── index.css                   # Tailwind CSS imports and design tokens
│   │   └── main.tsx                    # React DOM entry point
│   ├── package.json                    # Dependencies (includes @clerk/clerk-react)
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── PRD.md                              # Product Requirements Document
├── ARCHITECTURE.md                     # System Architecture & Technical Specifications
└── README.md                           # Project setup and getting started guide
```
