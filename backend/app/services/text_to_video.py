import os
import json
import asyncio
import urllib.parse
from pathlib import Path
from typing import Dict, Any, List
import httpx
import uuid
import re

import edge_tts

from app.services.ai_manager import AIManager
from app.services.clip_generation import generate_ass_subtitles, CLIPS_DIR
import subprocess

# Ensure we have a place to store generative assets
GENERATIVE_DIR = Path("C:/Users/Anish/Desktop/content/storage/generative")
GENERATIVE_DIR.mkdir(parents=True, exist_ok=True)

from app.services.transcription import interpolate_word_timestamps

async def generate_script(topic: str, language: str = "english") -> List[Dict[str, str]]:
    """
    Generate a highly engaging, vertical short-form script using AI.
    Returns a list of scenes, each with 'narration' and 'visual_prompt'.
    """
    prompt = f"""
    You are an expert viral TikTok/Reels scriptwriter.
    Create a 90-second animated story/series script about: "{topic}".
    The narration MUST be written in {language}.
    
    The script must be highly engaging, have a hook, and keep the viewer retained.
    Break it down into about 5 to 8 scenes.
    For each scene, provide the narration text and a highly descriptive visual prompt for an AI image generator to create the background image for that scene. The image prompt should describe a dark fantasy / cinematic / high-quality scene. (The visual prompt must always be in English).
    
    Return the result strictly as a JSON array of objects with keys 'narration' and 'visual_prompt'.
    Output ONLY valid JSON. No markdown formatting or backticks.
    """
    
    # We use our existing AI manager
    response = await AIManager.generate_text(prompt, json_mode=True)
    
    # Clean up the response just in case
    response = response.strip()
    if response.startswith("```json"):
        response = response[7:]
    if response.startswith("```"):
        response = response[3:]
    if response.endswith("```"):
        response = response[:-3]
        
    try:
        # Extract everything between the first [ and the last ]
        start = response.find('[')
        end = response.rfind(']')
        if start != -1 and end != -1:
            response = response[start:end+1]
            
        scenes = json.loads(response)
        return scenes
    except json.JSONDecodeError as e:
        print(f"Failed to parse AI script as JSON: {response}")
        raise e

async def generate_scene_image(prompt: str, output_path: str):
    """
    Downloads an image from pollinations.ai for the given prompt.
    """
    # Create a good prompt for Pollinations
    safe_prompt = urllib.parse.quote(f"Cinematic, hyperrealistic, masterpiece, vertical 9:16 aspect ratio. {prompt}")
    url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width=1080&height=1920&nologo=true"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=60.0)
        response.raise_for_status()
        
        with open(output_path, "wb") as f:
            f.write(response.content)


async def generate_series_pipeline(topic: str, job_id: str, language: str = "english"):
    """
    Full pipeline to generate the series.
    """
    job_dir = GENERATIVE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[{job_id}] Generating script for topic: {topic} (Language: {language})")
    scenes = await generate_script(topic, language)
    
    # Helper to safely get keys from AI responses
    def get_narration(scene):
        return scene.get("narration") or scene.get("text") or scene.get("script") or scene.get("dialogue") or ""
        
    def get_visual_prompt(scene):
        return scene.get("visual_prompt") or scene.get("image_prompt") or scene.get("prompt") or scene.get("visual") or "A cinematic dark fantasy scene"
    
    # 1. Combine narration
    full_narration = " ".join([get_narration(scene) for scene in scenes])
    
    # 2. Generate Audio & Timestamps using Edge TTS
    audio_path = job_dir / "voiceover.mp3"
    
    print(f"[{job_id}] Generating audio via Edge-TTS...")
    # Select voice based on language
    voice = "en-US-ChristopherNeural" 
    if language.lower() == "hindi":
        voice = "hi-IN-MadhurNeural"
        
    segments = []
    communicate = edge_tts.Communicate(full_narration, voice)
    
    with open(audio_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # Edge-TTS emits sentence/phrase boundaries, not strict words.
                start = chunk["offset"] / 10000000.0 # 100ns to seconds
                duration = chunk["duration"] / 10000000.0
                segments.append({
                    "text": chunk["text"],
                    "start": start,
                    "end": start + duration
                })
                
    # Interpolate into actual words for our subtitle burner
    words = interpolate_word_timestamps(segments)
    
    # 3. Generate Scene Images
    print(f"[{job_id}] Generating visuals...")
    scene_videos = []
    
    # Calculate duration per scene (evenly distributed based on total audio time)
    total_duration = words[-1]["end"] if words else 90.0
    duration_per_scene = total_duration / len(scenes)
    
    for i, scene in enumerate(scenes):
        img_path = job_dir / f"scene_{i}.jpg"
        vid_path = job_dir / f"scene_{i}.mp4"
        
        await generate_scene_image(get_visual_prompt(scene), str(img_path))
        
        # Add Ken Burns effect using FFmpeg (pan/zoom)
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", str(img_path),
            "-t", str(duration_per_scene),
            "-vf", "zoompan=z='min(zoom+0.0015,1.5)':d=25*10:s=1080x1920:fps=30",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            str(vid_path)
        ]
        print(f"[{job_id}] Rendering scene {i}...")
        subprocess.run(cmd, check=True, capture_output=True)
        scene_videos.append(str(vid_path))
        
    # 4. Concatenate Scene Videos
    print(f"[{job_id}] Concatenating scenes...")
    concat_file = job_dir / "concat.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        for vid in scene_videos:
            vid_escaped = vid.replace("\\", "\\\\").replace("'", "\\'")
            f.write(f"file '{vid_escaped}'\n")
            
    base_vid_path = job_dir / "base_video.mp4"
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(base_vid_path)
    ]
    subprocess.run(concat_cmd, check=True, capture_output=True)
    
    # 5. Generate ASS Subtitles
    print(f"[{job_id}] Generating subtitles...")
    ass_path = job_dir / "subs.ass"
    
    font_name = "Nirmala UI" if language.lower() == "hindi" else "Arial"
    
    branding = {
        "font": font_name,
        "color": "&H00FFFF&", # Yellow
        "animation": "glow_highlighter",
        "position": "center"
    }
    generate_ass_subtitles(words, 0, total_duration, ass_path, branding)
    
    # 6. Final Burn-in & Audio Multiplexing
    print(f"[{job_id}] Final rendering...")
    final_output = job_dir / f"{job_id}_final.mp4"
    
    ass_filter_path = str(ass_path).replace("\\", "/").replace(":", "\\:")
    
    final_cmd = [
        "ffmpeg", "-y",
        "-i", str(base_vid_path),
        "-i", str(audio_path),
        "-filter_complex", f"subtitles='{ass_filter_path}'",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-shortest",
        str(final_output)
    ]
    
    subprocess.run(final_cmd, check=True, capture_output=True)
    print(f"[{job_id}] Successfully generated series: {final_output}")
    
    return str(final_output)
