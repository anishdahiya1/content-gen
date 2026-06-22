import os
import json
import httpx
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Read credentials from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class AIManager:
    """Unified wrapper for AI services, supporting Gemini, Groq, and offline mocks."""
    
    @staticmethod
    def get_headers_groq() -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

    @staticmethod
    async def generate_text(
        prompt: str,
        system_instruction: Optional[str] = None,
        json_mode: bool = False,
        preferred_provider: str = "gemini"
    ) -> str:
        """
        Generate text using Gemini or Groq, with automatic retry for transient 
        errors and cross-provider fallback.
        """
        import asyncio

        # Build fallback list of providers to try
        providers_to_try = []
        if preferred_provider == "gemini":
            if GEMINI_API_KEY:
                providers_to_try.append("gemini")
            if GROQ_API_KEY:
                providers_to_try.append("groq")
        else:
            if GROQ_API_KEY:
                providers_to_try.append("groq")
            if GEMINI_API_KEY:
                providers_to_try.append("gemini")

        # Mock is always the final fallback
        providers_to_try.append("mock")

        errors = []
        for provider in providers_to_try:
            try:
                if provider == "gemini":
                    max_attempts = 5
                    for attempt in range(max_attempts):
                        try:
                            return await AIManager._generate_gemini(prompt, system_instruction, json_mode)
                        except httpx.HTTPStatusError as http_err:
                            status_code = http_err.response.status_code
                            err_msg = str(http_err).lower()
                            response_text = ""
                            try:
                                response_text = http_err.response.text.lower()
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
                                print(f"★ Gemini rate limited (HTTP {status_code}). Skipping retries and falling back...")
                                raise http_err
                            if attempt < max_attempts - 1:
                                print(f"★ Gemini attempt {attempt + 1} failed: {http_err}. Retrying in 5s...")
                                await asyncio.sleep(5.0)
                            else:
                                raise http_err
                        except Exception as gemini_err:
                            err_msg = str(gemini_err).lower()
                            is_rate_limit = (
                                "429" in err_msg
                                or "too many requests" in err_msg
                                or "rate limit" in err_msg
                                or "quota" in err_msg
                                or "exhausted" in err_msg
                            )
                            if is_rate_limit:
                                print(f"★ Gemini rate limited/quota exceeded. Skipping retries and falling back...")
                                raise gemini_err
                            if attempt < max_attempts - 1:
                                print(f"★ Gemini attempt {attempt + 1} failed: {gemini_err}. Retrying in 5s...")
                                await asyncio.sleep(5.0)
                            else:
                                raise gemini_err
                elif provider == "groq":
                    max_attempts = 5
                    for attempt in range(max_attempts):
                        try:
                            return await AIManager._generate_groq(prompt, system_instruction, json_mode)
                        except httpx.HTTPStatusError as http_err:
                            status_code = http_err.response.status_code
                            err_msg = str(http_err).lower()
                            response_text = ""
                            try:
                                response_text = http_err.response.text.lower()
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
                                print(f"★ Groq rate limited (HTTP {status_code}). Skipping retries and falling back...")
                                raise http_err
                            if attempt < max_attempts - 1:
                                print(f"★ Groq attempt {attempt + 1} failed: {http_err}. Retrying in 5s...")
                                await asyncio.sleep(5.0)
                            else:
                                raise http_err
                        except Exception as groq_err:
                            err_msg = str(groq_err).lower()
                            is_rate_limit = (
                                "429" in err_msg
                                or "too many requests" in err_msg
                                or "rate limit" in err_msg
                                or "quota" in err_msg
                                or "exhausted" in err_msg
                            )
                            if is_rate_limit:
                                print(f"★ Groq rate limited/quota exceeded. Skipping retries and falling back...")
                                raise groq_err
                            if attempt < max_attempts - 1:
                                print(f"★ Groq attempt {attempt + 1} failed: {groq_err}. Retrying in 5s...")
                                await asyncio.sleep(5.0)
                            else:
                                raise groq_err
                else:
                    return AIManager._generate_mock(prompt, system_instruction, json_mode)
            except Exception as provider_err:
                print(f"★ Provider '{provider}' failed in AIManager: {provider_err}")
                errors.append(f"{provider}: {provider_err}")

        # Final fallback in case all failed (should not happen since mock is bulletproof)
        raise RuntimeError(f"All AIManager text generation options failed: {', '.join(errors)}")

    @staticmethod
    async def generate_embeddings(text: str) -> List[float]:
        """Generate vector embedding for text using Gemini API (fallback to local mock)."""
        if GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
                payload = {
                    "model": "models/text-embedding-004",
                    "content": {
                        "parts": [{"text": text}]
                    }
                }
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, timeout=30.0)
                    response.raise_for_status()
                    data = response.json()
                    return data["embedding"]["values"]
            except Exception as e:
                print(f"Gemini embedding API failed: {e}. Falling back to mock embeddings.")
        
        # Zero-cost simple numerical hash embedding fallback (mock 768-dim vector)
        import hashlib
        h = hashlib.md5(text.encode('utf-8')).hexdigest()
        # Create a deterministic mock vector of length 768
        vector = []
        for i in range(768):
            val = int(h[i % len(h)], 16) / 15.0 - 0.5
            vector.append(val + (i / 1000.0))
        return vector

    @staticmethod
    async def _generate_gemini(prompt: str, system_instruction: Optional[str], json_mode: bool) -> str:
        # We will use gemini-2.5-flash as it is extremely fast and has a free tier
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }

        # Handle system instruction
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        # Configure response schema for JSON mode
        if json_mode:
            payload["generationConfig"] = {
                "responseMimeType": "application/json"
            }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=60.0)
                response.raise_for_status()
                result = response.json()
                
                # Extract text response from Gemini's JSON structure
                candidate = result["candidates"][0]
                text_response = candidate["content"]["parts"][0]["text"]
                return text_response
        except Exception as e:
            print(f"Gemini API request failed: {e}")
            raise

    @staticmethod
    async def _generate_groq(prompt: str, system_instruction: Optional[str], json_mode: bool) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": 0.2
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=AIManager.get_headers_groq(), timeout=60.0)
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Groq API request failed: {e}")
            raise

    @staticmethod
    def _generate_mock(prompt: str, system_instruction: Optional[str], json_mode: bool) -> str:
        print("★ Warning: No AI API keys found. Generating realistic mock response.")
        
        # Check if the prompt is for viral clip detection
        if "viral" in prompt.lower() or "clip" in prompt.lower() or "hook" in prompt.lower():
            if json_mode:
                return json.dumps([
                    {
                        "start_time": 5.0,
                        "end_time": 35.0,
                        "segment": "So the secret to building high-scale production systems isn't writing clever code. It's actually simplicity. Overengineering is the silent killer of MVPs.",
                        "viral_score": 94,
                        "clip_type": "hook",
                        "title": "Why Overengineering Kills Startups 💀",
                        "explanation": "Strong hook targeting developers and founders with an emotional statement aboutMVPs."
                    },
                    {
                        "start_time": 60.0,
                        "end_time": 95.0,
                        "segment": "We set up an SQLite-backed queue that processed transcription and OpenCV face tracking. It cost us exactly zero dollars. That's how we built CreatorPilot to handle hundreds of uploads on a budget.",
                        "viral_score": 88,
                        "clip_type": "educational",
                        "title": "How I Built An AI SaaS Queue For $0 💸",
                        "explanation": "Clear, actionable technical case study showing zero-cost architecture implementation."
                    },
                    {
                        "start_time": 150.0,
                        "end_time": 185.0,
                        "segment": "I remember staying up until 4 AM trying to fix an FFmpeg alignment issue. I almost gave up. But then it clicked—dynamic reframing with face tracking actually worked. And that felt amazing.",
                        "viral_score": 91,
                        "clip_type": "storytelling",
                        "title": "My 4 AM Coding Breakthrough 😭",
                        "explanation": "Highly relatable emotional struggle followed by a satisfying technical victory."
                    }
                ])
            return "This is a mock analysis for clip detection."
            
        # Check if the prompt is for captions/titles/tags
        if "caption" in prompt.lower() or "title" in prompt.lower() or "hashtag" in prompt.lower():
            if json_mode:
                return json.dumps({
                    "youtube": [
                        {"style": "viral", "text": "How I Built An AI SaaS Queue For $0 💸 (Full Guide)"},
                        {"style": "seo", "text": "Zero Cost AI SaaS Architecture Tutorial: FastAPI, Next.js & OpenCV"},
                        {"style": "educational", "text": "Step-by-Step: SQLite Background Task Worker in Python"}
                    ],
                    "instagram": [
                        {"style": "viral", "text": "Stop paying for expensive task queues! Here's how to build a multi-threaded worker using SQLite for $0. 🚀 #coding #indiehackers"},
                        {"style": "story", "text": "Spent nights debugging FFmpeg filters... but face tracking reframer is finally ALIVE. Worth it. 💻"}
                    ],
                    "linkedin": [
                        {"style": "thought-leadership", "text": "Overengineering is the silent killer of early-stage products.\n\nWhen we built CreatorPilot, we didn't spin up RabbitMQ or Celery. We kept it simple:\n- SQLite for state tracking\n- Standard Python threading worker\n\nResult? Zero server cost, zero configuration friction, and it scale-tests perfectly for MVP usage. Keep it simple.\n\n#SoftwareEngineering #Startups #SaaS"},
                        {"style": "how-to", "text": "How to build a smart camera video reframer using OpenCV and FFmpeg: \n1. Run face detection every 5 frames\n2. Smooth coordinates with moving average\n3. Dynamic crop video to 9:16 vertical\n\nFull architecture breakdown in our latest build report! 🚀"}
                    ]
                })

        # Check if it's chat-video RAG prompt
        if "rag" in prompt.lower() or "context" in prompt.lower() or "guidelines" in prompt.lower():
            return "Based on the transcript context and brand voice guidelines, here is the answer: Simplicity and zero-cost stack are critical. Avoid adding RabbitMQ or Celery for tasks; use local SQLite-backed queues instead. Emphasize developer productivity and personal anecdotes in social media posts."

        if json_mode:
            try:
                start = prompt.find('[')
                end = prompt.rfind(']')
                if start != -1 and end != -1 and end > start:
                    json_str = prompt[start:end+1]
                    json.loads(json_str)
                    return json_str
            except Exception:
                pass
            try:
                start = prompt.find('{')
                end = prompt.rfind('}')
                if start != -1 and end != -1 and end > start:
                    json_str = prompt[start:end+1]
                    json.loads(json_str)
                    return json_str
            except Exception:
                pass
            return "[]"

        return "This is a generic mock response from AIManager."
