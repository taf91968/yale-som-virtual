"""Settings, read once from the environment (and backend/.env if present)."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")  # optional; PORTKEY_API_KEY may also be a system env var
os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

COURSES_DB = BACKEND_DIR.parent / "data" / "yale_som.db"  # shared course data (read-only)
PROFESSORS_DB = BACKEND_DIR / "professors.db"  # professor personas, seeded on startup

PORTKEY_BASE_URL = "https://api.portkey.ai/v1"
MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()
]

MAX_HISTORY_MESSAGES = 24  # per chat session, to bound cost
REQUEST_LIMIT = 6  # model requests per chat turn (tool calls + answer)


def portkey_api_key() -> str:
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is not set (system env var or backend/.env).")
    return key
