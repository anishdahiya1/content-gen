from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    auth,
    upload,
    transcribe,
    viral_clips,
    content_generation,
    hashtags,
    publishing,
    jobs,
    clip_generation,
    rag,
    health,
    generative,
    vault,
    trends,
    scriptwriter,
    repurposer
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(transcribe.router, prefix="/transcribe", tags=["transcribe"])
api_router.include_router(viral_clips.router, prefix="/viral-clips", tags=["viral-clips"])
api_router.include_router(content_generation.router, prefix="/content-generation", tags=["content-generation"])
api_router.include_router(hashtags.router, prefix="/hashtags", tags=["hashtags"])
api_router.include_router(publishing.router, prefix="/publishing", tags=["publishing"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(clip_generation.router, prefix="/clip-generation", tags=["clip-generation"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(generative.router, prefix="/generative", tags=["generative"])
api_router.include_router(vault.router, prefix="/vault", tags=["vault"])
api_router.include_router(trends.router, prefix="/trends", tags=["trends"])
api_router.include_router(scriptwriter.router, prefix="/scriptwriter", tags=["scriptwriter"])
api_router.include_router(repurposer.router, prefix="/repurposer", tags=["repurposer"])
