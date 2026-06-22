"""Generate platform-specific hashtags using AI."""
import json
from typing import Dict, Any
from app.services.ai_manager import AIManager


async def generate_hashtags_ai(transcript: str) -> Dict[str, Any]:
    """
    Generate trending hashtags for all platforms using LLM.
    
    Args:
        transcript: Video transcript
    
    Returns dict with hashtags for each platform
    """
    platforms = ["instagram", "tiktok", "twitter", "linkedin"]
    hashtags_by_platform = {}
    
    system_instruction = (
        "You are a social media expert and hashtag strategist. Your task is to generate platform-specific, "
        "trending, and relevant hashtags that will maximize reach and engagement. Consider platform algorithms "
        "and user search behavior."
    )
    
    platform_limits = {
        "instagram": 30,
        "tiktok": 10,
        "twitter": 5,
        "linkedin": 5,
    }
    
    for platform in platforms:
        limit = platform_limits.get(platform, 10)
        
        prompt = (
            f"Analyze this video transcript and generate the top {limit} most relevant hashtags for {platform}:\n\n"
            f"Transcript: {transcript[:800]}\n\n"
            f"Guidelines for {platform}:\n"
            f"- Platform limit: {limit} hashtags\n"
            f"- Mix of trending, niche, and specific hashtags\n"
            f"- Include both broad appeal and targeted tags\n\n"
            f"Return a JSON object with:\n"
            f'- "hashtags": array of hashtag strings (with # symbol)\n'
            f'- "hashtag_string": space-separated string of all hashtags\n'
            f'- "trending_score": 0-100 estimate of trend relevance\n'
            f'- "explanation": brief reason why these hashtags fit\n\n'
            f"Return ONLY valid JSON, no markdown formatting."
        )
        
        try:
            response = await AIManager.generate_text(
                prompt=prompt,
                system_instruction=system_instruction,
                json_mode=True,
                preferred_provider="groq"
            )
            
            data = json.loads(response)
            hashtags_by_platform[platform] = data
        except Exception as e:
            print(f"Error generating hashtags for {platform}: {e}")
            # Fallback to mock hashtags
            hashtags_by_platform[platform] = {
                "hashtags": [f"#Tag{i}" for i in range(1, limit + 1)],
                "hashtag_string": " ".join([f"#Tag{i}" for i in range(1, limit + 1)]),
                "trending_score": 60,
                "explanation": "Fallback hashtags"
            }
    
    return {
        "status": "success",
        "hashtags": hashtags_by_platform
    }


def generate_hashtags(transcript: str, platform: str = "instagram") -> dict:
    """Legacy function - kept for backward compatibility."""
    import asyncio
    result = asyncio.run(generate_hashtags_ai(transcript))
    return result.get("hashtags", {}).get(platform, {
        "platform": platform,
        "hashtags": [],
        "hashtag_string": "",
        "trending_score": 0,
    })
