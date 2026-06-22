from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.services.hashtag_generation import generate_hashtags

router = APIRouter()


class HashtagRequest(BaseModel):
    """Request to generate hashtags."""
    transcript: str


@router.post("/hashtags")
async def create_hashtags(request: HashtagRequest) -> JSONResponse:
    """
    Generate platform-specific hashtags.
    
    Args:
        request: Contains transcript text
    
    Returns:
        JSON with hashtags for each platform
    """
    if not request.transcript or len(request.transcript.strip()) == 0:
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    try:
        # Generate hashtags for multiple platforms
        platforms = ["instagram", "tiktok", "twitter", "linkedin"]
        hashtags_by_platform = {}
        
        for platform in platforms:
            try:
                result = generate_hashtags(request.transcript, platform)
                hashtags_by_platform[platform] = result
            except Exception as e:
                print(f"Error generating hashtags for {platform}: {e}")
                hashtags_by_platform[platform] = {
                    "platform": platform,
                    "hashtags": [],
                    "hashtag_string": "",
                    "trending_score": 0
                }
        
        return JSONResponse({
            "status": "success",
            "hashtags": hashtags_by_platform,
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
