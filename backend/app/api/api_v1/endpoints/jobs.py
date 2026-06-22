from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Job, User, Video
from app.api.api_v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/jobs")
def get_all_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    jobs = db.query(Job).join(Video).filter(Video.user_id == current_user.id).order_by(Job.created_at.desc()).limit(20).all()
    return JSONResponse({
        "jobs": [
            {
                "id": j.id,
                "video_id": j.video_id,
                "job_type": j.job_type,
                "status": j.status,
                "progress": j.progress,
                "message": j.message,
                "error_message": j.error_message,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "updated_at": j.updated_at.isoformat() if j.updated_at else None,
            }
            for j in jobs
        ]
    })

@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    job = db.query(Job).join(Video).filter(Job.id == job_id, Video.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return JSONResponse({
        "id": job.id,
        "video_id": job.video_id,
        "job_type": job.job_type,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    })
