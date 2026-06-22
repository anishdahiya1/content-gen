from dotenv import load_dotenv
load_dotenv()

import sys
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.api_v1.api import api_router

from app.db.database import init_db
from app.services.worker import worker

app = FastAPI(title="CreatorPilot AI Backend")

# Ensure storage directories exist
STORAGE_PATH = Path(__file__).resolve().parents[2] / "storage"
STORAGE_PATH.mkdir(parents=True, exist_ok=True)

# Mount storage folder for video streaming
app.mount("/storage", StaticFiles(directory=str(STORAGE_PATH)), name="storage")

# Initialize database tables and start background worker on startup
@app.on_event("startup")
def startup_event():
    init_db()
    worker.start()

@app.on_event("shutdown")
def shutdown_event():
    worker.stop()

# Allow the frontend (Next.js dev server) to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "creatorpilot-ai-backend"}
