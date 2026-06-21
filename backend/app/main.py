from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

from app.config import settings
from app.database import engine
import app.models  # noqa: F401
from app.routers import auth, resume, interview, session, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # tables come from alembic migrations
    genai.configure(api_key=settings.gemini_api_key)
    yield
    await engine.dispose()


app = FastAPI(
    title="Intervuo API",
    version="2.0.0",
    description="AI-powered technical interview platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(resume.router,    prefix="/api/resume",    tags=["Resume"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(session.router,   prefix="/api/session",   tags=["Session"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "2.0.0"}
