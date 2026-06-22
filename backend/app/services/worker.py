import os
import threading
import time
import traceback
import uuid
from pathlib import Path
import yt_dlp

from sqlalchemy import select
from app.db.database import SessionLocal
from app.db.models import Job, Video, Transcript, Clip

# Directory for YouTube downloads
DOWNLOADS_DIR = Path(__file__).resolve().parents[3] / "storage" / "uploads"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

class BackgroundWorker:
    def __init__(self):
        self._thread = None
        self._running = False

    def start(self):
        if self._thread is not None and self._thread.is_alive():
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print("★ Background worker thread started successfully.")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self):
        while self._running:
            db = SessionLocal()
            try:
                # Find the oldest pending job using SQLAlchemy 2.0-style select()
                stmt = (
                    select(Job)
                    .where(Job.status == "pending")
                    .order_by(Job.created_at.asc())
                    .limit(1)
                )
                job = db.scalars(stmt).first()
                if job:
                    job.status = "processing"
                    job.progress = 5.0
                    job.message = "Job picked up by worker"
                    db.commit()
                    
                    # Process the job
                    self._process_job(db, job)
                else:
                    # Sleep if no jobs
                    time.sleep(2)
            except Exception as e:
                print(f"Error in worker main loop: {e}")
                time.sleep(2)
            finally:
                db.close()

    def _process_job(self, db, job):
        try:
            if job.job_type == "upload_youtube":
                self._handle_youtube_upload(db, job)
            elif job.job_type == "transcription":
                self._handle_transcription(db, job)
            elif job.job_type == "clip_detection":
                self._handle_clip_detection(db, job)
            elif job.job_type == "clip_rendering":
                self._handle_clip_rendering(db, job)
            elif job.job_type == "full_pipeline":
                self._handle_full_pipeline(db, job)
            elif job.job_type == "audio_download":
                self._handle_audio_download(db, job)
            else:
                raise ValueError(f"Unknown job type: {job.job_type}")
                
            job.status = "completed"
            job.progress = 100.0
            job.message = "Job completed successfully"
            db.commit()
        except Exception as e:
            db.rollback()
            tb = traceback.format_exc()
            job.status = "failed"
            job.error_message = f"{str(e)}\n\n{tb}"
            job.message = f"Error: {str(e)}"
            db.commit()
            print(f"Job {job.id} failed: {e}")

    def _handle_youtube_upload(self, db, job):
        job.message = "Downloading YouTube video..."
        job.progress = 10.0
        db.commit()

        video = db.query(Video).filter(Video.id == job.video_id).first()
        if not video or not video.youtube_url:
            raise ValueError("Invalid video record or missing YouTube URL")

        # Configure yt-dlp to download in 720p or lower to save bandwidth
        ydl_opts = {
            'format': 'best[height<=720]/best',
            'outtmpl': str(DOWNLOADS_DIR / f"{uuid.uuid4().hex}_%(title)s.%(ext)s"),
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video.youtube_url, download=True)
            filename = ydl.prepare_filename(info)
            
            video.saved_path = filename
            video.filename = info.get('title', 'YouTube Video') + "." + info.get('ext', 'mp4')
            video.duration = float(info.get('duration', 0))
            video.size = os.path.getsize(filename) if os.path.exists(filename) else 0
            db.commit()

        job.progress = 100.0
        job.message = "YouTube download completed"
        db.commit()

    def _handle_transcription(self, db, job):
        from app.services.transcription import extract_audio, transcribe_audio, save_transcript

        job.message = "Extracting audio from video..."
        job.progress = 15.0
        db.commit()

        video = db.query(Video).filter(Video.id == job.video_id).first()
        if not video or not video.saved_path or not os.path.exists(video.saved_path):
            raise ValueError(f"Video file not found at path: {video.saved_path if video else 'None'}")

        # Extract audio using FFmpeg
        audio_path = extract_audio(Path(video.saved_path))
        
        job.message = "Transcribing audio..."
        job.progress = 40.0
        db.commit()

        # Transcribe audio (returns tuple: transcript_text, words_json)
        transcript_text, words_json = transcribe_audio(audio_path)
        
        job.message = "Saving transcript..."
        job.progress = 90.0
        db.commit()

        # Save transcript to DB
        transcript = Transcript(
            video_id=video.id,
            raw_text=transcript_text,
            words_json=words_json
        )
        db.add(transcript)
        
        # Save transcript text file locally as backup
        save_transcript(Path(video.saved_path), transcript_text)
        
        # Save the word-level timestamps in a JSON file alongside the video path
        # so clip_generation can load them
        words_file_path = Path(video.saved_path).with_suffix('.json')
        words_file_path.write_text(words_json, encoding='utf-8')
        
        db.commit()

    def _handle_clip_detection(self, db, job):
        from app.services.viral_detection import analyze_transcript_for_clips

        job.message = "Analyzing transcript for viral moments..."
        job.progress = 20.0
        db.commit()

        video = db.query(Video).filter(Video.id == job.video_id).first()
        if not video or not video.transcript:
            raise ValueError("Transcript not found for this video")

        # Run LLM-based clip detection (pass clip_prompt if client set a style brief)
        clips = analyze_transcript_for_clips(
            video.transcript.raw_text,
            num_clips=video.num_clips or 3,
            clip_prompt=video.clip_prompt or None
        )
        
        job.message = "Saving clips..."
        job.progress = 85.0
        db.commit()

        for clip_data in clips:
            import json
            # Robust segment extraction — LLM sometimes uses different key names
            segment = (
                clip_data.get("segment")
                or clip_data.get("segment_text")
                or clip_data.get("transcript_segment")
                or clip_data.get("text")
                or clip_data.get("content")
                or ""
            )
            clip = Clip(
                video_id=video.id,
                start_time=clip_data.get("start_time"),
                end_time=clip_data.get("end_time"),
                segment_text=segment,
                viral_score=clip_data.get("viral_score"),
                clip_type=clip_data.get("clip_type"),
                title=clip_data.get("title"),
                explanation=clip_data.get("explanation"),
                broll_queries=json.dumps(clip_data.get("broll_queries", [])) if clip_data.get("broll_queries") else None,
                status="pending"
            )
            db.add(clip)
        
        db.commit()

    def _handle_clip_rendering(self, db, job):
        from app.services.clip_generation import generate_clips

        job.message = "Rendering vertical short-form clips..."
        job.progress = 10.0
        db.commit()

        video = db.query(Video).filter(Video.id == job.video_id).first()
        if not video:
            raise ValueError("Video record not found")

        # Fetch clips that need rendering (status = pending)
        pending_clips = db.query(Clip).filter(Clip.video_id == video.id, Clip.status == "pending").all()
        if not pending_clips:
            # If no pending clips, render all clips associated with video
            pending_clips = db.query(Clip).filter(Clip.video_id == video.id).all()

        total_clips = len(pending_clips)
        for i, clip in enumerate(pending_clips):
            clip.status = "rendering"
            db.commit()

            job.message = f"Rendering clip {i+1}/{total_clips} (timings: {clip.start_time}s - {clip.end_time}s)..."
            job.progress = 10.0 + (float(i) / total_clips) * 80.0
            db.commit()

            try:
                # Convert clip DB object to dict expected by generate_clips
                import json
                
                branding = {}
                if video.branding_settings:
                    try:
                        branding = json.loads(video.branding_settings)
                    except Exception:
                        pass
                        
                broll_queries = []
                if clip.broll_queries:
                    try:
                        broll_queries = json.loads(clip.broll_queries)
                    except Exception:
                        pass

                clip_dict = {
                    "id": clip.id,
                    "start_time": clip.start_time,
                    "end_time": clip.end_time,
                    "segment": clip.segment_text,
                    "clip_type": clip.clip_type,
                    "viral_score": clip.viral_score,
                    "broll_queries": broll_queries,
                }
                
                # generate_clips renders single clip or a list, let's adapt generate_clips
                result_clips = generate_clips(
                    video_path=video.saved_path, 
                    clips=[clip_dict], 
                    branding_settings=branding, 
                    broll_enabled=video.broll_enabled
                )
                res = result_clips[0] if result_clips else {}
                
                if res.get("status") == "generated":
                    clip.output_path = res.get("path")
                    clip.status = "completed"
                else:
                    clip.status = "failed"
                    clip.error_message = res.get("error", "Unknown rendering error")
            except Exception as e:
                clip.status = "failed"
                clip.error_message = str(e)
            
            db.commit()

    def _handle_full_pipeline(self, db, job):
        # 1. Download YouTube URL if required
        video = db.query(Video).filter(Video.id == job.video_id).first()
        if video and video.youtube_url and (not video.saved_path or not os.path.exists(video.saved_path)):
            self._handle_youtube_upload(db, job)
            # Reload video details
            video = db.query(Video).filter(Video.id == job.video_id).first()

        # 2. Transcription
        job.progress = 20.0
        self._handle_transcription(db, job)

        # 3. Clip detection
        job.progress = 60.0
        self._handle_clip_detection(db, job)

        # 4. Rendering
        job.progress = 80.0
        self._handle_clip_rendering(db, job)


    def _handle_audio_download(self, db, job):
        """Download audio-only from YouTube URL using yt-dlp."""
        job.message = "Extracting audio from YouTube video..."
        job.progress = 10.0
        db.commit()

        video = db.query(Video).filter(Video.id == job.video_id).first()
        if not video or not video.youtube_url:
            raise ValueError("Invalid video record or missing YouTube URL")

        # Configure yt-dlp for audio-only extraction (best audio → MP3)
        output_template = str(DOWNLOADS_DIR / f"{uuid.uuid4().hex}_%(title)s.%(ext)s")
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }

        job.message = "Downloading and converting audio to MP3..."
        job.progress = 30.0
        db.commit()

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video.youtube_url, download=True)
            # yt-dlp post-processor changes extension to mp3
            raw_filename = ydl.prepare_filename(info)
            # The actual file will have .mp3 extension after post-processing
            audio_filename = Path(raw_filename).with_suffix('.mp3')
            if not audio_filename.exists():
                # Fallback: try the original filename (some formats don't change)
                audio_filename = Path(raw_filename)

            video.saved_path = str(audio_filename)
            video.filename = info.get('title', 'YouTube Audio') + ".mp3"
            video.duration = float(info.get('duration', 0))
            video.size = os.path.getsize(str(audio_filename)) if audio_filename.exists() else 0
            db.commit()

        job.progress = 100.0
        job.message = "Audio extraction completed"
        db.commit()


# Global instance
worker = BackgroundWorker()
