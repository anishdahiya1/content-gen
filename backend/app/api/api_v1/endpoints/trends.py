import json
from fastapi import APIRouter, HTTPException, Query
from app.services.ai_manager import AIManager

router = APIRouter()

@router.get("/analyze")
async def analyze_trends(region: str = Query("Global"), niche: str = Query("General")):
    """
    Analyzes viral trends for a specific region and niche using Gemini.
    Returns a JSON array of trending topics and hook ideas.
    """
    prompt = f"""
    You are an expert social media strategist and viral trend analyst.
    I need a trend report for the region: "{region}" and the niche: "{niche}".
    
    Identify 5 current or emerging viral content topics, formats, or discussions that are highly relevant right now.
    For each trend, provide:
    1. "topic": A catchy title for the trend.
    2. "description": Why it is trending in {region} for {niche}.
    3. "hook": A 1-2 sentence viral video hook the creator can use.
    4. "format": The best format for this trend (e.g., "Storytime", "Listicle", "React", "Educational").
    5. "virality_score": A score from 1-100 indicating how hot it is.
    
    Return the result strictly as a JSON object with a key "trends" containing an array of these 5 trend objects.
    Output ONLY valid JSON. No markdown formatting or backticks.
    """
    
    try:
        response = await AIManager.generate_text(prompt, json_mode=True)
        
        # Clean up response
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        elif response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        start = min([i for i in [response.find('{'), response.find('[')] if i != -1] or [-1])
        end = max([i for i in [response.rfind('}'), response.rfind(']')] if i != -1] or [-1])
        
        if start != -1 and end != -1:
            response = response[start:end+1]
            
        data = json.loads(response)
        if isinstance(data, list):
            data = {"trends": data}
            
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
