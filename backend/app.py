"""
Create a session:
> curl -sX POST localhost:8000/sessions \
  -H 'content-type: application/json' \
  -d '{"date":"2025-09-02","dur_min":30}'


List all sessions:
> curl -s http://localhost:8000/sessions
"""
import sqlite3
from datetime import date, datetime
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="3000r backend (SQLite)")

# allow your React dev origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Pydantic model ----
class Session(BaseModel):
    date: date
    duration: int = Field(gt=0, le=1440)

# ---- SQLite setup (stdlib only) ----
DB_PATH = "app.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,          -- ISO YYYY-MM-DD
    duration INTEGER NOT NULL,   -- minutes
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
""")
conn.commit()

def db_add_session(s: Session) -> None:
    conn.execute("INSERT INTO sessions(date, duration) VALUES (?, ?)", (s.date.isoformat(), s.duration))
    conn.commit()

def db_list_sessions() -> list[Session]:
    # newest first by date, then created_at
    rows = conn.execute("""
        SELECT date, duration
        FROM sessions
        ORDER BY date DESC, created_at DESC
    """).fetchall()
    return [Session(date=row[0], duration=row[1]) for row in rows]

# ---- Endpoints ----
@app.post("/sessions", response_model=Session)
def add_session(session: Session):
    db_add_session(session)
    return session

@app.get("/sessions", response_model=List[Session])
def list_sessions():
    return db_list_sessions()

@app.get("/healthz")
def healthz():
    return {"ok": True, "time": datetime.utcnow().isoformat()}
