import os
import uuid
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import User, Session as UserSession

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

class TokenInfoRequest(BaseModel):
    id_token: str

def get_current_user(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
) -> User:
    # ── Auth toggle ────────────────────────────────────────────────────────────
    # When REQUIRE_AUTH=false in .env, skip all token checks and return a
    # synthetic "dev" user (created on first call, reused thereafter).
    require_auth = os.getenv("REQUIRE_AUTH", "true").strip().lower()
    if require_auth == "false":
        dev_user = db.query(User).filter(User.email == "dev@localhost").first()
        if not dev_user:
            dev_user = User(
                google_id="dev-bypass-user",
                email="dev@localhost",
                name="Dev User (Auth Disabled)",
                picture=None,
            )
            db.add(dev_user)
            db.commit()
            db.refresh(dev_user)
        return dev_user
    # ── Normal auth ────────────────────────────────────────────────────────────
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid"
        )
    
    token = authorization.split(" ")[1].strip()
    
    # Query active session
    session_record = db.query(UserSession).filter(
        UserSession.id == token,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    if not session_record or not session_record.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
        
    return session_record.user

@router.post("/auth/google")
async def authenticate_google(
    request: TokenInfoRequest,
    db: Session = Depends(get_db)
) -> JSONResponse:
    id_token = request.id_token.strip()
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token is required")
        
    # Validate token using Google's tokeninfo API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=10.0
            )
            
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google ID token")
            
        token_data = response.json()
        
        # Verify audience/client_id if configured
        aud = token_data.get("aud")
        if GOOGLE_CLIENT_ID and aud != GOOGLE_CLIENT_ID:
            if aud not in [GOOGLE_CLIENT_ID]:
                raise HTTPException(status_code=401, detail="Client ID audience mismatch")
                
        google_id = token_data.get("sub")
        email = token_data.get("email")
        name = token_data.get("name")
        picture = token_data.get("picture")
        
        if not google_id or not email:
            raise HTTPException(status_code=400, detail="Missing user identifiers from Google token")
            
        # Get or create User
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user:
            # Check by email to link accounts
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Update google_id
                user.google_id = google_id
            else:
                user = User(
                    google_id=google_id,
                    email=email,
                    name=name,
                    picture=picture
                )
                db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update user profile information if changed
            updated = False
            if user.name != name:
                user.name = name
                updated = True
            if user.picture != picture:
                user.picture = picture
                updated = True
            if updated:
                db.commit()
                db.refresh(user)
                
        # Spawn database session
        session_id = str(uuid.uuid4())
        expiry = datetime.utcnow() + timedelta(days=7)
        
        db_session = UserSession(
            id=session_id,
            user_id=user.id,
            expires_at=expiry
        )
        db.add(db_session)
        db.commit()
        
        return JSONResponse({
            "status": "success",
            "token": session_id,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture
            }
        })
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")

@router.post("/auth/logout")
async def logout(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> JSONResponse:
    if not authorization or not authorization.startswith("Bearer "):
        return JSONResponse({"status": "success", "message": "Already logged out"})
        
    token = authorization.split(" ")[1].strip()
    session_record = db.query(UserSession).filter(UserSession.id == token).first()
    if session_record:
        db.delete(session_record)
        db.commit()
        
    return JSONResponse({"status": "success", "message": "Successfully logged out"})
