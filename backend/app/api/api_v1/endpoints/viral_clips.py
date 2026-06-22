from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import Video, Transcript, Clip
from app.services.viral_detection import analyze_transcript_for_clips

router = APIRouter()

class ViralClipsRequest(BaseModel):
    """Request to detect viral clip moments."""
    transcript: str
    video_id: Optional[int] = None
    num_clips: Optional[int] = 3
    clip_prompt: Optional[str] = None  # Client brief to guide clip style

@router.post("/viral-clips")
async def detect_viral_clips(request: ViralClipsRequest, db: Session = Depends(get_db)) -> JSONResponse:
    """
    Analyze transcript and identify viral clip moments.
    """
    if not request.transcript or len(request.transcript.strip()) == 0:
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    try:
        # 1. Call viral clip detector LLM with custom num_clips and optional clip_prompt
        clips = analyze_transcript_for_clips(
            request.transcript,
            num_clips=request.num_clips or 3,
            clip_prompt=request.clip_prompt or None
        )
        
        # 2. If video_id is provided, save the clips in the database and update Video configuration
        if request.video_id:
            video = db.query(Video).filter(Video.id == request.video_id).first()
            if video:
                video.num_clips = request.num_clips or 3
                # Persist clip_prompt on the video record if provided
                if request.clip_prompt:
                    video.clip_prompt = request.clip_prompt
                
            # Delete old clips if any to avoid duplication
            db.query(Clip).filter(Clip.video_id == request.video_id).delete()
            
            for clip_data in clips:
                segment = (
                    clip_data.get("segment")
                    or clip_data.get("segment_text")
                    or clip_data.get("transcript_segment")
                    or clip_data.get("text")
                    or clip_data.get("content")
                    or ""
                )
                clip = Clip(
                    video_id=request.video_id,
                    start_time=clip_data.get("start_time"),
                    end_time=clip_data.get("end_time"),
                    segment_text=segment,
                    viral_score=clip_data.get("viral_score"),
                    clip_type=clip_data.get("clip_type"),
                    title=clip_data.get("title"),
                    explanation=clip_data.get("explanation"),
                    status="pending"
                )
                db.add(clip)
            db.commit()

        return JSONResponse({
            "status": "success",
            "clip_count": len(clips),
            "clips": clips,
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
