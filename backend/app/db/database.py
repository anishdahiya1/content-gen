import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to SQLite local database in parent folder of app
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./creatorpilot.db")

# SQLite needs connect_args for multithreading
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models here to register them with Base before creating tables
    from app.db.models import Video, Transcript, Clip, Job, BrandDocument, User, Session
    Base.metadata.create_all(bind=engine)

    # Lightweight migration: add new columns to existing tables
    # (SQLAlchemy create_all doesn't alter existing tables)
    from sqlalchemy import text, inspect
    inspector = inspect(engine)
    if "videos" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("videos")]
        with engine.connect() as conn:
            if "audio_only" not in columns:
                conn.execute(text("ALTER TABLE videos ADD COLUMN audio_only BOOLEAN DEFAULT 0"))
            if "branding_settings" not in columns:
                conn.execute(text("ALTER TABLE videos ADD COLUMN branding_settings TEXT"))
            if "broll_enabled" not in columns:
                conn.execute(text("ALTER TABLE videos ADD COLUMN broll_enabled BOOLEAN DEFAULT 0"))
            if "num_clips" not in columns:
                conn.execute(text("ALTER TABLE videos ADD COLUMN num_clips INTEGER DEFAULT 3"))
            if "clip_prompt" not in columns:
                conn.execute(text("ALTER TABLE videos ADD COLUMN clip_prompt TEXT"))
            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE videos ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"))
            conn.commit()
            
    if "clips" in inspector.get_table_names():
        clip_columns = [col["name"] for col in inspector.get_columns("clips")]
        if "broll_queries" not in clip_columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE clips ADD COLUMN broll_queries TEXT"))
                conn.commit()

    if "brand_documents" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("brand_documents")]
        with engine.connect() as conn:
            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE brand_documents ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"))
            conn.commit()
