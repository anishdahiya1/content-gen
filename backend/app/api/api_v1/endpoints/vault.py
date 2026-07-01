import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# Temporary directory for uploading files to Gemini
TEMP_UPLOAD_DIR = Path("C:/Users/Anish/Desktop/content/storage/temp_vault")
TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class ChatRequest(BaseModel):
    prompt: str
    file_names: List[str]

@router.post("/upload")
async def upload_to_vault(file: UploadFile = File(...)):
    """Uploads a file to Gemini File API."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        # Save file locally temporarily
        temp_path = TEMP_UPLOAD_DIR / file.filename
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"Uploading {file.filename} to Gemini File API...")
        # Upload to Gemini File API
        gemini_file = genai.upload_file(str(temp_path), display_name=file.filename)
        print(f"Uploaded as {gemini_file.name}")
        
        # Clean up local file immediately
        temp_path.unlink(missing_ok=True)
        
        return {
            "status": "success",
            "file": {
                "name": gemini_file.name,
                "display_name": gemini_file.display_name,
                "uri": gemini_file.uri,
                "mime_type": gemini_file.mime_type,
                "state": gemini_file.state.name
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def list_vault_files():
    """Lists all files in the Gemini File API."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    try:
        # Pagination can be added if needed, but for now fetch all
        files = genai.list_files()
        file_list = []
        for f in files:
            file_list.append({
                "name": f.name,
                "display_name": f.display_name,
                "uri": f.uri,
                "mime_type": f.mime_type,
                "state": f.state.name,
                "create_time": f.create_time.isoformat() if f.create_time else None,
                "size_bytes": f.size_bytes
            })
        
        # Sort by latest first
        file_list.sort(key=lambda x: x["create_time"] or "", reverse=True)
        
        return {"files": file_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_name:path}")
async def delete_vault_file(file_name: str):
    """Deletes a file from the Gemini File API."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    try:
        genai.delete_file(file_name)
        return {"status": "success", "message": f"Deleted {file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_with_vault(request: ChatRequest):
    """Chats with Gemini using selected vault files in context."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
    try:
        # Fetch the actual file objects to pass to generation
        gemini_files = []
        for f_name in request.file_names:
            gemini_files.append(genai.get_file(f_name))
            
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Create contents array: Files first, then prompt
        contents = [*gemini_files, request.prompt]
        
        response = model.generate_content(contents)
        
        return {"response": response.text}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
