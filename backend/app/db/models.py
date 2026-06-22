from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    saved_path = Column(String)
    youtube_url = Column(String, nullable=True)
    duration = Column(Float, nullable=True)
    size = Column(Integer, nullable=True)
    audio_only = Column(Boolean, default=False)
    branding_settings = Column(Text, nullable=True)  # JSON string: {font, color, position, watermark_path}
    broll_enabled = Column(Boolean, default=False)
    num_clips = Column(Integer, default=3)
    clip_prompt = Column(Text, nullable=True)  # Optional client brief to guide AI clip style selection
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="videos")
    transcript = relationship("Transcript", back_populates="video", uselist=False, cascade="all, delete-orphan")
    clips = relationship("Clip", back_populates="video", cascade="all, delete-orphan")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), unique=True)
    raw_text = Column(Text)
    words_json = Column(Text, nullable=True)  # Store word-level timestamps metadata as a JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    video = relationship("Video", back_populates="transcript")

class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"))
    start_time = Column(Float)
    end_time = Column(Float)
    segment_text = Column(Text)
    viral_score = Column(Float)
    clip_type = Column(String)  # hook, educational, storytelling, emotional
    title = Column(String, nullable=True)
    explanation = Column(Text, nullable=True)
    broll_queries = Column(Text, nullable=True)  # JSON string of b-roll search queries and timings
    output_path = Column(String, nullable=True)  # Path to generated 9:16 vertical video
    status = Column(String, default="pending")  # pending, rendering, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    video = relationship("Video", back_populates="clips")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)  # UUID string
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="SET NULL"), nullable=True)
    job_type = Column(String)  # upload, transcription, clip_detection, clip_rendering, full_pipeline
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0 to 100
    message = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BrandDocument(Base):
    __tablename__ = "brand_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String, index=True)
    content = Column(Text)
    embedding_json = Column(Text, nullable=True)  # Vector representation as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="brand_documents")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    videos = relationship("Video", back_populates="user", cascade="all, delete-orphan")
    brand_documents = relationship("BrandDocument", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)  # UUID string
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="sessions")
