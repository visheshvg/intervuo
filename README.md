# Intervuo

Intervuo turns your resume into a tailored mock interview. It generates questions from
your background, reads each one aloud, and has you answer out loud on the spot; your
spoken answer is then transcribed and scored on content, delivery, and on-camera
presence. Every session ends with an in-depth report showing exactly what to improve.

**Live demo:** https://intervuo-ai.vercel.app

## Features

**Resume analysis**
- PDF upload and parsing (name, email, phone, page count, skills).
- Resume score (0-100) against a section rubric (summary, experience, projects,
  education, achievements) with concrete tips.
- Predicted field, recommended skills to add, and curated free course links.

**Interview**
- Resume-grounded questions from Gemini, tuned to a chosen field and experience level.
- Each question is read aloud (browser text-to-speech), with a replay control.
- Voice answers transcribed live in the browser (Web Speech API) - no audio upload.
- On-camera presence tracked in the browser with MediaPipe (eye-contact %); the video
  never leaves the device.

**Per-answer feedback**
- Content and communication scores from Gemini, with specific strengths, the gaps you
  missed, and an outline of what a strong answer covers.
- Delivery metrics computed from the transcript and timing: word count, words/min, and
  filler-word count.
- Tone (VADER sentiment) and eye-contact percentage.
- A transparent, weighted final score that shows how each dimension contributed.

**Reports and analytics**
- An in-depth per-session report: every question, your answer, and the full breakdown.
- Cross-session analytics: total sessions, average and best score, score-over-time chart.

**Platform**
- Email/password auth (JWT + bcrypt) with NextAuth sessions.
- Per-user rate limiting on the AI endpoints, timeouts on external calls, paginated lists.
- Versioned schema with Alembic migrations.

## Tech stack

**Backend**
- FastAPI (Python 3.11)
- SQLAlchemy 2.0 (async) + PostgreSQL, asyncpg driver
- Alembic for migrations
- python-jose + passlib/bcrypt for JWT auth
- Google Gemini 2.5 Flash (question generation and answer scoring)
- pdfminer.six (resume text) and vaderSentiment (deterministic tone)
- pytest + pytest-asyncio

**Frontend**
- Next.js 14 (App Router) + TypeScript
- NextAuth for sessions
- TanStack React Query for server state, Zustand for interview state
- Tailwind CSS, react-hook-form + zod, Recharts, react-dropzone
- Web Speech API for in-browser speech-to-text and text-to-speech
- MediaPipe Tasks Vision (Face Landmarker) for in-browser presence tracking

**Infra**
- Docker + Docker Compose
- GitHub Actions (tests, lint, type-check, image builds)

## How it works

```
Resume (PDF) -> pdfminer extracts text
            -> Gemini writes resume-grounded questions
            -> rule-based resume insights (score, field, skills, courses)
            -> session saved

Per question:
  question read aloud (browser TTS) -> you answer by voice
  -> Web Speech transcribes in-browser, MediaPipe measures eye contact in-browser
  -> POST { transcript, duration, eye_contact } to the backend
  -> Gemini scores content + communication; VADER tone + delivery metrics computed
  -> transparent combined score saved -> feedback returned to the client

Finish -> in-depth per-session report + cross-session analytics
```

The backend is split into routers (HTTP only), services (the logic, no framework
coupling), models, and schemas - the services have no FastAPI imports, so they test on
their own. Transcription, text-to-speech, and the camera analysis all run client-side,
which keeps the backend to pure scoring, costs nothing, and means video never leaves the
user's machine.

## Scoring

The final score is a transparent weighted blend, and the report shows each weight:

```
final_score = 0.7 * content + 0.2 * communication + 0.1 * presence
            = 0.7 * content + 0.3 * communication        (when the camera is off)
```

- `content` (0-10): Gemini - technical accuracy, depth, relevant examples.
- `communication` (0-10): Gemini - clarity, structure, conciseness, confidence.
- `presence` (0-10): from eye-contact %, calibrated so roughly 60% already earns full
  marks (nobody stares straight at the camera the whole time).

A session's total score is the average of its answer scores. Presence is measured as
eye contact, not emotion - a signal that is actually meaningful and can be explained,
rather than guessing happiness or anger from a face.

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker and Docker Compose
- A Google Gemini API key (free from Google AI Studio)
- A Chromium browser (Chrome or Edge) for speech and camera features

### 1. Configure

```bash
git clone <your-repo-url>
cd intervuo
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
```

Fill in `.env` with your Gemini key and a JWT secret. The backend will not start in
production without `INTERVUO_JWT_SECRET` set.

### 2. Start Postgres

```bash
docker compose up postgres -d
```

### 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate           # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

API runs at http://localhost:8000, with interactive docs at http://localhost:8000/docs.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:3000. Use Chrome or Edge and allow microphone (and camera,
optional) for the full experience.

### Or run the whole thing with Docker

```bash
docker compose up --build
```

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | no | Create an account, returns a JWT |
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| GET | `/api/auth/me` | yes | Current user |
| POST | `/api/resume/upload` | yes | Upload a PDF, get a session, questions, and resume insights |
| POST | `/api/interview/submit-answer/{session_id}/{index}` | yes | Submit `{ answer_text, duration_seconds, eye_contact_pct }`, get scores, feedback, delivery metrics, and tone |
| GET | `/api/session/` | yes | List your sessions (supports `limit` and `offset`) |
| GET | `/api/session/{id}` | yes | One session with its answers and full feedback |
| POST | `/api/session/{id}/complete` | yes | Finish a session and compute its total score |
| GET | `/api/analytics/` | yes | Score history and summary stats |
| GET | `/health` | no | Health check |

The two AI endpoints are rate limited per user (10/min for uploads, 20/min for answers)
so a single account can't run up the model bill. Question generation and scoring use
Gemini's JSON mode for reliable, fence-free parsing.


## Tests and checks

Backend:

```bash
cd backend
pytest tests/ -v
ruff check app/
```

Tests run against an in-memory SQLite database, so they need no external services.

Frontend:

```bash
cd frontend
npm run build
npx tsc --noEmit
npm run lint
```

CI runs all of the above on every push, plus a Docker build of both images.

## Project structure

```
backend/
  app/
    config.py            settings from environment variables
    database.py          async engine and session factory
    main.py              FastAPI app and router wiring
    models/              SQLAlchemy models
    schemas/             Pydantic request/response models
    routers/             auth, resume, interview, session, analytics
    services/            resume parsing, resume insights, question generation,
                         answer scoring, delivery metrics
    middleware/          JWT auth and rate limiting
  alembic/               migrations
  tests/                 pytest suite
frontend/
  src/
    app/                 App Router pages (dashboard, interview, report, analytics, auth)
    components/          UI and feature components
    hooks/               camera, speech-to-text, text-to-speech, face tracking
    lib/                 API client and auth config
    store/               Zustand interview state
    types/               shared TypeScript types
```
