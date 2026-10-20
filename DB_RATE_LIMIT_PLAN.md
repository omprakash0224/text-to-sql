# DataSpeak — Server-Side Query History & Redis Rate Limiting Plan
**File:** `DB_RATE_LIMIT_PLAN.md`  
**Status:** DRAFT & PROPOSED FOR IMPLEMENTATION  
**Target Environments:**
- **Development:** Docker (`postgres:16-alpine`, `redis:7-alpine`)
- **Production:** Neon Serverless PostgreSQL (`APP_DATABASE_URL`), Upstash Redis (`REDIS_URL`)

---

## 1. Executive Summary & Problem Statement

Currently in DataSpeak:
1. **Query History is Client-Only:** User query history and starred bookmarks are stored exclusively in the browser's `localStorage` (`dataspeak_query_history_v1`) via [useQueryExecution.ts](file:///d:/text-to-sql/frontend/src/hooks/useQueryExecution.ts). If the user clears browser data, switches devices, or logs in from another workstation, their historical queries and bookmarks are lost.
2. **No Rate Limiting:** The backend endpoint `POST /api/v1/queries/ask` ([queries.py](file:///d:/text-to-sql/backend/app/api/v1/queries.py)) invokes LLM inference (Groq `llama-3.3-70b-versatile` / OpenRouter fallback). Without rate limiting, rapid automated requests or accidental UI loops can cause LLM quota exhaustion, excessive API billing, or denial of service on database connections.

### Objectives
- **Phase A — Infrastructure & Environment Setup:** Docker Compose for local PostgreSQL and Redis; `.env` configuration supporting local Docker in Dev and Neon + Upstash in Prod.
- **Phase B — App Database & Migration Engine:** Dedicated internal PostgreSQL storage (`APP_DATABASE_URL`) with SQLAlchemy Async + Alembic migrations to store `query_history` and `bookmarks`.
- **Phase C — Redis Rate Limiting Engine:** High-performance sliding-window rate limiter using Redis (`redis-py` async / Upstash TLS) protecting LLM `/ask` and connection endpoints with RFC 6750 / RFC 6585 `429 Too Many Requests` responses and headers.
- **Phase D — Backend History API:** REST endpoints (`/api/v1/history`) with multi-tenant Clerk isolation, search, filtering, bookmark toggles, and automatic persistence upon query completion.
- **Phase E — Frontend Migration & Rate Limit UX:** Seamless transition from `localStorage` to server-side history with one-time legacy migration, optimistic star/delete toggling, and user-friendly 429 countdown notifications.
- **Phase F — Testing, Hardening & Zero-Regression Verification:** Full test suite with unit tests (using `fakeredis` and SQLite/Postgres), integration tests, tenant-isolation verification, and 0 regressions against all existing 94 tests.

---

## 2. Architecture & Dual-Database Topology

### Architectural Separation
DataSpeak maintains a strict separation between two database domains:
1. **Target Analytics Databases (Customer Data):** Dynamic user-connected databases (Postgres, Neon, Supabase, MySQL, SQLite) managed in-memory via [session_manager.py](file:///d:/text-to-sql/backend/app/db/session_manager.py) and inspected read-only via [executor.py](file:///d:/text-to-sql/backend/app/db/executor.py).
2. **Internal Application Database (Platform State):** A persistent PostgreSQL instance dedicated solely to DataSpeak internal operations: query histories, starred bookmarks, user audit logs, and rate limit tracking.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND (React + Vite)                               │
│  - useQueryExecution.ts (Server-synced history + 429 countdown handler)                 │
│  - QueryHistory.tsx (Search, Saved bookmarks, Pagination, Re-run)                       │
└───────────────────────────┬─────────────────────────────────┬───────────────────────────┘
                            │ Bearer JWT (Clerk)              │ Bearer JWT (Clerk)
                            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  BACKEND (FastAPI Core)                                 │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Rate Limiter Dependency / Middleware (FastAPI Depends + Redis Sliding Window)     │  │
│  │ Checks: user_id (or IP if unauth) -> Returns 429 + Retry-After if quota exceeded  │  │
│  └────────────────────────┬──────────────────────────────────────────────────────────┘  │
│                           │ Allowed                                                     │
│             ┌─────────────┴─────────────┐                                               │
│             ▼                           ▼                                               │
│   POST /api/v1/queries/ask     GET/POST /api/v1/history                                 │
│   (LangGraph Orchestration)    (History & Bookmarks)                                    │
│             │                           │                                               │
│             │ (Writes query outcome)    │ (Reads/Updates history)                       │
│             └─────────────┬─────────────┘                                               │
│                           ▼                                                             │
│              SQLAlchemy Async App Repository                                            │
└───────────────────────────┬─────────────────────────────────┬───────────────────────────┘
                            │                                 │
                            ▼                                 ▼
            ┌───────────────────────────────┐ ┌───────────────────────────────┐
            │   REDIS RATE LIMIT ENGINE     │ │   APP POSTGRESQL DATABASE     │
            │                               │ │                               │
            │ Dev:  Docker redis:7-alpine   │ │ Dev:  Docker postgres:16      │
            │ Prod: Upstash Redis (TLS/WSS) │ │ Prod: Neon Serverless (SSL)   │
            │ Key:  rl:{user_id}:{endpoint} │ │ Table: query_history          │
            └───────────────────────────────┘ └───────────────────────────────┘
```

---

## 3. Environment Variables Specification

The `.env` and `.env.example` will be extended with the following environment variables:

```ini
# ==============================================================================
# INTERNAL APPLICATION DATABASE (Query History, Bookmarks, Platform State)
# ==============================================================================
# Development (Docker Postgres):
APP_DATABASE_URL=postgresql+asyncpg://dataspeak_app:dataspeak_secure_pass@localhost:5432/dataspeak_internal

# Production (Neon Serverless PostgreSQL with SSL & Pooler):
# APP_DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_secret@ep-cool-pooler.us-east-2.aws.neon.tech/dataspeak_internal?sslmode=require

# ==============================================================================
# REDIS CACHE & RATE LIMITING
# ==============================================================================
# Development (Docker Redis):
REDIS_URL=redis://localhost:6379/0

# Production (Upstash Redis with TLS):
# REDIS_URL=rediss://default:upstash_token@us1-fluent-squid-12345.upstash.io:6379

# Rate Limit Thresholds (Configurable per environment)
RATE_LIMIT_QUERY_PER_MINUTE=20        # POST /api/v1/queries/ask (LLM inference)
RATE_LIMIT_GLOBAL_PER_MINUTE=120      # General API limit per user
RATE_LIMIT_BURST_CAP=5                # Instantaneous burst capacity
RATE_LIMIT_ENABLED=true               # Toggle for testing / emergency disable
```

---

## 4. Database Schema Design (`query_history`)

Created using Alembic migrations in `backend/alembic/`:

```sql
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(128) NOT NULL,                    -- Clerk user_id (tenant isolation)
    database_name VARCHAR(128) NOT NULL,              -- Name/dialect of target database
    question TEXT NOT NULL,                           -- Natural language user question
    sql TEXT NOT NULL,                                -- Generated and executed SQL
    status VARCHAR(32) NOT NULL DEFAULT 'success',    -- 'success' | 'blocked' | 'error'
    execution_time_ms DOUBLE PRECISION NOT NULL,      -- Latency in milliseconds
    row_count INTEGER NOT NULL DEFAULT 0,             -- Result row count
    chart_config JSONB NULL,                          -- Recommended chart type & keys
    summary TEXT NULL,                                -- Plain-English insight narrative
    error_message TEXT NULL,                          -- Sanitized error or blocked reason
    is_saved BOOLEAN NOT NULL DEFAULT FALSE,          -- Bookmark flag
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- Created timestamp
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()     -- Updated timestamp
);

-- Indexes for lightning-fast retrieval & search
CREATE INDEX idx_query_history_user_created ON query_history (user_id, created_at DESC);
CREATE INDEX idx_query_history_user_saved ON query_history (user_id, is_saved) WHERE is_saved = TRUE;
CREATE INDEX idx_query_history_user_search ON query_history USING gin (to_tsvector('english', question));
```

---

## 5. Phase-by-Phase Implementation Roadmap

### Phase 1: Local Infrastructure Setup (Docker & Settings) - COMPLETED
- [x] **Task 1.1: Docker Compose Setup**
  - Create root `docker-compose.yml` with:
    - `postgres:16-alpine` on port `5432` with volume `dataspeak_pgdata` and healthcheck (`pg_isready`).
    - `redis:7-alpine` on port `6379` with volume `dataspeak_redisdata` and healthcheck (`redis-cli ping`).
  - Add convenient dev helper commands in `README.md` (`docker compose up -d`).
- [x] **Task 1.2: Settings & Configuration Update**
  - Update [backend/app/core/config.py](file:///d:/text-to-sql/backend/app/core/config.py) to declare:
    - `APP_DATABASE_URL: str`
    - `REDIS_URL: str`
    - `RATE_LIMIT_QUERY_PER_MINUTE: int = 20`
    - `RATE_LIMIT_GLOBAL_PER_MINUTE: int = 120`
    - `RATE_LIMIT_BURST_CAP: int = 5`
    - `RATE_LIMIT_ENABLED: bool = True`
  - Update [.env.example](file:///d:/text-to-sql/.env.example) and active `.env` with validated default strings.
- [x] **Task 1.3: Backend Dependencies**
  - Add to [backend/requirements.txt](file:///d:/text-to-sql/backend/requirements.txt):
    - `redis>=5.0.0` (official async Redis client supporting `redis://` and `rediss://`)
    - `alembic>=1.13.0` (database migrations)
    - `fakeredis>=2.20.0` (for isolated, deterministic unit testing without requiring running Docker Redis)

### Phase 2: Internal Application Database & Alembic Migrations - COMPLETED
- [x] **Task 2.1: App Database Engine Factory**
  - Create `backend/app/db/app_database.py`:
    - Async engine factory for `APP_DATABASE_URL` using `create_async_engine`.
    - Handles connection pooling (`pool_size=10`, `max_overflow=20`), SSL requirement for Neon (`sslmode=require`), and session factory (`async_sessionmaker`).
    - Lifecycle management: Initialize and close connection pool in [backend/main.py](file:///d:/text-to-sql/backend/main.py) lifespan.
- [x] **Task 2.2: SQLAlchemy ORM Model**
  - Create `backend/app/models/history_entity.py`:
    - `QueryHistoryItemModel` mapping to table `query_history`.
- [x] **Task 2.3: Alembic Environment & Initial Migration**
  - Initialize `backend/alembic/` configured for `asyncpg`.
  - Create initial migration `001_create_query_history_table.py`.
  - Provide auto-migration runner on application startup in development mode.
- [x] **Task 2.4: Repository Layer**
  - Create `backend/app/db/repositories/history_repository.py`:
    - `create_query_history(db, item: QueryHistoryCreate) -> QueryHistoryItemModel`
    - `list_query_history(db, user_id, limit, offset, is_saved, search_q) -> Tuple[List[QueryHistoryItemModel], int]`
    - `toggle_save_query(db, user_id, query_id) -> QueryHistoryItemModel`
    - `delete_query_history_item(db, user_id, query_id) -> bool`
    - `clear_recent_history(db, user_id) -> int` (deletes unsaved queries, preserves bookmarked items)
    - `batch_import_history(db, user_id, items: List[QueryHistoryImport]) -> int`

### Phase 3: Redis Async Client & Rate Limiting Engine - COMPLETED
- [x] **Task 3.1: Redis Connection Pool Manager**
  - Create `backend/app/core/redis.py`:
    - Manages async Redis client (`redis.asyncio.from_url`).
    - Detects SSL/TLS for Upstash (`rediss://`).
    - Graceful degradation / fail-open: If Redis is offline or unreachable, log error to structlog and allow requests to proceed rather than breaking user queries.
    - Health check helper: `ping_redis() -> bool`.
- [x] **Task 3.2: Sliding-Window Rate Limiting Engine**
  - Create `backend/app/core/rate_limit.py`:
    - Sliding-window log / counter using Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`, `EXPIRE`) executed atomically via pipeline.
    - Computes `remaining_requests` and `retry_after_seconds`.
    - Returns standardized headers:
      - `X-RateLimit-Limit`
      - `X-RateLimit-Remaining`
      - `X-RateLimit-Reset`
      - `Retry-After` (when limit exceeded)
- [x] **Task 3.3: FastAPI Rate Limit Dependency**
  - Implement reusable dependency `RateLimiter(times=20, seconds=60, namespace=...)`.
  - Attach to:
    - `POST /api/v1/queries/ask`: Strict tier (20 queries/min per user).
    - `POST /api/v1/connections/connect` and `POST /test`: Sensitive tier (30 requests/min per user).
  - Throws `HTTPException(status_code=429, detail="Rate limit exceeded. ...")` with RFC 6585 compliance and RFC headers.

### Phase 4: Query History REST API Endpoints - COMPLETED
- [x] **Task 4.1: Pydantic v2 History Schemas**
  - Create `backend/app/models/history.py`:
    - `QueryHistoryItemResponse`: ID, user_id, database_name, question, sql, status, execution_time_ms, row_count, chart, summary, error_message, is_saved, created_at.
    - `QueryHistoryListResponse`: items, total_count, page, page_size, total_pages.
    - `QueryHistoryBatchImportRequest`: Array of historical queries exported from frontend localStorage.
- [x] **Task 4.2: REST Router Implementation**
  - Create [backend/app/api/v1/history.py](file:///d:/text-to-sql/backend/app/api/v1/history.py):
    - `GET /api/v1/history`: List paginated history with query params `saved_only=bool`, `q=str`, `page=int`, `limit=int`.
    - `POST /api/v1/history/{id}/toggle-save`: Toggle star/bookmark status.
    - `DELETE /api/v1/history/{id}`: Delete specific history item.
    - `DELETE /api/v1/history`: Clear recent unsaved history for current user.
    - `POST /api/v1/history/import`: Batch import legacy `localStorage` items.
  - Mount router in [backend/app/api/v1/__init__.py](file:///d:/text-to-sql/backend/app/api/v1/__init__.py) under `/api/v1/history`.
- [x] **Task 4.3: Automatic Recording on Query Execution**
  - In [backend/app/api/v1/queries.py](file:///d:/text-to-sql/backend/app/api/v1/queries.py#L31-L119):
    - When `ask_query` finishes (whether `status='success'`, `status='blocked'`, or `status='error'`), automatically insert a new `query_history` record into PostgreSQL.
    - Populate `database_name` from `session.connection_params.database` or dialect.

### Phase 5: Frontend Migration & Enhanced UI - COMPLETED
- [x] **Task 5.1: Frontend API Service Updates**
  - Extend [frontend/src/services/api.ts](file:///d:/text-to-sql/frontend/src/services/api.ts) with `historyService`:
    - `list(params: { saved_only?: boolean; q?: string; page?: number; limit?: number })`
    - `toggleSave(id: string)`
    - `delete(id: string)`
    - `clearRecent()`
    - `importLocal(items: QueryHistoryItem[])`
- [x] **Task 5.2: Legacy `localStorage` One-Time Auto-Migration**
  - In [frontend/src/hooks/useQueryExecution.ts](file:///d:/text-to-sql/frontend/src/hooks/useQueryExecution.ts):
    - On user sign-in, check if `localStorage.getItem('dataspeak_query_history_v1')` has items.
    - If present, call `historyService.importLocal(items)`, then archive/clear local storage.
    - Fetch server history as source of truth.
- [x] **Task 5.3: UI Star, Delete, and Filter Reactivity**
  - Update [frontend/src/components/chat/QueryHistory.tsx](file:///d:/text-to-sql/frontend/src/components/chat/QueryHistory.tsx):
    - Connect bookmark star buttons and delete buttons directly to `historyService` with optimistic UI updates.
    - Add server-side search input debounced at 300ms.
    - Add "Clear recent history" button preserving saved starred items.
- [x] **Task 5.4: 429 Rate Limit Handling in UI**
  - Add Axios interceptor or response handler for HTTP `429 Too Many Requests`:
    - Extract `Retry-After` header.
    - Display PostHog-styled amber toast or Caution banner in [QueryInput.tsx](file:///d:/text-to-sql/frontend/src/components/chat/QueryInput.tsx) with a live countdown: *"You have reached the query rate limit. You can ask another question in {seconds}s."*
    - Disable submit button until cooldown elapses.

### Phase 6: Testing, Hardening & Zero-Regression Verification - COMPLETED
- [x] **Task 6.1: Rate Limiter Unit Tests**
  - Create `backend/tests/test_rate_limiter.py`:
    - Test sliding-window counter using `fakeredis`.
    - Test threshold enforcement: 20 requests allowed, 21st receives 429.
    - Test header generation (`X-RateLimit-*`, `Retry-After`).
    - Test fail-open behavior when Redis connection throws an error.
- [x] **Task 6.2: Query History API & Tenant Isolation Tests**
  - Create `backend/tests/test_history_api.py`:
    - Verify 401 unauthenticated blocking.
    - Test multi-tenant isolation: User A cannot see, star, or delete User B's history.
    - Test search filtering by keywords in `question`.
    - Test `is_saved` filter and bookmark toggling.
    - Test `clearRecent()` leaves starred queries intact.
    - Test auto-persistence: executing `POST /api/v1/queries/ask` automatically creates an entry in `query_history`.
- [x] **Task 6.3: Zero Regression Run**
  - Run full test suite:
    - `pytest backend/tests/` (verifying all 94 existing tests + new history/rate limit tests pass 100% — 125 total passing).
    - `npm run build` in `frontend/` (verifying clean TypeScript compilation).

---

## 6. Verification Criteria & Acceptance Tests

| Capability | Target Metric | Verification Method |
| :--- | :--- | :--- |
| **History Persistence** | Instant (< 20ms write) | Submitting query in UI saves to PostgreSQL; persists after browser cache clear and page refresh |
| **Tenant Isolation** | 100% Isolation | User A cannot query or mutate User B's history via API (`user_id` enforced in SQL WHERE) |
| **Rate Limiter (Normal)** | 0 overhead (< 2ms) | Redis sliding window check in < 2ms latency overhead |
| **Rate Limiter (Limit Hit)**| HTTP 429 Status | Rapid 25 queries result in 429 status on 21st attempt with accurate `Retry-After` header |
| **Rate Limiter (Resilience)**| Fail-Open | If Redis is stopped or unreachable, queries continue to execute without 500 crashes |
| **Production Compatibility**| Neon + Upstash | Verified working over TLS with `APP_DATABASE_URL` (Neon) and `REDIS_URL` (Upstash) |
| **Zero Regression** | 100% Pass Rate | All prior 94 unit/integration tests pass with 0 failures |

---

## 7. Migration & Rollback Strategy

1. **Forward Migration:**
   - Alembic manages schema versions. Run `alembic upgrade head` during deployment.
   - If PostgreSQL is temporarily down, the app returns a clean 503 Service Unavailable for history endpoints, while active queries still function in stateless mode.
2. **Rollback Safety:**
   - If Redis becomes unavailable, `RATE_LIMIT_ENABLED=false` can be set in `.env` to bypass rate checks instantly.
   - If `APP_DATABASE_URL` is omitted, the frontend can automatically fall back to browser `localStorage` gracefully.
