from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_manager import AIManager

router = APIRouter()

class ScriptRequest(BaseModel):
    topic: str
    duration_seconds: int = 60

@router.post("/generate")
async def generate_script(request: ScriptRequest):
    """
    Generates a high-retention video script using Gemini.
    """
    prompt = f"""
    You are an elite YouTube Shorts and TikTok scriptwriter.
    Write a highly engaging {request.duration_seconds}-second video script about: "{request.topic}"
    
    The script MUST follow this structure:
    1. HOOK: A massive pattern-interrupt hook (first 3 seconds).
    2. BODY: Fast-paced, high-value information.
    3. CTA: A strong Call to Action to subscribe or comment.
    
    Format the output elegantly with clear [B-ROLL: ...] visual cues inline.
    Just output the raw script text, ready to be read on a teleprompter. No markdown formatting blocks or pleasantries.
    """
    
    try:
        response = await AIManager.generate_text(prompt, json_mode=False)
        return {"script": response.strip()}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
