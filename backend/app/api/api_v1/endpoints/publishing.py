from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.services.publishing import (
    publish_to_youtube,
    publish_to_instagram,
    publish_to_tiktok,
)

router = APIRouter()

@router.post("/publish/youtube")
async def publish_youtube(
    clip_path: str,
    title: str,
    description: str,
) -> JSONResponse:
    """
    Publish clip to YouTube Shorts.
    """
    try:
        result = publish_to_youtube(clip_path, title, description, [])
        return JSONResponse(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/publish/instagram")
async def publish_instagram(
    clip_path: str,
    caption: str,
) -> JSONResponse:
    """
    Publish clip to Instagram Reels.
    """
    try:
        result = publish_to_instagram(clip_path, caption, "")
        return JSONResponse(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/publish/tiktok")
async def publish_tiktok(
    clip_path: str,
    description: str,
) -> JSONResponse:
    """
    Publish clip to TikTok.
    """
    try:
        result = publish_to_tiktok(clip_path, description)
        return JSONResponse(result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
