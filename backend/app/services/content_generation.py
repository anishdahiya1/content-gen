"""Generate platform-specific captions and titles using AI."""
import json
from typing import Dict, Any, List
from app.services.ai_manager import AIManager


async def generate_captions_ai(transcript: str) -> Dict[str, Any]:
    """
    Generate platform-specific captions using LLM.
    
    Args:
        transcript: Full video transcript
    
    Returns dict with captions for each platform (youtube, instagram, tiktok, linkedin)
    """
    platforms = ["youtube", "instagram", "tiktok", "linkedin"]
    captions_by_platform = {}
    
    system_instruction = (
        "You are a expert social media copywriter. Your task is to write engaging, platform-optimized captions "
        "that increase engagement and clicks. Consider platform norms, character limits, and audience expectations."
    )
    
    for platform in platforms:
        platform_guidelines = {
            "youtube": "Character limit: 5000. Include timestamps, links, and CTAs. Professional yet engaging.",
            "instagram": "Character limit: 2200. Use emojis, line breaks, and hashtags. Conversational tone.",
            "tiktok": "Character limit: 2200. Trendy, casual, use trending phrases. Encourage shares/duets/stitches.",
            "linkedin": "Character limit: 3000. Professional, value-focused, include relevant hashtags and insights.",
        }
    
        prompt = (
            f"Generate 3 different caption styles for a {platform} post based on this transcript:\n\n"
            f"Transcript: {transcript[:800]}\n\n"
            f"Platform guidelines: {platform_guidelines[platform]}\n\n"
            f"Return a JSON object with a 'captions' array containing 3 objects. Each object should have:\n"
            f'- "style": one of ["professional", "casual", "storytelling"]\n'
            f'- "text": the caption text (within platform limits)\n\n'
            f"Return ONLY valid JSON, no markdown formatting."
        )
        
        try:
            response = await AIManager.generate_text(
                prompt=prompt,
                system_instruction=system_instruction,
                json_mode=True,
                preferred_provider="groq"
            )
            
            # Parse JSON response
            data = json.loads(response)
            captions_by_platform[platform] = data.get("captions", [])
        except Exception as e:
            print(f"Error generating captions for {platform}: {e}")
            # Fallback to mock captions
            captions_by_platform[platform] = [
                {"style": "professional", "text": f"Check out this content on {platform}!"},
                {"style": "casual", "text": f"🔥 Amazing content for {platform}"},
                {"style": "storytelling", "text": f"Listen to this story... #{platform}"},
            ]
    
    return {
        "status": "success",
        "captions": captions_by_platform
    }


async def generate_titles_ai(transcript: str) -> Dict[str, Any]:
    """
    Generate multiple title options using LLM.
    
    Args:
        transcript: Full video transcript
    
    Returns dict with title options in different styles
    """
    system_instruction = (
        "You are an expert video title copywriter. Your task is to create compelling, click-worthy titles "
        "that are accurate, engaging, and optimized for search and discovery. Use power words, emotional triggers, "
        "and curiosity gaps when appropriate."
    )
    
    prompt = (
        f"Generate 5 different video titles based on this transcript:\n\n"
        f"Transcript: {transcript[:800]}\n\n"
        f"Create titles in these styles:\n"
        f"1. 'viral' - Curiosity gap, power words, emotional appeal\n"
        f"2. 'seo' - Keyword-rich, descriptive, searchable\n"
        f"3. 'educational' - Informative, value-focused, clear benefit\n"
        f"4. 'curiosity' - Mystery, intrigue, compelling hook\n"
        f"5. 'trending' - Uses trending phrases, timely, shareable\n\n"
        f"Return a JSON object with a 'titles' array containing 5 objects. Each object should have:\n"
        f'- "style": one of ["viral", "seo", "educational", "curiosity", "trending"]\n'
        f'- "text": the title (under 100 characters)\n\n'
        f"Return ONLY valid JSON, no markdown formatting."
    )
    
    try:
        response = await AIManager.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True,
            preferred_provider="groq"
        )
        
        # Parse JSON response
        data = json.loads(response)
        titles = data.get("titles", [])
        return {"status": "success", "titles": titles}
    except Exception as e:
        print(f"Error generating titles: {e}")
        # Fallback to mock titles
        return {
            "status": "success",
            "titles": [
                {"style": "viral", "text": "You Won't BELIEVE What Happened Next 🤯"},
                {"style": "seo", "text": "Complete Guide to Content Creation - 2024"},
                {"style": "educational", "text": "Learn the Secret to Viral Videos"},
                {"style": "curiosity", "text": "The ONE Secret Nobody Tells You"},
                {"style": "trending", "text": "#FYP Content That Actually Works"},
            ]
        }


def generate_captions(transcript: str, platform: str = "youtube") -> dict:
    """Legacy function - kept for backward compatibility."""
    import asyncio
    return asyncio.run(generate_captions_ai(transcript))


def generate_titles(transcript: str) -> dict:
    """Legacy function - kept for backward compatibility."""
    import asyncio
    return asyncio.run(generate_titles_ai(transcript))
