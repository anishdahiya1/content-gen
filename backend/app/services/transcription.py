import os
import base64
import json
import subprocess
import re
import asyncio
import threading
from pathlib import Path
from typing import Tuple, List, Dict, Any
import httpx
from dotenv import load_dotenv

load_dotenv()

TRANSCRIPTIONS_DIR = Path(__file__).resolve().parents[1] / '..' / '..' / 'storage' / 'transcriptions'
TRANSCRIPTIONS_DIR = TRANSCRIPTIONS_DIR.resolve()
TRANSCRIPTIONS_DIR.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def extract_audio(video_path: Path) -> Path:
    """Extract mono 16kHz audio from video using FFmpeg. Returns path to MP3."""
    audio_path = video_path.with_suffix('.mp3')
    command = [
        'ffmpeg', '-y', '-i', str(video_path),
        '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k',
        str(audio_path),
    ]
    try:
        subprocess.run(command, check=True, capture_output=True)
    except FileNotFoundError as fnf:
        raise RuntimeError("ffmpeg not found. Please install ffmpeg and ensure it's on PATH.") from fnf
    except subprocess.CalledProcessError as cpe:
        stderr = cpe.stderr.decode('utf-8', errors='replace') if cpe.stderr else ''
        raise RuntimeError(f"ffmpeg failed: {stderr}") from cpe
    return audio_path


def interpolate_word_timestamps(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Interpolate word-level timestamps evenly across each segment."""
    words_list = []
    for segment in segments:
        start = float(segment.get("start", 0))
        end = float(segment.get("end", 0))
        text = segment.get("text", "").strip()
        words = text.split()
        if not words:
            continue
        duration = end - start
        word_dur = duration / len(words)
        for i, word in enumerate(words):
            clean = word.strip(".,?!:;()[]{}<>\"'/\\-*_“”‘’।॥")
            words_list.append({
                "word": clean,
                "start": round(start + i * word_dur, 2),
                "end": round(start + (i + 1) * word_dur, 2),
            })
    return words_list


def _transcribe_local_whisper(audio_path: Path) -> Tuple[str, str]:
    """
    Transcribe locally using faster-whisper (no API key required).
    Downloads the 'base' model (~145 MB) on first run and caches it.
    Uses CPU by default, or GPU if CUDA is available.
    """
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError:
        raise ImportError(
            "faster-whisper is not installed. "
            "Run: pip install faster-whisper"
        )

    print("★ Transcribing locally with faster-whisper (base model, CPU)...")
    print("  → First run will download ~145 MB model — please wait...")

    # Use 'base' model for a good speed/accuracy trade-off on CPU.
    # 'tiny' is faster but less accurate. 'small' is better but slower.
    model = WhisperModel("base", device="cpu", compute_type="int8")

    segments_gen, info = model.transcribe(
        str(audio_path),
        beam_size=5,
        word_timestamps=True,   # enables per-word timestamps
        language=None,           # auto-detect language
    )

    full_text_parts = []
    words_list = []

    for segment in segments_gen:
        seg_text = segment.text.strip()
        full_text_parts.append(seg_text)

        # faster-whisper returns word-level objects when word_timestamps=True
        if segment.words:
            for w in segment.words:
                clean = w.word.strip(".,?!:;()[]{}<>\"'/\\-*_“”‘’।॥")
                if clean:
                    words_list.append({
                        "word": clean,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                    })
        else:
            # Fallback: interpolate from segment boundaries
            words = seg_text.split()
            if words:
                duration = segment.end - segment.start
                word_dur = duration / len(words)
                for i, word in enumerate(words):
                    clean = word.strip(".,?!:;()[]{}<>\"'/\\-*_“”‘’।॥")
                    words_list.append({
                        "word": clean,
                        "start": round(segment.start + i * word_dur, 2),
                        "end": round(segment.start + (i + 1) * word_dur, 2),
                    })

    full_text = " ".join(full_text_parts)
    print(f"★ Local Whisper transcription complete. {len(words_list)} words, language: {info.language}")
    return full_text, json.dumps(words_list)


def transcribe_audio(audio_path: Path) -> Tuple[str, str]:
    """
    Transcribe audio file. Priority chain:
      1. Groq Whisper API (fastest, free tier available)
      2. Gemini Audio API (good quality, free tier)
      3. faster-whisper local model (no API key, CPU-based)
      4. Mock placeholder (offline fallback with fake text)

    Returns:
        Tuple[str, str]: (transcript_text, words_json_string)
    """
    # ── 1. Groq Whisper (cloud, free tier) ──────────────────────────────────
    if GROQ_API_KEY:
        try:
            print("★ Transcribing with Groq Whisper API...")
            url = "https://api.groq.com/openai/v1/audio/transcriptions"
            headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
            with open(audio_path, "rb") as f:
                files = {
                    "file": (audio_path.name, f, "audio/mpeg"),
                    "model": (None, "whisper-large-v3"),
                    "response_format": (None, "verbose_json"),
                    "temperature": (None, "0.0"),
                    "timestamp_granularities[]": (None, "word")
                }
                response = httpx.post(url, headers=headers, files=files, timeout=180.0)
                response.raise_for_status()
                data = response.json()
            text = data.get("text", "")
            
            # Check if Groq returned native word-level timestamps
            if "words" in data and data["words"]:
                raw_words = data["words"]
                words = []
                for w in raw_words:
                    clean = w.get("word", "").strip(".,?!:;()[]{}<>\"'/\\-*_“”‘’।॥")
                    if clean:
                        words.append({
                            "word": clean,
                            "start": round(float(w.get("start", 0)), 2),
                            "end": round(float(w.get("end", 0)), 2)
                        })
            else:
                segments = data.get("segments", [])
                words = interpolate_word_timestamps(segments)
                
            print(f"★ Groq transcription complete. {len(words)} words.")
            return text, json.dumps(words)
        except Exception as e:
            print(f"Groq transcription failed: {e}. Falling back...")

    # ── 2. Gemini Audio API (cloud, free tier) ───────────────────────────────
    if GEMINI_API_KEY:
        try:
            print("★ Transcribing with Gemini Audio API...")
            file_size = audio_path.stat().st_size
            if file_size < 19 * 1024 * 1024:
                with open(audio_path, "rb") as f:
                    audio_b64 = base64.b64encode(f.read()).decode("utf-8")
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/"
                    f"models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
                )
                prompt = (
                    "Please transcribe this audio file exactly in the native language it is spoken. "
                    "Do NOT translate the spoken text. If the audio is in Hindi, transcribe it in Devanagari script (e.g. 'नमस्ते', 'आप कैसे हो') "
                    "rather than translating to English or using English letters (Hinglish). "
                    "Return a JSON object with two fields:\n"
                    "1. 'text': The full verbatim transcription string.\n"
                    "2. 'words': A list of objects, each containing:\n"
                    "   - 'word' (string): the individual word\n"
                    "   - 'start' (float): start time in seconds\n"
                    "   - 'end' (float): end time in seconds\n"
                    "Output ONLY valid JSON. No markdown, no backticks, no comments."
                )
                payload = {
                    "contents": [{
                        "parts": [
                            {"inlineData": {"mimeType": "audio/mp3", "data": audio_b64}},
                            {"text": prompt},
                        ]
                    }],
                    "systemInstruction": {
                        "parts": [{"text": "You are a professional audio transcriber. Your task is to provide extremely accurate, verbatim word-level transcription with precise timestamps."}]
                    },
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.0
                    },
                }
                import time
                max_attempts = 5
                for attempt in range(max_attempts):
                    try:
                        response = httpx.post(url, json=payload, timeout=180.0)
                        response.raise_for_status()
                        break
                    except Exception as exc:
                        err_msg = str(exc).lower()
                        status_code = getattr(getattr(exc, "response", None), "status_code", None)
                        response_text = ""
                        try:
                            response_text = exc.response.text.lower()
                        except Exception:
                            pass
                        is_rate_limit = (
                            status_code == 429
                            or "429" in err_msg
                            or "too many requests" in err_msg
                            or "rate limit" in err_msg
                            or "quota" in err_msg
                            or "exhausted" in err_msg
                            or "too many requests" in response_text
                            or "rate limit" in response_text
                            or "quota" in response_text
                            or "exhausted" in response_text
                        )
                        if is_rate_limit:
                            print(f"★ Gemini audio transcription rate limited/quota exceeded ({status_code}). Skipping retries...")
                            raise exc
                        if attempt < max_attempts - 1:
                            print(f"★ Gemini audio transcription attempt {attempt + 1} failed: {exc}. Retrying in 5s...")
                            time.sleep(5.0)
                        else:
                            raise exc
                data = response.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text.strip())
                text = parsed.get("text", "")
                words = parsed.get("words", [])
                print(f"★ Gemini transcription complete. {len(words)} words.")
                return text, json.dumps(words)
            else:
                print("Audio file too large for inline Gemini payload. Falling back to local Whisper.")
        except Exception as e:
            print(f"Gemini audio transcription failed: {e}. Falling back to local Whisper.")

    # ── 3. faster-whisper LOCAL (no API key required) ────────────────────────
    try:
        return _transcribe_local_whisper(audio_path)
    except ImportError as e:
        print(f"faster-whisper not installed: {e}")
        print("  → To enable local transcription (no API key needed), run:")
        print("     pip install faster-whisper")
    except Exception as e:
        print(f"Local Whisper transcription failed: {e}. Falling back to mock.")

    # ── 4. Mock placeholder (offline, fake text) ─────────────────────────────
    print("★ WARNING: Using MOCK transcript. This is NOT the real video audio.")
    print("  → Add GROQ_API_KEY or GEMINI_API_KEY in .env, OR run: pip install faster-whisper")
    mock_text = (
        "[MOCK TRANSCRIPT — Real transcription requires an API key or faster-whisper] "
        "So the secret to building high-scale production systems isn't writing clever code. "
        "It's actually simplicity. Overengineering is the silent killer of MVPs. "
        "We set up an SQLite-backed queue that processed transcription and OpenCV face tracking. "
        "It cost us exactly zero dollars. That's how we built CreatorPilot to handle hundreds of uploads on a budget. "
        "I remember staying up until 4 AM trying to fix an FFmpeg alignment issue. I almost gave up. "
        "But then it clicked—dynamic reframing with face tracking actually worked. And that felt amazing."
    )
    words = []
    current_time = 0.0
    for word in mock_text.split():
        clean = word.strip(".,?!:;()[]{}<>\"'/\\-*_“”‘’।॥")
        duration = max(0.15, min(0.6, len(clean) * 0.07))
        words.append({"word": clean, "start": round(current_time, 2), "end": round(current_time + duration, 2)})
        current_time += duration + 0.05
    return mock_text, json.dumps(words)


def save_transcript(video_path: Path, transcript: str) -> Path:
    transcript_path = TRANSCRIPTIONS_DIR / f"{video_path.stem}.txt"
    transcript_path.write_text(transcript, encoding='utf-8')
    return transcript_path


async def transliterate_text_and_words(raw_text: str, words_json: str, target: str) -> Tuple[str, str]:
    """
    Transliterates the transcript raw text and word-level timestamps between Hindi Devanagari
    and Hinglish (Latin alphabet) using Gemini.
    """
    if not raw_text or not words_json:
        return raw_text, words_json

    from app.services.ai_manager import AIManager
    import json

    try:
        words = json.loads(words_json)
    except Exception:
        return raw_text, words_json

    word_list = [w.get("word", "") for w in words]

    if target == "hinglish":
        system_instruction = "You are an expert linguist specializing in transcribing/transliterating Hindi Devanagari script to Hinglish (Latin alphabet)."
        
        prompt_text = (
            "Transliterate the following Hindi Devanagari text into Hinglish (Hindi written in English/Latin letters). "
            "Do NOT translate it to English. Maintain the exact spoken slang, sentence structure, and vocabulary.\n"
            "Example: 'नमस्ते, आप कैसे हो?' becomes 'namaste, aap kaise ho?'.\n\n"
            f"Text:\n{raw_text}"
        )
        
        prompt_words = (
            "You are given a JSON object containing a 'words' key with an array of strings. Transliterate each string from Hindi Devanagari to Hinglish (Latin alphabet).\n"
            "Do NOT translate the words to English. Maintain the exact order and count. Return a JSON object with a 'words' key containing the transliterated strings.\n"
            "Example input: {\"words\": [\"नमस्ते\", \"कैसे\"]}\n"
            "Example output: {\"words\": [\"namaste\", \"kaise\"]}\n\n"
            f"Input JSON:\n{json.dumps({'words': word_list})}"
        )
        
    else:  # target == "hindi"
        system_instruction = "You are an expert linguist specializing in converting Hinglish (Hindi written in English alphabet) to Devanagari Hindi script."
        
        prompt_text = (
            "Transliterate the following Hinglish text (Hindi written in Latin alphabet) into Devanagari Hindi script. "
            "Do NOT translate it to English. Maintain the exact vocabulary and slang.\n"
            "Example: 'namaste, aap kaise ho?' becomes 'नमस्ते, आप कैसे हो?'.\n\n"
            f"Text:\n{raw_text}"
        )
        
        prompt_words = (
            "You are given a JSON object containing a 'words' key with an array of strings. Transliterate each string from Hinglish (Latin alphabet) to Devanagari Hindi script.\n"
            "Do NOT translate the words to English. Maintain the exact order and count. Return a JSON object with a 'words' key containing the transliterated strings.\n"
            "Example input: {\"words\": [\"namaste\", \"kaise\"]}\n"
            "Example output: {\"words\": [\"नमस्ते\", \"कैसे\"]}\n\n"
            f"Input JSON:\n{json.dumps({'words': word_list})}"
        )

    try:
        new_text = await AIManager.generate_text(
            prompt=prompt_text,
            system_instruction=system_instruction,
            preferred_provider="gemini"
        )
        
        new_words_json = await AIManager.generate_text(
            prompt=prompt_words,
            system_instruction=system_instruction,
            json_mode=True,
            preferred_provider="gemini"
        )
        
        clean_json = new_words_json.strip()
        if clean_json.startswith("```"):
            lines = clean_json.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_json = "\n".join(lines).strip()
            
        new_word_list = json.loads(clean_json)
        if isinstance(new_word_list, dict):
            if "words" in new_word_list and isinstance(new_word_list["words"], list):
                new_word_list = new_word_list["words"]
            else:
                for val in new_word_list.values():
                    if isinstance(val, list):
                        new_word_list = val
                        break

        if isinstance(new_word_list, list):
            N = len(new_word_list)
            M = len(words)
            if N == M:
                for i, w in enumerate(words):
                    w["word"] = str(new_word_list[i])
                return new_text.strip(), json.dumps(words)
            elif N > 0:
                print(f"Warning: Transliterated words list count mismatch ({N} vs {M}). Aligning words proportionally...")
                aligned_words = []
                for i in range(N):
                    # Find closest original word index using proportional ratio
                    orig_idx = int(i * M / N)
                    orig_idx = max(0, min(orig_idx, M - 1))
                    orig_w = words[orig_idx]
                    aligned_words.append({
                        "word": str(new_word_list[i]),
                        "start": orig_w["start"],
                        "end": orig_w["end"]
                    })
                return new_text.strip(), json.dumps(aligned_words)
            else:
                print("Warning: Transliterated words list is empty.")
                return new_text.strip(), words_json
        else:
            print(f"Warning: Transliterated words list is not a list.")
            return new_text.strip(), words_json
            
    except Exception as e:
        print(f"Transliteration failed: {e}")
        return raw_text, words_json
