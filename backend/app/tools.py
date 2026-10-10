"""Tools every professor agent can call to look things up in the course database."""

from dataclasses import dataclass

from pydantic_ai import RunContext

from . import db
from .models import CourseDetail, CourseSummary


@dataclass
class ProfDeps:
    professor_id: str


def search_courses(ctx: RunContext[ProfDeps], query: str, limit: int = 8) -> list[CourseSummary]:
    """Search the Yale SOM course catalog by keywords (topic, title words, course number, or professor).

    Use this when a student asks about a class you don't teach, e.g. "is there a negotiation class?"
    or "what covers corporate finance?".

    Args:
        query: Keywords such as "negotiation", "accounting", "MGT 541", or "regression".
        limit: Max results (1-10).
    """
    return db.search_courses(query, max(1, min(limit, 10)))


def get_course_details(ctx: RunContext[ProfDeps], course_number: str) -> CourseDetail | str:
    """Get full details for one course: description, sections, meeting times, rooms, faculty bios, syllabus links.

    Args:
        course_number: e.g. "MGT 409" (a bare "409" also works).
    """
    return db.course_detail(course_number) or f"No course {course_number!r} in the database."


def find_courses_by_professor(ctx: RunContext[ProfDeps], professor_name: str) -> list[CourseSummary] | str:
    """List the courses a given faculty member teaches.

    Args:
        professor_name: Last name or full name, e.g. "Chance" or "Zoe Chance".
    """
    return db.find_by_professor(professor_name) or f"No courses found for {professor_name!r}."


TOOLS = [search_courses, get_course_details, find_courses_by_professor]
