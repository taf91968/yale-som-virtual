"""Pydantic models for the API, the database rows, and agent tool results."""

from pydantic import BaseModel, Field


class ProfessorPersona(BaseModel):
    """One row of the professors table: everything needed to build a professor's agent prompt."""

    id: str = Field(description="Slug used in URLs, e.g. 'zaman'.")
    faculty_name: str = Field(description="Exactly as in courses.faculty_1, e.g. 'Zaman, Tauhid'.")
    display_name: str
    room: str = Field(description="Evans Hall room where the avatar stands, e.g. '2200'.")
    look: str = Field(description="How the avatar looks (for the prompt, so the agent can talk about itself).")
    personality: str
    speaking_style: str
    expertise: list[str]
    greeting: str
    background: str = Field(default="", description="Researched public facts: career, research, papers, awards.")
    sources: list[str] = Field(default_factory=list, description="URLs the background facts came from.")


class ProfessorPublic(BaseModel):
    """What the frontend needs to show a professor."""

    id: str
    display_name: str
    room: str
    course_number: str | None
    course_title: str | None
    greeting: str


class CourseSummary(BaseModel):
    course_number: str
    course_title: str
    faculty: list[str]
    category: str | None = None
    session: str | None = None
    units: str | None = None


class CourseSection(BaseModel):
    section: str | None
    faculty: str | None
    daytimes: str | None
    room: str | None


class CourseDetail(BaseModel):
    course_number: str
    course_title: str
    category: str | None
    session: str | None
    units: str | None
    description: str
    faculty_bios: dict[str, str]
    sections: list[CourseSection]
    syllabus_links: list[str]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = Field(default=None, description="Return the id from the previous reply to keep context.")


class ChatResponse(BaseModel):
    professor_id: str
    session_id: str
    reply: str
