from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from app.services.ai_manager import AIManager

router = APIRouter()

class RepurposeRequest(BaseModel):
    script: str

@router.post("/generate")
async def generate_repurposed_content(request: RepurposeRequest):
    """
    Turns a video script into a Twitter Thread, LinkedIn Post, and SEO Blog post.
    """
    prompt = f"""
    You are an elite multi-channel marketer. I will provide you with a video script.
    You must repurpose it into THREE highly engaging formats:
    1. A viral Twitter Thread (3-5 tweets long, separated by '---')
    2. A professional yet engaging LinkedIn Post
    3. A short, SEO-optimized Blog Post (with Markdown headers)

    Video Script:
    "{request.script}"

    You MUST return the output as a strictly valid JSON object exactly in this format:
    {{
      "twitter": "tweet 1\\n---\\ntweet 2\\n---\\ntweet 3",
      "linkedin": "your linkedin post here...",
      "blog": "# Title\\n\\nBlog content..."
    }}
    
    Do NOT include any markdown formatting blocks like ```json around the response. Only output raw JSON.
    """
    
    try:
        response = await AIManager.generate_text(prompt, json_mode=False)
        
        # Clean up potential markdown formatting from AI
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
            
        parsed_data = json.loads(response.strip())
        return parsed_data
    except json.JSONDecodeError as e:
        print(f"Failed to parse AI response as JSON: {response}")
        raise HTTPException(status_code=500, detail="AI returned invalid format. Please try again.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
