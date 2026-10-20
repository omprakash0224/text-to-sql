# DataSpeak 💬📊

> AI-Powered Text-to-SQL Platform with Absolute Read-Only Guardrails and Interactive Visualizations.

DataSpeak empowers operations managers, product managers, and business analysts to query relational databases safely in plain English, receiving instant answers with interactive data tables, automated visual charts, and plain-English narrative summaries.

---

## 🛠 Local Infrastructure (Docker)

DataSpeak uses PostgreSQL for platform state (server-side query history & bookmarks) and Redis for sub-millisecond sliding-window rate limiting.

### Start Local Postgres & Redis
```bash
# Launch background Postgres 16 and Redis 7 Alpine containers
docker compose up -d

# Check health of containers
docker compose ps

# View container logs
docker compose logs -f

# Stop containers
docker compose down
```

### Services & Ports
| Service | Image | Local Port | Credentials / Defaults |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `postgres:16-alpine` | `5432` | `dataspeak_app` / `dataspeak_secure_pass` / `dataspeak_internal` |
| **Redis** | `redis:7-alpine` | `6379` | `redis://localhost:6379/0` (In-memory, persistent volume) |

---

## 🚀 Development Setup

### 1. Backend (FastAPI + Python 3.11+)
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run backend development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend (React 19 + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
- Application UI: `http://localhost:5173`

---

## 🧪 Testing & Verification

Run the comprehensive test suite (AST guardrails, Clerk JWT auth, schema inspection, agent self-correction loop, rate limiter config):
```bash
backend\venv\Scripts\pytest.exe backend\tests/
```

Verify frontend TypeScript compilation:
```bash
cd frontend
npm run build
```
