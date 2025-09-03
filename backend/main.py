"""
Create a session:
> curl -sX POST localhost:8000/sessions \
  -H 'content-type: application/json' \
  -d '{"date":"2025-09-02","dur_min":30}'


List all sessions:
> curl -s http://localhost:8000/sessions
"""
from datetime import date, datetime
from typing import List

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="eng3000 with Pydantic")

# -------- pydantic model --------
class Session(BaseModel):
    date: date
    dur_min: int = Field(gt=0, le=1440, description="minutes studied (1–1440)")

# -------- in-memory storage --------
SESSIONS: List[Session] = []

# -------- endpoints --------
@app.post("/sessions", response_model=Session)
def add_session(session: Session):
    """Add a study session (validated by Pydantic)."""
    SESSIONS.append(session)
    # sort newest first
    SESSIONS.sort(key=lambda s: s.date, reverse=True)
    return session

@app.get("/sessions", response_model=List[Session])
def list_sessions():
    """List all study sessions."""
    return SESSIONS

@app.get("/healthz")
def healthz():
    return {"ok": True, "time": datetime.utcnow().isoformat()}
