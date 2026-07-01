import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import JSONResponse

from app.services.text_to_video import generate_series_pipeline

router = APIRouter()

# Simple in-memory job store for generative jobs
generative_jobs: Dict[str, Dict[str, Any]] = {}

class GenerateSeriesRequest(BaseModel):
    topic: str
    language: str = "english"

async def process_generate_series(job_id: str, topic: str, language: str):
    try:
        generative_jobs[job_id]["status"] = "processing"
        generative_jobs[job_id]["message"] = "Generating script, audio, and visuals..."
        
        output_path = await generate_series_pipeline(topic, job_id, language)
        
        generative_jobs[job_id]["status"] = "completed"
        generative_jobs[job_id]["output_path"] = output_path
        generative_jobs[job_id]["message"] = "Series generated successfully!"
        
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"Error in generative pipeline: {e}\n{tb}")
        generative_jobs[job_id]["status"] = "failed"
        generative_jobs[job_id]["error"] = str(e)


@router.post("/generate-series")
async def start_series_generation(request: GenerateSeriesRequest, background_tasks: BackgroundTasks) -> JSONResponse:
    if not request.topic or len(request.topic.strip()) < 3:
        raise HTTPException(status_code=400, detail="A valid topic must be provided")
        
    job_id = str(uuid.uuid4())
    generative_jobs[job_id] = {
        "id": job_id,
        "topic": request.topic,
        "language": request.language,
        "status": "pending",
        "output_path": None,
        "error": None,
        "message": "Queued"
    }
    
    background_tasks.add_task(process_generate_series, job_id, request.topic, request.language)
    
    return JSONResponse({
        "status": "success",
        "job_id": job_id,
        "message": "Series generation started"
    })

@router.get("/generate-series/{job_id}")
async def get_series_job_status(job_id: str) -> JSONResponse:
    job = generative_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return JSONResponse(job)

from fastapi.responses import FileResponse
from app.services.text_to_video import GENERATIVE_DIR

@router.get("/generate-series/{job_id}/video")
async def get_series_video(job_id: str):
    file_path = GENERATIVE_DIR / job_id / f"{job_id}_final.mp4"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(path=file_path, media_type="video/mp4", filename=f"{job_id}_final.mp4")
