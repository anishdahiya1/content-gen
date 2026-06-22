import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import Video, Job, User
from app.api.api_v1.endpoints.auth import get_current_user
from app.services.storage import save_upload
from app.services.worker import worker
from pydantic import BaseModel

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "video/ogg",
    "video/webm",
}

class YouTubeRequest(BaseModel):
    url: str
    audio_only: bool = False
    num_clips: int = 3
    clip_prompt: Optional[str] = None  # Optional client brief for clip style

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    num_clips: int = Form(3),
    clip_prompt: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    try:
        # Save file to storage
        contents = await file.read()
        saved_path = save_upload(contents, file.filename)
        
        # Save video record to database
        video = Video(
            filename=file.filename,
            saved_path=str(saved_path),
            size=len(contents),
            num_clips=num_clips,
            clip_prompt=clip_prompt or None,
            user_id=current_user.id
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # Create full_pipeline background job (transcription + clip detection)
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            video_id=video.id,
            job_type="full_pipeline",
            status="pending",
            message="Enqueueing video for processing..."
        )
        db.add(job)
        db.commit()
        
        # Start background worker thread if not running
        worker.start()

        return JSONResponse(
            {
                "status": "success",
                "video_id": video.id,
                "job_id": job_id,
                "filename": file.filename,
                "saved_path": str(saved_path),
                "size": len(contents),
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

@router.post("/upload/youtube")
async def upload_youtube(
    request: YouTubeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    url = request.url.strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        # Create video record with empty path (will be set by downloader)
        video = Video(
            filename="YouTube Video",
            youtube_url=url,
            saved_path="",
            audio_only=request.audio_only,
            num_clips=request.num_clips,
            clip_prompt=request.clip_prompt or None,
            user_id=current_user.id
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # Create full_pipeline job (or audio_download job)
        job_id = str(uuid.uuid4())
        job_type = "audio_download" if request.audio_only else "full_pipeline"
        job = Job(
            id=job_id,
            video_id=video.id,
            job_type=job_type,
            status="pending",
            message="Enqueueing YouTube link for audio extraction..." if request.audio_only else "Enqueueing YouTube link for download and processing..."
        )
        db.add(job)
        db.commit()
        
        # Trigger background worker
        worker.start()

        return JSONResponse({
            "status": "success",
            "video_id": video.id,
            "job_id": job_id,
            "message": "YouTube processing queued successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube queue failed: {str(e)}")

@router.get("/videos/{video_id}")
def get_video_details(
    video_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")

    import json
    # Format transcript
    transcript_data = None
    if video.transcript:
        words = []
        if video.transcript.words_json:
            try:
                words = json.loads(video.transcript.words_json)
            except Exception:
                pass
        transcript_data = {
            "id": video.transcript.id,
            "raw_text": video.transcript.raw_text,
            "words": words
        }

    # Format clips — include transcript words that fall within each clip's time range
    all_words = []
    if transcript_data and transcript_data.get("words"):
        all_words = transcript_data["words"]

    clips_data = []
    for c in video.clips:
        # Filter transcript words that fall within this clip's time window
        clip_words = [
            w for w in all_words
            if isinstance(w, dict)
            and w.get("start") is not None
            and w.get("end") is not None
            and float(w["start"]) >= (c.start_time or 0)
            and float(w["end"]) <= (c.end_time or 99999)
        ]
        clips_data.append({
            "id": c.id,
            "start_time": c.start_time,
            "end_time": c.end_time,
            "duration": round((c.end_time or 0) - (c.start_time or 0), 2) if c.start_time and c.end_time else None,
            "segment_text": c.segment_text,
            "viral_score": c.viral_score,
            "clip_type": c.clip_type,
            "title": c.title,
            "explanation": c.explanation,
            "output_path": c.output_path,
            "status": c.status,
            "error_message": c.error_message,
            "words": clip_words,
        })

    import json
    branding_settings = {}
    if video.branding_settings:
        try:
            branding_settings = json.loads(video.branding_settings)
        except Exception:
            pass

    return JSONResponse({
        "id": video.id,
        "filename": video.filename,
        "saved_path": video.saved_path,
        "youtube_url": video.youtube_url,
        "duration": video.duration,
        "size": video.size,
        "audio_only": video.audio_only,
        "num_clips": video.num_clips,
        "clip_prompt": video.clip_prompt,
        "branding_settings": branding_settings,
        "broll_enabled": video.broll_enabled,
        "created_at": video.created_at.isoformat() if video.created_at else None,
        "transcript": transcript_data,
        "clips": clips_data,
    })

@router.get("/videos/{video_id}/download")
def download_video_file(
    video_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download the saved video or audio file for a given video record."""
    import os
    from fastapi.responses import FileResponse

    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")
    if not video.saved_path or not os.path.exists(video.saved_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=video.saved_path,
        filename=video.filename,
        media_type="audio/mpeg" if video.audio_only else "video/mp4",
    )

class VideoSettingsUpdate(BaseModel):
    branding_settings: dict = None
    broll_enabled: bool = False

@router.put("/videos/{video_id}/settings")
async def update_video_settings(
    video_id: int, 
    settings: VideoSettingsUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    import json
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")
    
    if settings.branding_settings is not None:
        video.branding_settings = json.dumps(settings.branding_settings)
    
    video.broll_enabled = settings.broll_enabled
    db.commit()
    
    return JSONResponse({"status": "success", "message": "Settings updated"})

@router.post("/upload/watermark")
async def upload_watermark(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    import os
    from pathlib import Path
    
    ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg"}
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type. Use PNG or JPEG.")

    # Save to storage/watermarks
    STORAGE_DIR = Path(__file__).resolve().parents[4] / "storage"
    WATERMARKS_DIR = STORAGE_DIR / "watermarks"
    WATERMARKS_DIR.mkdir(parents=True, exist_ok=True)
    
    file_path = WATERMARKS_DIR / file.filename
    contents = await file.read()
    
    with open(file_path, "wb") as f:
        f.write(contents)
        
    return JSONResponse({
        "status": "success",
        "path": str(file_path),
        "url": f"/storage/watermarks/{file.filename}"
    })
