# DataSpeak — Production Deployment & Infrastructure Guide

Comprehensive, step-by-step production deployment guide for the **DataSpeak** natural language Text-to-SQL platform.

---

## 1. Executive Summary & Architecture Topology

DataSpeak follows a decoupled, cloud-native architecture optimized for sub-second latency, zero database mutation risk, and cost-effective scaling:

- **Frontend:** [Vercel](https://vercel.com/) (Global Edge CDN, React 19 + Vite SPA, automatic TLS, zero-maintenance CI/CD)
- **Backend:** [Render](https://render.com/) or [Google Cloud Run](https://cloud.google.com/run) (Asynchronous FastAPI server, LangGraph agent, sqlglot AST guardrails)
- **Internal Database:** [Neon Serverless PostgreSQL](https://neon.tech/) (Pooled connection via PgBouncer on port 6543, stores query history, bookmarks, and platform state)
- **Rate Limiting & Cache:** [Upstash Redis](https://upstash.com/) (Serverless Redis with TLS `rediss://`, powers sliding-window rate limiting)
- **Authentication:** [Clerk](https://clerk.com/) (Stateless RS256 JWT verification via JWKS)
- **LLM Inference:** [Groq](https://groq.com/) (Primary: `qwen/qwen3.8-27b`) & [OpenRouter](https://openrouter.ai/) (Fallback: `minimax/minimax-m3.1-flash:free`)

```
                                  ┌───────────────────────────┐
                                  │      Client Browser       │
                                  └─────────────┬─────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │ HTTPS / Vite SPA                                    │ Clerk Session & Bearer JWT
                     ▼                                                     ▼
      ┌─────────────────────────────┐                       ┌─────────────────────────────┐
      │       Vercel Edge CDN       │                       │       Clerk Auth SaaS       │
      │   (React 19 + Tailwind v4)  │                       │   (JWKS / RS256 Tokens)     │
      └──────────────┬──────────────┘                       └──────────────┬──────────────┘
                     │                                                     │
                     │ Bearer JWT + REST API Requests                      │ JWKS Public Key
                     ▼                                                     ▼ Verification
      ┌───────────────────────────────────────────────────────────────────────────────────┐
      │                        FastAPI Backend Application Core                           │
      │              (Hosted on Render Web Service OR Google Cloud Run)                   │
      │                                                                                   │
      │  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  │
      │  │ Clerk Bearer Verifier │  │ Redis Sliding Limiter │  │ sqlglot AST Guardrail │  │
      │  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘  │
      │  ┌─────────────────────────────────────────────────────────────────────────────┐  │
      │  │               LangGraph Multi-Step Agent & Self-Correction Loop             │  │
      │  └─────────────────────────────────────────────────────────────────────────────┘  │
      └──────────────┬──────────────────────────┬──────────────────────────┬──────────────┘
                     │                          │                          │
          Asyncpg    │               Rediss     │                 Fast     │ Fallback
          SSL:6543   │               TLS        │                 API      │ HTTP
                     ▼                          ▼                          ▼
      ┌─────────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────────┐
      │       Neon PostgreSQL       │ │   Upstash Redis   │ │    Groq / OpenRouter LLMs   │
      │ (App State & Query History) │ │  (Rate Limiting)  │ │   (Text-to-SQL & Insights)  │
      └─────────────────────────────┘ └───────────────────┘ └─────────────────────────────┘
                     │
                     │ Read-Only Transaction Connections (sslmode=require)
                     ▼
      ┌───────────────────────────────────────────────────────────────────────────────────┐
      │                        Customer Connected Relational Databases                    │
      │            PostgreSQL (RDS / Supabase / Neon)  •  MySQL  •  SQLite Demo            │
      └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Prerequisites Setup

Before deploying the frontend or backend, provision the third-party infrastructure components.

### 2.1 Neon Serverless PostgreSQL (Internal App DB)

Neon provides serverless PostgreSQL for DataSpeak's internal platform state (`query_history`, bookmarks, indexes).

1. Sign up or log in to [Neon Console](https://console.neon.tech/).
2. Click **Create Project** -> Name: `dataspeak-production`.
3. In your database dashboard, locate the **Connection Details**:
   - Ensure the **Pooled connection** checkbox is checked (uses port `6543` and PgBouncer).
   - Select connection string format as **SQLAlchemy** or **Postgres**.
4. Format the async connection string required by DataSpeak:
   ```ini
   APP_DATABASE_URL=postgresql+asyncpg://neondb_owner:YOUR_NEON_PASSWORD@ep-cool-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > [!IMPORTANT]
   > The prefix must be `postgresql+asyncpg://`. DataSpeak automatically disables client-side statement caching (`statement_cache_size=0`) to ensure 100% compatibility with Neon's PgBouncer pooler.

### 2.2 Upstash Redis (Sliding Window Rate Limiter)

Upstash delivers serverless, zero-maintenance Redis with per-request pricing.

1. Sign up or log in to [Upstash Console](https://console.upstash.com/).
2. Click **Create Database** -> Name: `dataspeak-ratelimit` -> Select region closest to your backend (e.g., US-East / EU-Central).
3. Under the **Details** tab, locate the **Node / Redis Connect URL**.
4. Format the secure Redis URL:
   ```ini
   REDIS_URL=rediss://default:YOUR_UPSTASH_TOKEN@us1-fluent-squid-12345.upstash.io:6379
   ```
   > [!NOTE]
   > Ensure the protocol is `rediss://` (with double 's' for TLS encryption).

### 2.3 Clerk Authentication (Production Instance)

1. Sign up or log in to [Clerk Dashboard](https://dashboard.clerk.com/).
2. Create an application (or configure your existing application for production).
3. Navigate to **API Keys**:
   - Copy **Publishable Key** (e.g., `pk_live_...` or `pk_test_...`) -> for Frontend.
   - Copy **Secret Key** (e.g., `sk_live_...` or `sk_test_...`) -> for Backend.
4. Navigate to **JWT Templates / Issuer**:
   - Note your Clerk Issuer URL (e.g., `https://clerk.yourdomain.com` or `https://viable-donkey-12.clerk.accounts.dev`).
   - The JWKS endpoint is: `https://<YOUR_CLERK_ISSUER>/.well-known/jwks.json`.

### 2.4 Groq & OpenRouter LLM Keys

1. **Groq (Primary LLM):**
   - Log in to [Groq Console](https://console.groq.com/keys).
   - Generate an API key (`gsk_...`).
   - Recommended Production Model: `qwen/qwen3.8-27b` (ultra-low latency ~20ms, reliable SQL AST syntax).
2. **OpenRouter (Fallback LLM):**
   - Log in to [OpenRouter Keys](https://openrouter.ai/keys).
   - Generate an API key (`sk-or-...`).
   - Recommended Model: `minimax/minimax-m3.1-flash:free` or `qwen/qwen-2.5-coder-32b-instruct`.

---

## 3. Backend Deployment: Step-by-Step Plans

Choose between **Render** (easiest, zero-DevOps) and **Google Cloud Run** (enterprise auto-scaling, scale-to-zero, global Google infrastructure).

---

### Option A: Deploying to Render (Recommended for Simplicity)

Render is a unified cloud platform supporting native Python environments, automated Git deployments, and free SSL certificates.

#### Step 1: Create a Render Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`text-to-sql`).

#### Step 2: Configure Service Settings
| Field | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `dataspeak-backend` | Will yield `https://dataspeak-backend.onrender.com` |
| **Region** | Oregon (US West) or Ohio (US East) | Match region closest to Neon / Upstash |
| **Branch** | `main` | Production branch |
| **Root Directory** | `backend` | Isolates backend directory |
| **Runtime** | `Python 3` (or `Docker`) | Uses native Python or the repository's `backend/Dockerfile` |
| **Build Command** | `pip install -r requirements.txt && alembic upgrade head` | Installs dependencies and runs DB migrations |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` | Binds to dynamic port injected by Render |
| **Instance Type** | Free ($0) or Starter ($7/mo) | Starter is recommended for production (no spin-down) |

#### Step 3: Configure Environment Variables
Under the **Environment** tab, add the following key-value pairs:

```ini
ENVIRONMENT=production
LOG_LEVEL=info
BACKEND_HOST=0.0.0.0

# CORS: Add your Vercel domain (and localhost for testing)
CORS_ORIGINS=https://dataspeak.vercel.app,https://your-custom-domain.com

# Clerk Auth
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
CLERK_ISSUER=https://your-instance.clerk.accounts.dev
CLERK_JWKS_URL=https://your-instance.clerk.accounts.dev/.well-known/jwks.json

# LLM Providers
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key
OPENROUTER_MODEL=minimax/minimax-m3.1-flash:free

# Neon PostgreSQL Database
APP_DATABASE_URL=postgresql+asyncpg://neondb_owner:PASSWORD@ep-cool-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Upstash Redis
REDIS_URL=rediss://default:TOKEN@us1-fluent-squid-12345.upstash.io:6379

# Rate Limiting & Safety
RATE_LIMIT_QUERY_PER_MINUTE=20
RATE_LIMIT_GLOBAL_PER_MINUTE=120
RATE_LIMIT_BURST_CAP=5
RATE_LIMIT_ENABLED=true
DEFAULT_QUERY_ROW_LIMIT=100
MAX_QUERY_TIMEOUT_SECONDS=10
```

#### Step 4: Health Check Path
- Set **Health Check Path** to `/health`.
- Render pings `/health` periodically to ensure zero downtime during zero-downtime rolling deploys.

#### Step 5: Trigger Deploy & Verify
- Click **Create Web Service**.
- Monitor the deployment log. Render will execute `pip install`, apply Alembic migrations (`001_create_query_history_table`), and start Uvicorn.
- Once live, verify by opening `https://dataspeak-backend.onrender.com/health` in your browser. You should receive:
  ```json
  {"status":"healthy","version":"1.0.0","uptime_seconds":12.4}
  ```

---

### Option B: Deploying to Google Cloud Run (Recommended for Scale & Cost)

Google Cloud Run is a fully managed, serverless container platform that automatically scales from zero to thousands of instances in seconds.

#### Step 1: Install & Authenticate Google Cloud SDK
```bash
# Authenticate gcloud CLI
gcloud auth login

# Set active Google Cloud project
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com
```

#### Step 2: Create Artifact Registry Docker Repository
```bash
gcloud artifacts repositories create dataspeak-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="DataSpeak container repository"
```

#### Step 3: Build & Submit the Container Image
The repository includes a production multi-stage [backend/Dockerfile](file:///d:/text-to-sql/backend/Dockerfile) with an automated migration entrypoint:

```bash
# Build and push directly from the backend directory using Cloud Build
gcloud builds submit backend \
    --tag us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/dataspeak-repo/backend:latest
```

#### Step 4: Deploy Container to Google Cloud Run
```bash
gcloud run deploy dataspeak-backend \
    --image us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/dataspeak-repo/backend:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8000 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --timeout 60s \
    --set-env-vars "ENVIRONMENT=production,LOG_LEVEL=info,GROQ_MODEL=qwen/qwen3.8-27b,OPENROUTER_MODEL=minimax/minimax-m3.1-flash:free,RATE_LIMIT_QUERY_PER_MINUTE=20,RATE_LIMIT_GLOBAL_PER_MINUTE=120,RATE_LIMIT_BURST_CAP=5,RATE_LIMIT_ENABLED=true,DEFAULT_QUERY_ROW_LIMIT=100,MAX_QUERY_TIMEOUT_SECONDS=10,CORS_ORIGINS=https://dataspeak.vercel.app" \
    --set-env-vars "CLERK_ISSUER=https://your-instance.clerk.accounts.dev,CLERK_JWKS_URL=https://your-instance.clerk.accounts.dev/.well-known/jwks.json" \
    --set-env-vars "APP_DATABASE_URL=postgresql+asyncpg://neondb_owner:PASSWORD@ep-cool-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require" \
    --set-env-vars "REDIS_URL=rediss://default:TOKEN@us1-fluent-squid-12345.upstash.io:6379" \
    --set-env-vars "CLERK_SECRET_KEY=sk_live_your_key,GROQ_API_KEY=gsk_your_key,OPENROUTER_API_KEY=sk-or-your_key"
```

> [!TIP]
> For production environments, sensitive keys (`CLERK_SECRET_KEY`, `GROQ_API_KEY`, `APP_DATABASE_URL`) can be stored in **Google Secret Manager** and bound via `--set-secrets`.

#### Step 5: Retrieve Service URL & Verify
Once completed, Google Cloud Run outputs your secure HTTPS service URL:
```
Service URL: https://dataspeak-backend-xyz123-uc.a.run.app
```
Test health endpoint:
```bash
curl https://dataspeak-backend-xyz123-uc.a.run.app/health
```

---

## 4. Frontend Deployment: Step-by-Step on Vercel

Vercel provides edge delivery for the React 19 + Vite frontend.

### Step 1: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Connect your Git provider and select the `text-to-sql` repository.

### Step 2: Configure Project Build Settings
Configure the build parameters in the Vercel setup screen:
- **Framework Preset:** `Vite`
- **Root Directory:** Click **Edit** and choose `frontend`
- **Build Command:** `npm run build` (runs `tsc -b && vite build`)
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Configure Environment Variables
Under **Environment Variables**, add the production keys:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://dataspeak-backend.onrender.com` (or Cloud Run URL) | Target FastAPI backend gateway |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_your_clerk_publishable_key` | Public authentication key |
| `VITE_APP_ENV` | `production` | Deployment environment tag |

> [!IMPORTANT]
> Do NOT append a trailing slash to `VITE_API_BASE_URL`.

### Step 4: Verify SPA Routing Configuration
The frontend directory includes [frontend/vercel.json](file:///d:/text-to-sql/frontend/vercel.json):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This rewrite guarantees client-side routing works on full page refreshes without returning 404 errors.

### Step 5: Deploy & Custom Domain
1. Click **Deploy**. Vercel will bundle the Tailwind CSS v4 styles, compile TypeScript, and publish to the global edge network.
2. Under **Project Settings** -> **Domains**, bind your custom domain (e.g., `app.dataspeak.ai`) and follow Vercel's DNS instructions for CNAME/A records.

---

## 5. Post-Deployment Wiring & Security Handshake

Once both the frontend and backend are live, update cross-origin and authentication configurations:

### 5.1 Update Backend CORS Origins
In your Render or Google Cloud Run environment variables, update `CORS_ORIGINS` to include your live Vercel domain:
```ini
CORS_ORIGINS=https://dataspeak.vercel.app,https://app.dataspeak.ai
```
Restart or re-deploy the backend service so the CORS middleware allows incoming browser requests.

### 5.2 Update Clerk Allowed Origins & Redirects
In [Clerk Dashboard](https://dashboard.clerk.com/):
1. Navigate to **Configure** -> **Domains / Paths**.
2. Under **Allowed Origins**, add:
   - `https://dataspeak.vercel.app`
   - `https://app.dataspeak.ai`
3. Under **Redirect URLs**, add your domain to ensure OAuth/Magic Link callbacks redirect seamlessly.

---

## 6. Comprehensive Cost Analysis

DataSpeak is architected with serverless components that support both a **$0/month free tier** for indie developers and a predictable, low-cost **production tier**.

### Tier 1: Free / Hobby Tier ($0.00 / month)

Ideal for portfolio showcase, staging, client demos, and evaluation:

| Service | Component | Free Tier Quota | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Vercel** | Frontend Edge Hosting | 100 GB bandwidth, unlimited deployments, custom domain + SSL | **$0.00** |
| **Render** | Backend Web Service | 512 MB RAM, 0.1 CPU, 750 free hours/month *(spins down after 15m idle)* | **$0.00** |
| **Google Cloud Run** *(Alternative)* | Serverless Backend | 2,000,000 requests/mo, 360,000 vCPU-seconds, 180,000 GiB-seconds free | **$0.00** |
| **Neon PostgreSQL** | Internal App Database | 0.5 GiB storage, serverless compute with scale-to-zero | **$0.00** |
| **Upstash Redis** | Sliding Rate Limiter | 10,000 requests/day, 256 MB storage | **$0.00** |
| **Clerk Auth** | User Authentication | 10,000 Monthly Active Users (MAU), unlimited logins | **$0.00** |
| **Groq Cloud** | Primary Fast LLM | Free tier rate limits (~30 RPM, 14,400 RPD on open models) | **$0.00** |
| **OpenRouter** | Fallback LLM | Free tier models available (e.g. `minimax-m3.1-flash:free`) | **$0.00** |
| **TOTAL** | **Full Stack System** | **Ready for live evaluation and moderate daily use** | **$0.00 / mo** |

---

### Tier 2: Startup / Production Tier (~$7.00 – $27.00 / month)

Eliminates cold starts, enables always-on availability, and supports production SLAs:

| Service | Plan / Resource | Pricing Rationale | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **Vercel** | Hobby / Pro | Hobby is $0; Pro ($20/mo) is only needed for team seats | $0.00 – $20.00 |
| **Render** | Starter Web Service | **$7.00/mo:** 512 MB RAM, 0.5 vCPU, **Always-on** (zero cold starts) | $7.00 |
| **Google Cloud Run** *(Alternative)* | Pay-per-use + Min Instance | Scale-to-zero is ~$2–$5/mo; `min-instances=1` always-on is ~$8–$12/mo | ($3.00 – $12.00) |
| **Neon PostgreSQL** | Free Tier or Launch ($19) | Free tier supports up to 0.5 GB (millions of query history rows) | $0.00 – $19.00 |
| **Upstash Redis** | Pay-as-you-go | $0.20 per 100,000 commands (typically ~$0.50–$1.50/mo) | $0.50 – $2.00 |
| **Clerk Auth** | Standard | Free up to 10,000 MAU; $0.02/user above threshold | $0.00 |
| **Groq / OpenRouter** | Production Inference | ~$0.10 per 1M tokens with Groq (~$3.00–$5.00 for 50,000 queries) | $3.00 – $5.00 |
| **ESTIMATED TOTAL** | **Render + Vercel + Neon** | **Always-on production infrastructure with zero cold starts** | **~$10.50 – $27.00 / mo** |

---

### Render vs. Google Cloud Run: Architectural Decision Matrix

| Dimension | Render Web Service | Google Cloud Run | Recommendation |
| :--- | :--- | :--- | :--- |
| **Setup Complexity** | Low (Connect GitHub, 3 clicks) | Medium (GCP project, IAM, gcloud CLI) | Render for speed; Cloud Run for engineering control |
| **Cold Starts (Free Tier)** | High (~45–60s after 15m idle) | Fast (~2–4s container initialization) | Cloud Run handles cold starts better |
| **Always-On Base Cost** | **$7.00 / month flat** | ~$8.00–$12.00 / month (`min-instances=1`) | Render is more predictable |
| **Auto-scaling Model** | Vertical & horizontal based on rules | Automatic sub-second scale from 0 to N | Cloud Run for spiky traffic |
| **Concurrency** | Single container process | Up to 80 concurrent HTTP requests per instance | Cloud Run is more efficient per dollar |
| **Containerization** | Native Python OR Docker | Docker Container standard | Equal |

**Recommendation:**
- If you want the **fastest, simplest deployment** with zero cloud infrastructure complexity: Choose **Render Starter ($7/mo)**.
- If you want **true scale-to-zero with fast wakeup**, high request concurrency, and enterprise VPC integration: Choose **Google Cloud Run**.

---

## 7. End-to-End Verification & Smoke Test Checklist

Once deployment completes, execute this sequential verification checklist:

- [ ] **1. Public Health Check:**
  - Visit `https://YOUR_BACKEND_URL/health`
  - Expected: `200 OK` with JSON `{"status": "healthy", "version": "1.0.0"}`.
- [ ] **2. Frontend Loading & SSL:**
  - Visit `https://YOUR_VERCEL_DOMAIN`
  - Verify PostHog cream canvas, hedgehog mascot, and navigation bar render cleanly with valid HTTPS padlock.
- [ ] **3. Clerk Authentication Gate:**
  - Click **Sign In** -> Authenticate with your Clerk account.
  - Inspect Network tab: Verify `GET /api/v1/auth/me` responds with HTTP `200` and returns your `user_id` and profile details.
- [ ] **4. Built-in Demo Database:**
  - Click **Demo SQLite Database** in the database switcher or hero deck.
  - Verify schema reflection loads 6 tables (`orders`, `products`, `customers`, etc.) in < 2 seconds.
  - Submit a test query: *"Show total record counts across all categories"*.
  - Verify:
    - 5-step progress stepper transitions smoothly.
    - SQL is displayed in PostHog dark preview island.
    - ChartViewer renders an interactive Recharts chart.
    - DataTable displays rows with tabular numbers and pagination.
    - InsightCard shows plain-English executive summary.
- [ ] **5. AST Guardrail Security Defense:**
  - Submit an injection query: *"DROP TABLE customers;"* or *"UPDATE orders SET total_amount = 0;"*.
  - Verify:
    - Status transitions immediately to `blocked`.
    - BlockedNotice banner appears with red left rail: *"Query blocked by security guardrails. Nothing was run. Your database is completely unchanged."*
    - Zero SQL execution attempts reached the database engine.
- [ ] **6. Sliding Window Rate Limiting:**
  - Send rapid questions (exceeding 20/min).
  - Verify backend returns HTTP `429 Too Many Requests` with `Retry-After` header.
  - Verify frontend renders the amber Caution banner with a live countdown: *"Query rate limit reached: You can ask another question in Xs."*
- [ ] **7. Persistent Server-Side Query History:**
  - Check the sidebar **Query History** section.
  - Verify queries are stored in the Neon database (`query_history` table) with timestamps and execution latencies.
  - Click the **Star icon** to bookmark a query. Refresh the browser page (`F5`) and confirm bookmark persistence.
- [ ] **8. CSV Export Formula Sanitization:**
  - Click **Export CSV** on any result table.
  - Verify download completes and inspect file: cells starting with `=`, `+`, `-`, or `@` are safely quoted to prevent spreadsheet formula injection.

---

## 8. Operational Troubleshooting & Pitfalls

### Issue 1: CORS Error in Browser Console (`Access-Control-Allow-Origin`)
- **Cause:** Backend `CORS_ORIGINS` does not match the frontend domain requesting the API.
- **Fix:** In Render or Cloud Run environment settings, ensure `CORS_ORIGINS` has the exact Vercel protocol and domain:
  ```ini
  CORS_ORIGINS=https://dataspeak.vercel.app,https://your-custom-domain.com
  ```
  *(No trailing slashes).*

### Issue 2: Render Free Tier Cold Start Delay
- **Cause:** Render free tier spins down instances after 15 minutes of inactivity. The first request takes 45–60 seconds to boot.
- **Fix:** Upgrade the Render Web Service to the **Starter Plan ($7/mo)** to keep the instance always warm, or use an external uptime monitor (e.g., UptimeRobot, Better Uptime) to ping `/health` every 10 minutes.

### Issue 3: Neon / PgBouncer `prepared statement already exists` Crash
- **Cause:** Using standard `asyncpg` with a pooled connection (port `6543`) can cause prepared statement name collisions across pooled connections.
- **Fix:** DataSpeak's internal factory [app_database.py](file:///d:/text-to-sql/backend/app/db/app_database.py) automatically disables statement caching when detecting `neon.tech` or `supabase.co` domains. Ensure your `APP_DATABASE_URL` contains `ep-***-pooler` and `sslmode=require`.

### Issue 4: Upstash Redis SSL Certificate Failure
- **Cause:** Configuring `redis://` instead of `rediss://` prevents TLS negotiation.
- **Fix:** Always ensure the Redis connection string begins with `rediss://` for Upstash.

### Issue 5: Page Refresh Returns 404 on Vercel
- **Cause:** Vercel tries to match client-side routes to physical files on disk.
- **Fix:** Ensure [frontend/vercel.json](file:///d:/text-to-sql/frontend/vercel.json) is present with the `rewrites` block mapping `/(.*)` to `/index.html`.

### Issue 6: Clerk JWT Verification 401 Unauthorized
- **Cause:** `CLERK_ISSUER` does not match the `iss` claim in the client token.
- **Fix:** In backend environment variables, verify that `CLERK_ISSUER` exactly matches your Clerk Frontend API URL (found under **Clerk Dashboard -> API Keys -> Advanced -> JWT Templates**).
