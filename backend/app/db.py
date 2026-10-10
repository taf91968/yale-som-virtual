"""Database access: course catalog (data/yale_som.db, read-only) and professor personas (professors.db)."""

import json
import re
import sqlite3
from functools import lru_cache

from .config import COURSES_DB, PROFESSORS_DB
from .models import CourseDetail, CourseSection, CourseSummary, ProfessorPersona

# ---------- courses ----------


def _courses_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{COURSES_DB.as_posix()}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


@lru_cache(maxsize=1)
def all_course_rows() -> tuple[dict, ...]:
    """All ~230 course rows, loaded once. Small enough to search in memory."""
    with _courses_conn() as conn:
        return tuple(dict(r) for r in conn.execute("select * from courses order by course_number, section"))


def _clean(s: str | None) -> str:
    return (s or "").strip()


def _words(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def search_courses(query: str, limit: int = 8) -> list[CourseSummary]:
    """Rank courses by keyword overlap: course number and title count most, then faculty, then description."""
    q = _words(query)
    if not q:
        return []
    grouped: dict[str, dict] = {}
    for r in all_course_rows():
        num = _clean(r["course_number"])
        g = grouped.setdefault(num, {"row": r, "faculty": set(), "score": 0})
        if _clean(r["faculty_1"]):
            g["faculty"].add(_clean(r["faculty_1"]))
    for g in grouped.values():
        r = g["row"]
        g["score"] = (
            5 * len(q & _words(_clean(r["course_number"])))
            + 3 * len(q & _words(_clean(r["course_title"])))
            + 3 * len(q & _words(" ".join(g["faculty"])))
            + len(q & _words(_clean(r["course_description"])))
        )
    ranked = sorted((g for g in grouped.values() if g["score"] > 0), key=lambda g: -g["score"])[:limit]
    return [
        CourseSummary(
            course_number=_clean(g["row"]["course_number"]),
            course_title=_clean(g["row"]["course_title"]),
            faculty=sorted(g["faculty"]),
            category=_clean(g["row"]["course_category"]) or None,
            session=_clean(g["row"]["course_session"]) or None,
            units=_clean(g["row"]["units"]) or None,
        )
        for g in ranked
    ]


def course_detail(course_number: str) -> CourseDetail | None:
    num = re.sub(r"\s+", " ", course_number.strip().upper())
    if not num.startswith("MGT") and num[:1].isdigit():
        num = f"MGT {num}"
    rows = [r for r in all_course_rows() if _clean(r["course_number"]).upper() == num]
    if not rows:
        return None
    first = max(rows, key=lambda r: len(_clean(r["course_description"])))
    bios = {_clean(r["faculty_1"]): _clean(r["faculty_bio"]) for r in rows if _clean(r["faculty_1"]) and _clean(r["faculty_bio"])}
    return CourseDetail(
        course_number=_clean(first["course_number"]),
        course_title=_clean(first["course_title"]),
        category=_clean(first["course_category"]) or None,
        session=_clean(first["course_session"]) or None,
        units=_clean(first["units"]) or None,
        description=_clean(first["course_description"]) or "No description in the database.",
        faculty_bios=bios,
        sections=[
            CourseSection(
                section=_clean(r["section"]) or None,
                faculty=_clean(r["faculty_1"]) or None,
                daytimes=re.sub(r"\s+", " ", _clean(r["daytimes"])) or None,
                room=_clean(r["room"]) or None,
            )
            for r in rows
        ],
        syllabus_links=sorted({_clean(r["syllabus"]) for r in rows if _clean(r["syllabus"]).startswith("http")}),
    )


def courses_taught_by(faculty_name: str) -> list[CourseDetail]:
    nums = sorted({_clean(r["course_number"]) for r in all_course_rows() if _clean(r["faculty_1"]) == faculty_name})
    return [d for n in nums if (d := course_detail(n))]


def find_by_professor(name: str) -> list[CourseSummary]:
    """Courses whose faculty name contains every word of `name` (e.g. 'Zaman' or 'Zoe Chance')."""
    want = _words(name)
    nums = sorted({_clean(r["course_number"]) for r in all_course_rows() if want and want <= _words(_clean(r["faculty_1"]))})
    out = []
    for n in nums:
        d = course_detail(n)
        if d:
            out.append(CourseSummary(course_number=d.course_number, course_title=d.course_title,
                                     faculty=sorted({s.faculty for s in d.sections if s.faculty}),
                                     category=d.category, session=d.session, units=d.units))
    return out


# ---------- professors ----------

PROFESSORS_SCHEMA = """
create table if not exists professors (
    id text primary key,
    faculty_name text not null,
    display_name text not null,
    room text not null,
    look text not null,
    personality text not null,
    speaking_style text not null,
    expertise text not null,   -- JSON list
    greeting text not null,
    background text not null default '',
    sources text not null default '[]'  -- JSON list of URLs
)
"""


def reset_professors() -> None:
    """professors.db is generated from seed.py, so rebuild it on startup (picks up new columns too)."""
    with _prof_conn() as conn:
        conn.execute("drop table if exists professors")
        conn.execute(PROFESSORS_SCHEMA)


def _prof_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(PROFESSORS_DB)
    conn.row_factory = sqlite3.Row
    return conn


def upsert_professor(p: ProfessorPersona) -> None:
    with _prof_conn() as conn:
        conn.execute(PROFESSORS_SCHEMA)
        conn.execute(
            "insert or replace into professors values (?,?,?,?,?,?,?,?,?,?,?)",
            (p.id, p.faculty_name, p.display_name, p.room, p.look, p.personality, p.speaking_style,
             json.dumps(p.expertise), p.greeting, p.background, json.dumps(p.sources)),
        )


def _row_to_persona(r: sqlite3.Row) -> ProfessorPersona:
    d = dict(r)
    d["expertise"] = json.loads(d["expertise"])
    d["sources"] = json.loads(d["sources"])
    return ProfessorPersona(**d)


def get_professor(prof_id: str) -> ProfessorPersona | None:
    with _prof_conn() as conn:
        conn.execute(PROFESSORS_SCHEMA)
        r = conn.execute("select * from professors where id = ?", (prof_id,)).fetchone()
    return _row_to_persona(r) if r else None


def list_professors() -> list[ProfessorPersona]:
    with _prof_conn() as conn:
        conn.execute(PROFESSORS_SCHEMA)
        return [_row_to_persona(r) for r in conn.execute("select * from professors order by id")]
