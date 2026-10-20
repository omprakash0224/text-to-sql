# ==============================================================================
# DataSpeak Backend — Multi-Stage Production Dockerfile
# Optimized for Google Cloud Run, Render Docker Web Service, or AWS ECS
# ==============================================================================

# ── Stage 1: Build & Dependencies ─────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── Stage 2: Runtime Environment ──────────────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application source code
COPY . /app

# Ensure entrypoint script is executable
RUN chmod +x /app/entrypoint.sh

# Default environment port (Google Cloud Run injects PORT=8080, Render injects PORT=10000)
ENV PORT=8000
EXPOSE $PORT

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start via entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
