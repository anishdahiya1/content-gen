from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import BrandDocument, User, Video
from app.api.api_v1.endpoints.auth import get_current_user
from app.services.rag_service import RAGService

router = APIRouter()

class ChatRequest(BaseModel):
    video_id: int
    message: str
    chat_history: Optional[List[Dict[str, str]]] = []

@router.post("/rag/upload")
async def upload_brand_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    try:
        contents = await file.read()
        text_content = contents.decode("utf-8", errors="replace")
        
        doc = await RAGService.add_document(db, file.filename, text_content, user_id=current_user.id)
        
        return JSONResponse({
            "status": "success",
            "document_id": doc.id,
            "filename": doc.filename,
            "message": f"Successfully uploaded and embedded {doc.filename}"
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(exc)}")

@router.get("/rag/documents")
def get_brand_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    docs = db.query(BrandDocument).filter(BrandDocument.user_id == current_user.id).all()
    return JSONResponse({
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in docs
        ]
    })

@router.post("/rag/chat")
async def chat_with_video_context(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> JSONResponse:
    # Verify video ownership
    video = db.query(Video).filter(Video.id == request.video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=403, detail="Access denied to this video context")
        
    try:
        reply = await RAGService.chat_with_video(
            db=db,
            video_id=request.video_id,
            query=request.message,
            chat_history=request.chat_history or []
        )
        return JSONResponse({
            "status": "success",
            "reply": reply
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(exc)}")
