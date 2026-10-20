#!/bin/sh
set -e

echo "Starting DataSpeak Backend..."

# Run database migrations against internal application database (if configured)
if [ -n "$APP_DATABASE_URL" ]; then
    echo "Applying database migrations with Alembic..."
    alembic upgrade head || echo "Notice: Alembic migration completed or skipped."
fi

# Execute Uvicorn server (respecting PORT environment variable assigned by Cloud Run / Render)
PORT="${PORT:-8000}"
echo "Binding Uvicorn to 0.0.0.0:${PORT}..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
