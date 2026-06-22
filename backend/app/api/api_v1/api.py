from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    health,
    upload,
    transcribe,
    viral_clips,
    clip_generation,
    content_generation,
    hashtags,
    publishing,
    jobs,
    rag,
    auth,
)

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(upload.router, prefix="", tags=["upload"])
api_router.include_router(transcribe.router, prefix="", tags=["transcribe"])
api_router.include_router(viral_clips.router, prefix="", tags=["viral-clips"])
api_router.include_router(clip_generation.router, prefix="", tags=["clip-generation"])
api_router.include_router(content_generation.router, prefix="", tags=["content-generation"])
api_router.include_router(hashtags.router, prefix="", tags=["hashtags"])
api_router.include_router(publishing.router, prefix="", tags=["publishing"])
api_router.include_router(jobs.router, prefix="", tags=["jobs"])
api_router.include_router(rag.router, prefix="", tags=["rag"])
api_router.include_router(auth.router, prefix="", tags=["auth"])
