from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Video, Transcript, Clip
from app.services.transcription import extract_audio, save_transcript, transcribe_audio, transliterate_text_and_words

router = APIRouter()

@router.post("/transcribe")
async def transcribe_video(file_path: str, db: Session = Depends(get_db)) -> JSONResponse:
    video_path = Path(file_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    try:
        # 1. Extract audio
        audio_path = extract_audio(video_path)
        
        # 2. Call transcription (returns full text + word timestamps JSON)
        transcript_text, words_json = transcribe_audio(audio_path)
        
        # 3. Save txt backup file
        transcript_path = save_transcript(video_path, transcript_text)

        # 4. Check if video exists in DB, link or create video record
        video = db.query(Video).filter(Video.saved_path == str(video_path)).first()
        if not video:
            video = Video(
                filename=video_path.name,
                saved_path=str(video_path),
                size=video_path.stat().st_size if video_path.exists() else 0
            )
            db.add(video)
            db.commit()
            db.refresh(video)

        # Save transcript to DB if not exists
        db_transcript = db.query(Transcript).filter(Transcript.video_id == video.id).first()
        if db_transcript:
            db_transcript.raw_text = transcript_text
            db_transcript.words_json = words_json
        else:
            db_transcript = Transcript(
                video_id=video.id,
                raw_text=transcript_text,
                words_json=words_json
            )
            db.add(db_transcript)
        
        db.commit()

        # Save the word-level timestamps in a JSON file alongside the video path
        # so clip_generation can load them
        words_file_path = video_path.with_suffix('.json')
        words_file_path.write_text(words_json, encoding='utf-8')

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return JSONResponse(
        {
            "video_id": video.id,
            "video_path": str(video_path),
            "audio_path": str(audio_path),
            "transcript_path": str(transcript_path),
            "transcript": transcript_text,
        }
    )


class TransliterateRequest(BaseModel):
    target: str  # 'hinglish' or 'hindi'


@router.post("/videos/{video_id}/transliterate")
async def transliterate_transcript(video_id: int, request: TransliterateRequest, db: Session = Depends(get_db)) -> JSONResponse:
    import json
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")
    if not video.transcript:
        raise HTTPException(status_code=400, detail="Transcript not found for this video")

    target = request.target.lower().strip()
    if target not in ["hinglish", "hindi"]:
        raise HTTPException(status_code=400, detail="Target format must be 'hinglish' or 'hindi'")

    try:
        raw_text = video.transcript.raw_text
        words_json = video.transcript.words_json or "[]"

        # Call transliteration service
        new_text, new_words_json = await transliterate_text_and_words(raw_text, words_json, target)

        # Update database
        video.transcript.raw_text = new_text
        video.transcript.words_json = new_words_json
        db.commit()

        # Transliterate and reset clips
        from app.services.ai_manager import AIManager
        clips = db.query(Clip).filter(Clip.video_id == video.id).all()
        if clips:
            clips_data = []
            for clip in clips:
                clips_data.append({
                    "id": clip.id,
                    "title": clip.title or "",
                    "segment_text": clip.segment_text or "",
                    "explanation": clip.explanation or ""
                })
                
            system_instruction_clips = f"You are an expert linguist specializing in converting {'Hindi Devanagari script to Hinglish (Latin alphabet)' if target == 'hinglish' else 'Hinglish to Hindi Devanagari script'}."
            
            prompt_clips = (
                f"You are given a JSON object containing a 'clips' key with an array of clip objects. Transliterate the 'title', 'segment_text', and 'explanation' fields of each object "
                f"to {'Hinglish (Latin alphabet)' if target == 'hinglish' else 'Hindi Devanagari script'}.\n"
                "Do NOT translate the text to English. Maintain 1-to-1 mapping. Return a JSON object with a 'clips' key containing the transliterated clip objects in the exact same length and structure.\n\n"
                f"Input JSON:\n{json.dumps({'clips': clips_data})}"
            )
            
            try:
                new_clips_json = await AIManager.generate_text(
                    prompt=prompt_clips,
                    system_instruction=system_instruction_clips,
                    json_mode=True,
                    preferred_provider="gemini"
                )
                
                clean_clips_json = new_clips_json.strip()
                if clean_clips_json.startswith("```"):
                    lines = clean_clips_json.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    clean_clips_json = "\n".join(lines).strip()
                    
                new_clips_list = json.loads(clean_clips_json)
                if isinstance(new_clips_list, dict):
                    # Unpack list if wrapped
                    if "clips" in new_clips_list and isinstance(new_clips_list["clips"], list):
                        new_clips_list = new_clips_list["clips"]
                    else:
                        for val in new_clips_list.values():
                            if isinstance(val, list):
                                new_clips_list = val
                                break
                            
                if isinstance(new_clips_list, list) and len(new_clips_list) == len(clips):
                    for i, clip in enumerate(clips):
                        clip_match = new_clips_list[i]
                        clip.title = clip_match.get("title", clip.title)
                        clip.segment_text = clip_match.get("segment_text", clip.segment_text)
                        clip.explanation = clip_match.get("explanation", clip.explanation)
                        clip.status = "pending"
                        clip.output_path = None
                    db.commit()
                else:
                    print(f"Warning: Transliterated clips count mismatch. Expected {len(clips)}, got {len(new_clips_list) if isinstance(new_clips_list, list) else 'non-list'}")
                    # Fallback status reset
                    for clip in clips:
                        clip.status = "pending"
                        clip.output_path = None
                    db.commit()
            except Exception as e:
                print(f"Clips transliteration failed: {e}")
                # Fallback status reset
                for clip in clips:
                    clip.status = "pending"
                    clip.output_path = None
                db.commit()

        # Update local files (.txt backup and .json word timestamps)
        if video.saved_path:
            video_path = Path(video.saved_path)
            # Rewrite .txt backup
            save_transcript(video_path, new_text)
            # Rewrite .json timestamps
            words_file_path = video_path.with_suffix('.json')
            words_file_path.write_text(new_words_json, encoding='utf-8')

        return JSONResponse({
            "status": "success",
            "message": f"Successfully transliterated transcript to {target}",
            "transcript": {
                "id": video.transcript.id,
                "raw_text": new_text,
                "words": json.loads(new_words_json) if new_words_json else []
            }
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

