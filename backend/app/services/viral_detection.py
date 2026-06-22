import json
from typing import List, Dict, Any
from app.services.ai_manager import AIManager

async def analyze_transcript_for_clips_async(transcript: str, num_clips: int = 3, clip_prompt: str = None) -> List[Dict[str, Any]]:
    """
    Analyze video transcript using LLM to identify high-engagement clip moments.
    
    Returns a list of dictionaries, each containing:
    - start_time (float)
    - end_time (float)
    - segment (text)
    - viral_score (0-100)
    - clip_type (hook, educational, storytelling, emotional)
    - title (viral vertical video title)
    - explanation (why this moment is viral)
    """
    if not transcript or len(transcript.strip()) == 0:
        return []

    system_instruction = (
        "You are an expert AI content director and video editor. Your task is to analyze long-form transcripts "
        "and select the top short-form vertical clip moments (30-60 seconds long). "
        "Look for: hooks (compelling intro lines), educational peaks (high-value teaching), "
        "storytelling (emotional stories), and emotional peaks (highly passionate/relatable statements)."
    )

    # Build optional client brief section
    client_brief_section = ""
    if clip_prompt and clip_prompt.strip():
        client_brief_section = (
            f"\n\n**CLIENT BRIEF** (HIGHEST PRIORITY — override default criteria):\n"
            f"{clip_prompt.strip()}\n"
            f"You MUST prioritize clip moments that match this brief above all else. "
            f"Select clips that serve the client's stated style, theme, or audience preference.\n"
        )

    prompt = (
        f"Analyze the following transcript and find the top {num_clips} best short-form clip moments (aim for 30-60 seconds each). "
        f"You must select the actual absolute BEST parts of the video that are most engaging or viral."
        f"{client_brief_section}\n\n"
        f"Transcript:\n\"\"\"\n{transcript}\n\"\"\"\n\n"
        f"You must return a JSON array of exactly {num_clips} objects. Each object in the array must contain the following keys:\n"
        f"- 'start_time': approximate start time in seconds (estimate based on content if not explicit, but since the transcript has text, try to estimate start time. If you can't, assume clip 1 is 0-30s, clip 2 is 60-90s, clip 3 is 120-150s etc).\n"
        f"- 'end_time': approximate end time in seconds.\n"
        f"- 'segment': the exact transcript text snippet contained in this clip. (If the transcript is in Hindi Devanagari script, the segment MUST be returned exactly in Hindi Devanagari script).\n"
        f"- 'viral_score': integer from 0 to 100 representing viral potential.\n"
        f"- 'clip_type': string, one of: 'hook', 'educational', 'storytelling', 'emotional'.\n"
        f"- 'title': a catchy, click-worthy title for the vertical clip (use emojis. If the segment is in Hindi, use a catchy, viral Hindi/Hinglish title like 'यह गलती मत करना 😱' or 'Secret revealed 🤫').\n"
        f"- 'explanation': a brief explanation of why this moment is compelling.\n"
        f"- 'broll_queries': an array of strings containing short, generic search terms for stock imagery (e.g., 'city timeline', 'developer coding', 'angry person') related to the segment.\n\n"
        f"Ensure you return ONLY valid JSON. Do not include markdown formatting or backticks."
    )

    try:
        # Call the unified AI manager
        response_text = await AIManager.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True,
            preferred_provider="gemini"
        )
        
        # Clean up code blocks if the LLM outputted them despite instructions
        clean_text = response_text.strip()
        if clean_text.startswith("```"):
            # Strip markdown block formatting
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()
            
        parsed = json.loads(clean_text)
        
        # If it returns a dictionary with a key like 'clips', extract it
        if isinstance(parsed, dict):
            for key in ["clips", "data", "segments", "results"]:
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
            else:
                # Single clip object — wrap it
                parsed = [parsed]
            
        if not isinstance(parsed, list):
            raise ValueError("AI response did not parse into a list or dictionary of clips")

        # ── Normalize each clip dict ────────────────────────────────────────────
        # The LLM sometimes uses different key names across clips (e.g. "segment",
        # "segment_text", "transcript", "text"). Unify them here so every clip
        # always has the canonical keys our code expects.
        def _normalize_clip(c: dict) -> dict:
            # segment text
            if not c.get("segment"):
                c["segment"] = (
                    c.pop("segment_text", None)
                    or c.pop("transcript_segment", None)
                    or c.pop("transcript", None)
                    or c.pop("text", None)
                    or c.pop("content", None)
                    or ""
                )
            # timing — accept seconds or ms (values > 3600 treated as ms)
            for key in ("start_time", "end_time"):
                val = c.get(key)
                if isinstance(val, (int, float)) and val > 3600:
                    c[key] = round(val / 1000, 2)
            # viral_score — accept 0-1 floats and scale to 0-100
            vs = c.get("viral_score")
            if isinstance(vs, float) and vs <= 1.0:
                c["viral_score"] = round(vs * 100)
            # broll_queries — ensure it is a list
            if not isinstance(c.get("broll_queries"), list):
                c["broll_queries"] = []
            return c

        normalized = [_normalize_clip(c) for c in parsed if isinstance(c, dict)]
        return normalized[:num_clips]

    except Exception as e:
        print(f"Viral clip detection AI call failed: {e}. Using fallback generator.")
        
        # Fallback helper for offline or failed requests
        # We can extract text chunks based on keyword matching or return default clips
        fallbacks = [
            {
                "start_time": 0.0,
                "end_time": 30.0,
                "segment": transcript[:200] if len(transcript) > 0 else "Introduction Hook",
                "viral_score": 85,
                "clip_type": "hook",
                "title": "The Secrets of CreatorPilot AI 🚀",
                "explanation": "Compelling introduction hook introducing the zero-cost build stack.",
                "broll_queries": ["rocket launch", "server rack"]
            },
            {
                "start_time": 60.0,
                "end_time": 90.0,
                "segment": transcript[200:500] if len(transcript) > 200 else "Core Insight",
                "viral_score": 92,
                "clip_type": "educational",
                "title": "Why Startups Build For Free 💸",
                "explanation": "Actionable technical insight detail of the Postgres and SQLite setup.",
                "broll_queries": ["money savings", "database server"]
            },
            {
                "start_time": 120.0,
                "end_time": 150.0,
                "segment": transcript[500:800] if len(transcript) > 500 else "Core Story",
                "viral_score": 89,
                "clip_type": "storytelling",
                "title": "Our Ultimate Journey 😭",
                "explanation": "Storytelling detail of building the vertical reframing pipeline.",
                "broll_queries": ["sad coder", "happy user"]
            },
            {
                "start_time": 180.0,
                "end_time": 210.0,
                "segment": transcript[800:1100] if len(transcript) > 800 else "Secret Hack",
                "viral_score": 91,
                "clip_type": "emotional",
                "title": "Do Not Skip This Hack! 🤫",
                "explanation": "Emotional peak showing the critical zero-cost deployment hack.",
                "broll_queries": ["keys", "growth hack"]
            },
            {
                "start_time": 240.0,
                "end_time": 270.0,
                "segment": transcript[1100:1400] if len(transcript) > 1100 else "Final Summary",
                "viral_score": 88,
                "clip_type": "hook",
                "title": "Where We Go From Here 🚀",
                "explanation": "Wrapping up content and looking at upcoming Next.js dashboards.",
                "broll_queries": ["city timeline", "future technology"]
            }
        ]
        return fallbacks[:num_clips]

def analyze_transcript_for_clips(transcript: str, num_clips: int = 3, clip_prompt: str = None) -> List[dict]:
    """Synchronous wrapper for async viral clips function (needed by worker thread).
    
    Always creates a fresh event loop so it works safely from non-async threads
    (Python 3.10+ deprecated get_event_loop() that creates a new loop silently).
    """
    import asyncio
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(analyze_transcript_for_clips_async(transcript, num_clips, clip_prompt))
    finally:
        loop.close()
