from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.services.content_generation import generate_captions, generate_titles

router = APIRouter()


class ContentGenerationRequest(BaseModel):
    """Request to generate captions and titles."""
    transcript: str


@router.post("/captions")
async def create_captions(request: ContentGenerationRequest) -> JSONResponse:
    """
    Generate platform-specific captions and titles.
    
    Args:
        request: Contains transcript text
    
    Returns:
        JSON with captions and titles for each platform
    """
    if not request.transcript or len(request.transcript.strip()) == 0:
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    try:
        # Generate captions for multiple platforms
        platforms = ["youtube", "instagram", "tiktok", "linkedin"]
        captions_by_platform = {}
        titles_by_platform = {}
        
        for platform in platforms:
            try:
                captions_result = generate_captions(request.transcript, platform)
                captions_by_platform[platform] = captions_result.get("captions", [])
            except Exception as e:
                print(f"Error generating captions for {platform}: {e}")
                captions_by_platform[platform] = []
            
            try:
                titles_result = generate_titles(request.transcript)
                titles_by_platform[platform] = titles_result.get("titles", [])
            except Exception as e:
                print(f"Error generating titles for {platform}: {e}")
                titles_by_platform[platform] = []
        
        return JSONResponse({
            "status": "success",
            "captions": captions_by_platform,
            "titles": titles_by_platform,
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
