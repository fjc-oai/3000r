# app.py
import os
import pathlib
from datetime import date, datetime
from typing import List, Literal, Optional

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
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("date", sa.Date, nullable=False),
    sa.Column("duration", sa.Integer, nullable=False),
)
words = sa.Table(
    "words",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("word", sa.String(255), nullable=False),
    sa.Column("date", sa.Date, nullable=False),
)
word_examples = sa.Table(
    "word_examples",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("word_id", sa.Integer, sa.ForeignKey("words.id", ondelete="CASCADE"), nullable=False),
    sa.Column("example", sa.Text, nullable=False),
)
# Topics
topics = sa.Table(
    "topics",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("name", sa.String(255), nullable=False),
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


class WordCreate(BaseModel):
    word: str = Field(min_length=1)
    examples: List[str] = Field(min_items=1)
    date: Optional[date] = None


class Word(BaseModel):
    id: int
    word: str
    date: date
    examples: List[str]


@app.post("/api/words", response_model=Word)
def add_word(w: WordCreate):
    valid_examples = [e.strip() for e in w.examples if e and e.strip()]
    chosen_date = w.date or date.today()
    with engine.begin() as conn:
        result = conn.execute(sa.insert(words).values(word=w.word, date=chosen_date))
        inserted_pk = result.inserted_primary_key
        if inserted_pk and len(inserted_pk) > 0:
            new_id = inserted_pk[0]
        else:
            new_id = conn.execute(sa.select(sa.func.max(words.c.id))).scalar_one()
        if valid_examples:
            conn.execute(
                sa.insert(word_examples),
                [{"word_id": new_id, "example": ex} for ex in valid_examples],
            )
    return {"id": new_id, "word": w.word, "date": chosen_date, "examples": valid_examples}


@app.get("/api/words", response_model=List[Word])
def list_words(start: Optional[date] = None, end: Optional[date] = None):
    # Build base query with optional date range filtering
    stmt = sa.select(words.c.id, words.c.word, words.c.date)
    if start is not None:
        stmt = stmt.where(words.c.date >= start)
    if end is not None:
        stmt = stmt.where(words.c.date <= end)
    stmt = stmt.order_by(words.c.date.desc(), words.c.id.desc())

    with engine.begin() as conn:
        word_rows = conn.execute(stmt).all()
        example_rows = conn.execute(
            sa.select(word_examples.c.word_id, word_examples.c.example)
        ).all()
    examples_by_word_id = {}
    for word_id, example in example_rows:
        examples_by_word_id.setdefault(word_id, []).append(example)
    return [
        {"id": r.id, "word": r.word, "date": r.date, "examples": examples_by_word_id.get(r.id, [])}
        for r in word_rows
    ]


class TopicCreate(BaseModel):
    name: str = Field(min_length=1)


class Topic(BaseModel):
    id: int
    name: str


@app.post("/api/topics", response_model=Topic)
def add_topic(t: TopicCreate):
    with engine.begin() as conn:
        result = conn.execute(sa.insert(topics).values(name=t.name))
        inserted_pk = result.inserted_primary_key
        if inserted_pk and len(inserted_pk) > 0:
            new_id = inserted_pk[0]
        else:
            new_id = conn.execute(sa.select(sa.func.max(topics.c.id))).scalar_one()
    return {"id": new_id, "name": t.name}


@app.get("/api/topics", response_model=List[Topic])
def list_topics():
    with engine.begin() as conn:
        rows = conn.execute(
            sa.select(topics.c.id, topics.c.name).order_by(topics.c.id.desc())
        ).all()
    return [{"id": r.id, "name": r.name} for r in rows]


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
