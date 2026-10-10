# Yale SOM Virtual: Evans Hall, Floor 2

A first-person walk-through of the 2nd floor of Edward P. Evans Hall (Yale School of Management), built with React, Vite, three.js, and @react-three/fiber.

It includes the blue classroom drums you can walk into, the curvy glass cloister around the courtyard, Ross Library on the west side, the Beinecke Terrace Room and its outdoor terrace on the east side, the small glass meeting rooms, and paintings above the stairwells.

**Walk it in your browser:** https://zlisto.github.io/yale_som_virtual/

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Click to walk in**.

**Keyboard + mouse** (works like a PC shooter):

| Key | Action |
| --- | --- |
| W A S D / arrows | walk |
| Mouse | look |
| Shift | sprint |
| Space | jump |
| C | crouch |
| M | toggle map |
| Esc | pause |

**Phone / tablet:** tap **Tap to walk in**. The left-thumb joystick walks (push it all the way to sprint), dragging anywhere else looks around, and there are on-screen jump and pause buttons. On a laptop, click **Use on-screen joystick** to try the phone controls. WASD still works in that mode.

## Talk to the professors (AI backend)

Professors you can chat with are PydanticAI agents served by a FastAPI backend in `backend/`. Walk up, aim the crosshair at one and click (or tap on a phone) to open the chat; they turn to face you while you talk.

| Professor | Room | Course (from `data/yale_som.db`) | Avatar |
| --- | --- | --- | --- |
| Prof. Tauhid Zaman | Evans 2200 | MGT 409 AI Foundations for Managers | `src/Zaman.jsx`: BLACKPINK hoodie, Labubu keychain |
| Prof. Peter Schott | Evans 2210 | MGT 407 Statistics (EMBA) | `src/Schott.jsx`: light-blue button-down, Totoro plush |

To add a professor: a persona in `backend/app/seed.py`, an entry in `src/chatProfessors.js`, an avatar component (shared click/face/talk behavior lives in `src/chatProf.jsx`), and its room in `src/Faculty.jsx`.

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env        # then set PORTKEY_API_KEY (or set it as a system env var)
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

Then run the frontend as usual (`npm run dev`); Vite proxies `/api` to the backend on port 8000.

- `backend/app/seed.py`: professor personas (look, personality, speaking style, expertise, and researched background with source URLs), written to `backend/professors.db` on startup.
- `backend/app/agents.py`: one agent per professor. The system prompt is built from the database: the persona row plus the professor's own courses, sections, rooms, and bio from `data/yale_som.db`.
- `backend/app/tools.py`: tools the agents use to look up any course: `search_courses`, `get_course_details`, `find_courses_by_professor`.
- `backend/app/main.py`: `GET /api/health`, `GET /api/professors`, `POST /api/professors/{id}/chat` (keeps a session so the professor remembers the conversation).
- Model: `OPENAI_MODEL` (default `gpt-6-luna`) through Portkey, using the Responses API (needed for tools with this model).

The chat character is an AI inspired by the real professor, not the real person. The GitHub Pages / Render builds have no backend, so the chat shows an "offline" message there.

## How it's built

- `src/layout.js`: the floor plan in meters (+x east, -z north). It holds the drums, library, Beinecke, stairs, meeting rooms, wall colliders, and room lookup. Each classroom faces the courtyard, with the whiteboard and podium on the inner side and stadium-seating rows (32 cm risers) stepping up toward the outer wall; its two doors are at the front corners. You climb the center-aisle steps one riser at a time.
- `src/World.jsx`: all the meshes. Walls use instanced boxes and the drums use partial cylinders.
- `src/textures.js`: procedural canvas textures (carpet, navy drum glass, wood slats, mural, signs, stairwell paintings).
- `src/Player.jsx`: walking (pointer lock or touch), jump/crouch, circle-vs-wall collision.
- `src/TouchControls.jsx`: on-screen joystick, drag-to-look, jump and pause buttons.
- `src/Minimap.jsx`: the black-and-pink map in the corner.
- `src/Labubu.jsx`: a customizable Labubu built from primitives: `fur`, `expression` (grin / happy / surprised / sleepy / mischief), `shirt` ('yale', 'stripes', or any color), `pants`, `overalls`, `hat`, `sitting`, `anim`.
- `src/LabubuParty.jsx`: the crew playing in the courtyard plus Labubus in meetings in every glass room.
- `src/slides.js`: lecture slides for eight Fall 2026 MBA courses (MGT 409, 404, 403, 887, 402, 538, 800, 541) on the classroom screens and meeting-room monitors.
- `src/LabubuCrowd.jsx`: 30 seated Labubu students per classroom, drawn with shared instanced meshes.
- `src/Professor.jsx` + `src/Faculty.jsx`: cartoon Hogwarts professors teaching each class (Dumbledore, McGonagall, Trelawney, Slughorn, Snape, Lockhart, Moody, Flitwick), plus Hagrid in the courtyard.
- `src/HandsomeDan.jsx`: Handsome Dan touring a loop of 1000 randomly chosen classrooms (blue dot on the map).

The layout is estimated from the wayfinding plan posted on the floor, so room sizes are approximate. The Stair G painting comes from a photo; the other stairwell paintings are made up.

Made for MGT 409: AI Foundations for Managers, Lecture 13.
