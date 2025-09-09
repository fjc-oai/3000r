# app.py
import os
import pathlib
from datetime import date, datetime
from typing import List, Literal

import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.responses import FileResponse

app = FastAPI(title="3000r backend")

# --- CORS ---
# Support multiple local dev origins by default; override with FRONTEND_ORIGINS or FRONTEND_ORIGIN
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
if FRONTEND_ORIGINS:
    ALLOW_ORIGINS = [o.strip() for o in FRONTEND_ORIGINS.split(",") if o.strip()]
elif FRONTEND_ORIGIN:
    ALLOW_ORIGINS = [FRONTEND_ORIGIN]
else:
    ALLOW_ORIGINS = DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB engine: SQLite (default) or Postgres via DATABASE_URL ---

#
DB_MODE: Literal["local", "remote"] = "remote"
if DB_MODE == "remote":
    # Found this from https://console.neon.tech/app/projects/mute-mud-01593984?database=neondb&branchId=br-winter-king-af7p2cux
    DATABASE_URL = "postgresql+psycopg://neondb_owner:npg_9cQhAmEBiZu3@ep-nameless-tree-afsairo6-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    engine = sa.create_engine(
        DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=5
    )
    print(f"Connected to {DATABASE_URL}")
    """
    Test NeonDB locally

    export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:5432/DB?sslmode=require'
    # still allow your React dev origin locally
    export FRONTEND_ORIGIN='http://localhost:5173'
    uvicorn app:app --reload --port 8000
    # test (creates table in Neon automatically)
    curl -s http://localhost:8000/healthz
    curl -sX POST http://localhost:8000/sessions -H 'content-type: application/json' -d '{"date":"2025-09-04","duration":45}'
    curl -s http://localhost:8000/sessions
    """
else:
    engine = sa.create_engine(
        "sqlite:///./app.db", connect_args={"check_same_thread": False}
    )

# --- Schema ---
metadata = sa.MetaData()
sessions = sa.Table(
    "sessions",
    metadata,
    sa.Column("date", sa.Date, nullable=False),
    sa.Column("duration", sa.Integer, nullable=False),
)
metadata.create_all(engine)  # CREATE TABLE IF NOT EXISTS


class Session(BaseModel):
    date: date
    duration: int = Field(gt=0, le=1440)


@app.post("/api/sessions", response_model=Session)
def add_session(s: Session):
    print(f"Adding session: {s}")
    with engine.begin() as conn:
        conn.execute(sa.insert(sessions).values(date=s.date, duration=s.duration))
    return s


@app.get("/api/sessions", response_model=List[Session])
def list_sessions():
    with engine.begin() as conn:
        rows = conn.execute(
            sa.select(sessions.c.date, sessions.c.duration).order_by(
                sessions.c.date.desc()
            )
        ).all()
    return [{"date": r.date, "duration": r.duration} for r in rows]


@app.get("/api/healthz")
def healthz():
    return {"ok": True, "time": datetime.utcnow().isoformat()}


dist_dir = pathlib.Path(__file__).parent / "frontend" / "dist"
app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")


# (Optional) explicit SPA fallback for unknown routes:
@app.exception_handler(404)
async def spa_fallback(request, exc):
    # If it's an API path, keep 404; else serve index.html
    if request.url.path.startswith("/api/"):
        return (
            FileResponse(dist_dir / "404.html")
            if (dist_dir / "404.html").exists()
            else FileResponse(dist_dir / "index.html", status_code=404)
        )
    return FileResponse(dist_dir / "index.html")
