import os
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any
import cv2

STORAGE_DIR = Path(__file__).resolve().parents[3] / "storage"
CLIPS_DIR = STORAGE_DIR / "clips"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

def detect_best_crop_x(video_path: str, start_time: float, end_time: float) -> float:
    """
    Analyzes the video clip frames using OpenCV face detection to determine
    the optimal horizontal crop coordinate (centering the speaker).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return -1

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    
    if width <= 0 or height <= 0:
        cap.release()
        return -1

    # Load Haar cascade face classifier
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    start_frame = int(start_time * fps)
    end_frame = int(end_time * fps)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Clamp frames
    start_frame = max(0, min(start_frame, total_frames - 1))
    end_frame = max(start_frame, min(end_frame, total_frames - 1))

    # Read sparse frames (approx 15 frames throughout the clip duration)
    step = max(1, (end_frame - start_frame) // 15)
    
    face_x_coords = []
    
    for frame_idx in range(start_frame, end_frame, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue
            
        # Convert to grayscale for detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(60, 60))
        
        if len(faces) > 0:
            # Sort by size (width * height) and get the largest face
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            face_center_x = x + w / 2.0
            face_x_coords.append(face_center_x)

    cap.release()

    # Calculate average face X coordinate
    if face_x_coords:
        avg_x = sum(face_x_coords) / len(face_x_coords)
        print(f"★ Face detection found face centers: {face_x_coords}. Average: {avg_x}")
        return avg_x
    else:
        # Default to center of screen if no face found
        print("★ Face detection did not find any faces. Defaulting to frame center.")
        return width / 2.0

def generate_ass_subtitles(words: List[Dict[str, Any]], start_time: float, end_time: float, ass_path: Path, branding: Dict[str, Any] = None):
    """
    Generates a stylized ASS subtitle file with word-by-word highlights.
    """
    if branding is None:
        branding = {}
        
    font_name = branding.get("font", "Arial")
    hex_color = branding.get("color", "#FFFF00").lstrip("#")  # default yellow
    # ASS format expects BBGGRR (AABBGGRR), so we reverse RGB hex to BGR
    if len(hex_color) == 6:
        ass_color = f"&H00{hex_color[4:6]}{hex_color[2:4]}{hex_color[0:2]}&"
    else:
        ass_color = "&H0000FFFF&" # default yellow

    position = branding.get("position", "bottom")
    alignment = 2  # bottom center
    margin_v = 240
    if position == "top":
        alignment = 8
        margin_v = 150
    elif position == "center":
        alignment = 5
        margin_v = 0
        
    # Group words that overlap with the clip time range
    clip_words = []
    for w in words:
        w_start = float(w.get("start", 0))
        w_end = float(w.get("end", 0))
        if w_end > start_time and w_start < end_time:
            # Shift timestamps relative to clip start and clamp to clip duration [0, end_time - start_time]
            clip_words.append({
                "word": w.get("word", ""),
                "start": max(0.0, w_start - start_time),
                "end": min(end_time - start_time, w_end - start_time)
            })

    # Group words into chunks of at most 3 words for compact vertical styling
    lines = []
    current_line = []
    for w in clip_words:
        current_line.append(w)
        if len(current_line) >= 3:
            lines.append(current_line)
            current_line = []
    if current_line:
        lines.append(current_line)

    # Style Header in ASS file
    ass_content = (
        "[Script Info]\n"
        "ScriptType: v4.00+\n"
        "PlayResX: 1080\n"
        "PlayResY: 1920\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Default,{font_name},65,&H00FFFFFF,{ass_color},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,{alignment},10,10,{margin_v},1\n\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )

    def to_ass_time(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = sec % 60
        return f"{h}:{m:02d}:{s:05.2f}"

    # Generate events for word-by-word styling transitions
    anim_style = branding.get("animation", "classic")

    for line in lines:
        line_start = line[0]["start"]
        line_end = line[-1]["end"]
        
        # Create a dialogue event for each word's duration to highlight it
        for active_idx, active_word in enumerate(line):
            event_start = active_word["start"]
            # The active highlight lasts from this word's start to the next word's start, or line end
            if active_idx < len(line) - 1:
                event_end = line[active_idx + 1]["start"]
            else:
                event_end = line_end

            # Construct display text with active word styled based on animation type
            styled_parts = []
            for idx, w in enumerate(line):
                word_text = w["word"]
                if idx == active_idx:
                    if anim_style == "none":
                        styled_parts.append(word_text)
                    elif anim_style == "zoom_bounce":
                        # Zoom active word to 120% and use highlight color
                        styled_parts.append(f"{{\\fscx120\\fscy120\\c{ass_color}}}{word_text}{{\\fscx100\\fscy100\\c}}")
                    elif anim_style == "glow_highlighter":
                        # Zoom active word to 125%, use highlight color, thicker border, and highlight shadow
                        styled_parts.append(f"{{\\fscx125\\fscy125\\c{ass_color}\\bord5\\3c&H00000000&\\4c{ass_color}}}{word_text}{{\\fscx100\\fscy100\\c\\bord4\\3c\\4c}}")
                    else:  # "classic" or default
                        styled_parts.append(f"{{\\c{ass_color}}}{word_text}{{\\c}}")
                else:
                    styled_parts.append(word_text)
                    
            text_str = " ".join(styled_parts)
            
            # Format times
            start_str = to_ass_time(event_start)
            end_str = to_ass_time(event_end)
            
            ass_content += f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{text_str}\n"

    ass_path.write_text(ass_content, encoding="utf-8")

def generate_clips(video_path: str, clips: List[Dict[str, Any]], branding_settings: Dict[str, Any] = None, broll_enabled: bool = False) -> List[Dict[str, Any]]:
    """
    Generates vertical 9:16 short-form clips centered on the speaker's face with ASS captions,
    watermarks, and optional AI B-roll overlays.
    """
    if branding_settings is None:
        branding_settings = {}
        
    video_path_obj = Path(video_path)
    words_data_path = video_path_obj.with_suffix('.json')
    
    words = []
    if words_data_path.exists():
        try:
            words = json.loads(words_data_path.read_text(encoding='utf-8'))
        except Exception as e:
            print(f"Error reading words timestamp JSON: {e}")

    generated = []

    for i, clip in enumerate(clips):
        clip_id = clip.get("id", i + 1)
        try:
            start_time = float(clip.get("start_time", 0))
            end_time = float(clip.get("end_time", start_time + 30))
            clip_type = clip.get("clip_type", "segment")
            viral_score = clip.get("viral_score", 0)
            segment_text = clip.get("segment", "")
            broll_queries = clip.get("broll_queries", [])
            
            duration = end_time - start_time
            clip_filename = f"clip_{clip_id}_{clip_type}_{int(start_time)}s.mp4"
            output_path = CLIPS_DIR / clip_filename

            # 1. Run Face-tracking alignment
            face_x = detect_best_crop_x(video_path, start_time, end_time)
            
            # 2. Generate subtitle ASS file
            ass_filename = f"subs_{clip_id}_{int(start_time)}s.ass"
            ass_path = CLIPS_DIR / ass_filename
            
            if not words:
                dummy_segments = [{"start": start_time, "end": end_time, "text": segment_text}]
                clip_words = interpolate_word_timestamps(dummy_segments)
                generate_ass_subtitles(clip_words, start_time, end_time, ass_path, branding_settings)
            else:
                generate_ass_subtitles(words, start_time, end_time, ass_path, branding_settings)

            # Get video dimensions to compute crop filter
            cap = cv2.VideoCapture(video_path)
            orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()

            crop_w = int(orig_h * (9.0 / 16.0))
            crop_h = orig_h

            # Clamp crop dimensions to not exceed original dimensions
            if crop_w > orig_w:
                crop_w = orig_w
                # To maintain 9:16 aspect ratio, adjust crop_h
                crop_h = int(orig_w * (16.0 / 9.0))
                # Clamp crop_h as well just in case
                if crop_h > orig_h:
                    crop_h = orig_h

            if face_x < 0:
                face_x = orig_w / 2.0

            crop_x = int(face_x - crop_w / 2.0)
            crop_x = max(0, min(crop_x, orig_w - crop_w))

            ass_filter_path = str(ass_path).replace("\\", "/").replace(":", "\\:")

            # Base inputs and filters using fast input seeking
            duration = end_time - start_time
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", video_path,
                "-t", str(duration)
            ]
            
            filter_chain = []
            inputs_count = 1
            
            # Base video scale/crop
            filter_chain.append(f"[0:v]crop={crop_w}:{crop_h}:{crop_x}:0,scale=1080:1920[vbase]")
            current_vid_stream = "[vbase]"

            # Watermark Overlay
            watermark_path = branding_settings.get("watermark_path")
            if watermark_path and os.path.exists(watermark_path):
                cmd.extend(["-i", watermark_path])
                wm_idx = inputs_count
                inputs_count += 1
                # Scale watermark and overlay it on top left
                filter_chain.append(f"[{wm_idx}:v]scale=200:-1[wm]")
                filter_chain.append(f"{current_vid_stream}[wm]overlay=10:10[vwm]")
                current_vid_stream = "[vwm]"
                
            # B-Roll Overlay (Mock)
            broll_downloaded_path = None
            if broll_enabled and broll_queries:
                # We'll use a placeholder image for B-Roll using the first query
                import urllib.request
                import uuid
                query = broll_queries[0].replace(" ", "+")
                broll_filename = f"broll_{uuid.uuid4().hex}.jpg"
                broll_downloaded_path = CLIPS_DIR / broll_filename
                try:
                    # Fetching from an open API. We'll use placehold.co to avoid API keys.
                    urllib.request.urlretrieve(f"https://placehold.co/1080x1920/222222/FFFFFF/png?text={query}", str(broll_downloaded_path))
                    
                    if broll_downloaded_path.exists():
                        cmd.extend(["-i", str(broll_downloaded_path)])
                        broll_idx = inputs_count
                        inputs_count += 1
                        
                        # Overlay B-roll between second 2 and second 6 of the clip
                        # We use enable='between(t,2,6)' to show it briefly
                        filter_chain.append(f"[{broll_idx}:v]scale=1080:1920[broll_scaled]")
                        filter_chain.append(f"{current_vid_stream}[broll_scaled]overlay=0:0:enable='between(t,2,6)'[vbroll]")
                        current_vid_stream = "[vbroll]"
                except Exception as e:
                    print(f"Failed to fetch B-roll: {e}")

            # Subtitles Overlay
            filter_chain.append(f"{current_vid_stream}subtitles='{ass_filter_path}'[vfinal]")
            
            filter_str = ";".join(filter_chain)
            
            cmd.extend([
                "-filter_complex", filter_str,
                "-map", "[vfinal]",
                "-map", "0:a",
                "-c:v", "libx264",
                "-preset", "fast",
                "-b:v", "2000k",
                "-c:a", "aac",
                "-b:a", "128k",
                str(output_path)
            ])

            print(f"★ Executing FFmpeg command for clip {clip_id}: {' '.join(cmd)}")
            try:
                result = subprocess.run(cmd, check=True, capture_output=True)
            except subprocess.CalledProcessError as e:
                err_out = e.stderr.decode('utf-8', errors='replace') if e.stderr else 'No stderr'
                print(f"FFmpeg Error Output:\n{err_out}")
                raise Exception(f"FFmpeg failed: {err_out}")

            # Cleanup ASS file
            if ass_path.exists():
                try:
                    os.remove(ass_path)
                except:
                    pass

            generated.append({
                "clip_number": clip_id,
                "path": str(output_path),
                "filename": clip_filename,
                "duration": duration,
                "viral_score": viral_score,
                "clip_type": clip_type,
                "segment": segment_text,
                "format": "9:16 vertical",
                "resolution": "1080x1920",
                "status": "generated"
            })

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print(f"Failed to generate clip {clip_id}: {e}\n{tb}")
            generated.append({
                "clip_number": clip_id,
                "error": str(e),
                "status": "failed"
            })

    return generated

# Import transcription helper so we can use interpolate_word_timestamps if needed
from app.services.transcription import interpolate_word_timestamps
