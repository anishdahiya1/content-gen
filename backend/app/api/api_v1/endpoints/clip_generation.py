import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Video, Clip
from app.services.clip_generation import generate_clips

router = APIRouter()


class ClipData(BaseModel):
    """Clip definition with timestamps and metadata."""
    start_time: float
    end_time: float
    segment: str
    viral_score: float
    clip_type: str


class GenerateClipsRequest(BaseModel):
    """Request to generate clips."""
    video_path: str
    clips: List[ClipData]


@router.post("/generate-clips")
async def create_clips(request: GenerateClipsRequest, db: Session = Depends(get_db)) -> JSONResponse:
    """
    Generate vertical (9:16) short-form clips from source video.
    
    Takes video path and clip definitions with timestamps, extracts each segment,
    scales to vertical format, burns subtitles, and adds fade transitions.
    
    Args:
        request: Contains video_path and list of clip definitions
        db: Database session
    
    Returns:
        JSON with status, clips_generated count, and list of generated clip metadata
    """
    # Verify video file exists
    video_path_str = str(Path(request.video_path).resolve())
    video = Path(video_path_str)
    if not video.exists():
        raise HTTPException(status_code=404, detail=f"Video file not found: {request.video_path}")

    try:
        if not request.clips or len(request.clips) == 0:
            raise HTTPException(status_code=400, detail="No clips data provided")
        
        # Convert Pydantic models to dicts
        clips_list = [clip.dict() for clip in request.clips]
        
        # Generate clips using FFmpeg
        generated = generate_clips(request.video_path, clips_list)
        
        # Count successful vs failed
        successful = [c for c in generated if c.get("status") == "generated"]
        failed = [c for c in generated if c.get("status") == "failed"]
        
        # Update database statuses for successfully generated clips
        # We match video by saved_path (standardized to match resolved/standard path)
        db_video = db.query(Video).filter(
            (Video.saved_path == request.video_path) |
            (Video.saved_path == video_path_str)
        ).first()
        
        if db_video:
            for idx, g in enumerate(generated):
                if g.get("status") == "generated":
                    c_data = clips_list[idx]
                    # Find matching clip in DB by video_id and start_time (allowing small tolerance)
                    db_clip = db.query(Clip).filter(
                        Clip.video_id == db_video.id,
                        Clip.start_time >= c_data["start_time"] - 0.1,
                        Clip.start_time <= c_data["start_time"] + 0.1
                    ).first()
                    
                    if db_clip:
                        db_clip.status = "completed"
                        db_clip.output_path = g.get("path")
            db.commit()
        
        return JSONResponse({
            "status": "success",
            "clips_generated": len(successful),
            "clips_failed": len(failed),
            "clips": generated,
            "message": f"Generated {len(successful)} clip(s)" + (f", {len(failed)} failed" if failed else "")
        })
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Clip generation error: {str(exc)}")


@router.post("/videos/{video_id}/create-full-clip")
async def create_full_clip(video_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """
    Creates a Clip record representing the full video duration.
    This allows the frontend to trigger standard FFmpeg rendering for the whole video.
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    duration = video.duration
    # Fallback duration if not set in DB
    if not duration or duration <= 0:
        duration = 60.0 # Default fallback, ideally shouldn't happen
        
    # Check if a full video clip already exists
    existing_clip = db.query(Clip).filter(
        Clip.video_id == video_id,
        Clip.clip_type == "full_video"
    ).first()
    
    if existing_clip:
        # Just reset status to pending so it can be re-rendered
        existing_clip.status = "pending"
        db.commit()
        return JSONResponse({
            "status": "success",
            "clip_id": existing_clip.id,
            "message": "Existing full video clip found and reset"
        })
        
    # Create new clip
    new_clip = Clip(
        video_id=video_id,
        start_time=0.0,
        end_time=duration,
        segment_text="Full video transcription.",
        viral_score=100.0,
        clip_type="full_video",
        title="Full Video Reel",
        explanation="The entire video formatted as a vertical reel.",
        status="pending"
    )
    
    db.add(new_clip)
    db.commit()
    db.refresh(new_clip)
    
    return JSONResponse({
        "status": "success",
        "clip_id": new_clip.id,
        "message": "Full video clip created successfully"
    })

