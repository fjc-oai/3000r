# app.py
import os
from datetime import date, datetime
from typing import List, Literal

import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="3000r backend")

# --- CORS ---
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB engine: SQLite (default) or Postgres via DATABASE_URL ---

# 
DB_MODE: Literal["local", "remote"] = "remote"
if DB_MODE == "remote":
    # Found this from https://console.neon.tech/app/projects/mute-mud-01593984?database=neondb&branchId=br-winter-king-af7p2cux
    DATABASE_URL='postgresql+psycopg://neondb_owner:npg_9cQhAmEBiZu3@ep-nameless-tree-afsairo6-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    engine = sa.create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=5)
    print(f"Connected to {DATABASE_URL}")
else:
    engine = sa.create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})

# --- Schema ---
metadata = sa.MetaData()
sessions = sa.Table(
    "sessions", metadata,
    sa.Column("date", sa.Date, nullable=False),
    sa.Column("duration", sa.Integer, nullable=False),
)
metadata.create_all(engine)  # CREATE TABLE IF NOT EXISTS

class Session(BaseModel):
    date: date
    duration: int = Field(gt=0, le=1440)

@app.post("/sessions", response_model=Session)
def add_session(s: Session):
    with engine.begin() as conn:
        conn.execute(sa.insert(sessions).values(date=s.date, duration=s.duration))
    return s

@app.get("/sessions", response_model=List[Session])
def list_sessions():
    with engine.begin() as conn:
        rows = conn.execute(sa.select(sessions.c.date, sessions.c.duration)
                            .order_by(sessions.c.date.desc())).all()
    return [{"date": r.date, "duration": r.duration} for r in rows]

@app.get("/healthz")
def healthz():
    return {"ok": True, "time": datetime.utcnow().isoformat()}
