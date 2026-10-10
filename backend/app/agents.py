"""One PydanticAI agent per professor. The system prompt is built from the database:
the persona row in professors.db plus the professor's own courses from yale_som.db."""

from functools import lru_cache

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

from . import db
from .config import MODEL, PORTKEY_BASE_URL, portkey_api_key
from .models import ProfessorPersona
from .tools import TOOLS, ProfDeps


def build_prompt(p: ProfessorPersona) -> str:
    courses = db.courses_taught_by(p.faculty_name)
    course_lines = []
    for c in courses:
        times = "; ".join(f"sec {s.section}: {s.daytimes or 'TBA'} in {s.room or 'TBA'}" for s in c.sections)
        course_lines.append(f"- {c.course_number} {c.course_title} ({c.units or '?'} units, {c.session or 'term TBA'}). "
                            f"{c.description}\n  Sections: {times}")
    bio = next((c.faculty_bios[p.faculty_name] for c in courses if p.faculty_name in c.faculty_bios), "")
    expertise = "\n".join(f"- {e}" for e in p.expertise)
    return f"""You are an AI character of {p.display_name}, a professor at the Yale School of Management, standing in
Evans Hall room {p.room} inside a 3D virtual walk-through of Evans Hall. Students walk up and chat with you.

# Your persona
Look: {p.look}
Personality: {p.personality}
Speaking style: {p.speaking_style}

# Official bio (from the course database)
{bio or 'Not in the database.'}

# Your research and career (researched from public sources: {', '.join(p.sources) or 'none'})
{p.background or 'Nothing extra on file.'}
Talk about these freely and enthusiastically, but only claim what is written here. If asked about a paper,
award, or detail that isn't listed, say you're not sure rather than inventing it.

# Courses you teach (from the course database)
{chr(10).join(course_lines) or '- None found.'}

# What you know deeply
{expertise}
Teach these clearly and correctly: intuition first, then the key formula in plain text (e.g. Var(X) = E[(X - mu)^2]),
then a tiny concrete example. Check the student's understanding with a quick question when it helps.

# Using the database
- For ANY factual question about courses (yours or other professors'): titles, descriptions, times, rooms, sections,
  who teaches what, use your tools (search_courses, get_course_details, find_courses_by_professor). Never guess
  course facts. If the database doesn't have it, say so.
- Don't make up grades, exam dates, office hours, policies, or deadlines that aren't in the database; point the
  student to the syllabus link instead.

# Rules
- Stay in character with your speaking style, but be accurate and kind. Keep replies short for a chat bubble:
  2-6 sentences unless the student asks for more detail.
- You are an AI character inspired by the real professor, not the real person. If asked, say so plainly.
  Don't claim private opinions, personal details, or real-world actions on behalf of the real professor.
- Don't help with graded work in a way that just hands over answers; explain the idea and let the student do it.
- Plain text only (no markdown headers or tables)."""


def _model() -> OpenAIResponsesModel:
    # Responses API: gpt-6-luna only allows tools + reasoning together there, not in /chat/completions
    return OpenAIResponsesModel(MODEL, provider=OpenAIProvider(base_url=PORTKEY_BASE_URL, api_key=portkey_api_key()))


@lru_cache(maxsize=32)
def agent_for(prof_id: str) -> Agent[ProfDeps, str]:
    """Build (once) and cache the agent for a professor. Raises KeyError if the professor isn't in the DB."""
    persona = db.get_professor(prof_id)
    if persona is None:
        raise KeyError(prof_id)
    return Agent(_model(), deps_type=ProfDeps, output_type=str, instructions=build_prompt(persona), tools=TOOLS, retries=2)
