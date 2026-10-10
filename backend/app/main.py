"""FastAPI backend: every professor is a PydanticAI agent you can chat with.

Run (from backend/):  .venv\\Scripts\\python -m uvicorn app.main:app --port 8000
"""

import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic_ai import UsageLimits
from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart

from . import db
from .agents import agent_for
from .config import ALLOWED_ORIGINS, MAX_HISTORY_MESSAGES, MODEL, REQUEST_LIMIT
from .models import ChatRequest, ChatResponse, ProfessorPublic
from .seed import seed
from .tools import ProfDeps

log = logging.getLogger("professors")

# chat memory: session_id -> PydanticAI message history (in memory; resets when the server restarts)
SESSIONS: dict[str, list[ModelMessage]] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed()
    yield


app = FastAPI(title="Yale SOM Virtual: Professor Agents", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL, "professors": [p.id for p in db.list_professors()]}


@app.get("/api/professors", response_model=list[ProfessorPublic])
def professors() -> list[ProfessorPublic]:
    out = []
    for p in db.list_professors():
        courses = db.courses_taught_by(p.faculty_name)
        c = courses[0] if courses else None
        out.append(ProfessorPublic(id=p.id, display_name=p.display_name, room=p.room, greeting=p.greeting,
                                   course_number=c.course_number if c else None, course_title=c.course_title if c else None))
    return out


@app.post("/api/professors/{prof_id}/chat", response_model=ChatResponse)
async def chat(prof_id: str, req: ChatRequest) -> ChatResponse:
    try:
        agent = agent_for(prof_id)
    except KeyError:
        raise HTTPException(404, f"No professor '{prof_id}'.")
    session_id = req.session_id if req.session_id in SESSIONS else str(uuid.uuid4())
    history = SESSIONS.get(session_id, [])
    try:
        result = await agent.run(req.message, deps=ProfDeps(prof_id), message_history=history,
                                 usage_limits=UsageLimits(request_limit=REQUEST_LIMIT))
    except Exception as exc:  # never leak keys or stack traces to the browser
        log.exception("chat failed for %s", prof_id)
        raise HTTPException(502, f"The professor's brain is offline right now ({type(exc).__name__}). Try again.")
    SESSIONS[session_id] = trim_history(result.all_messages())
    return ChatResponse(professor_id=prof_id, session_id=session_id, reply=result.output)


def trim_history(messages: list[ModelMessage]) -> list[ModelMessage]:
    """Keep about the last MAX_HISTORY_MESSAGES, cutting only at a student message so tool calls stay paired."""
    if len(messages) <= MAX_HISTORY_MESSAGES:
        return messages
    for i in range(len(messages) - MAX_HISTORY_MESSAGES, len(messages)):
        m = messages[i]
        if isinstance(m, ModelRequest) and any(isinstance(p, UserPromptPart) for p in m.parts):
            return messages[i:]
    return messages[-1:]
