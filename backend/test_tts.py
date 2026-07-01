import asyncio
import edge_tts

async def test_tts():
    communicate = edge_tts.Communicate("Hello world this is a test", "en-US-ChristopherNeural")
    words = []
    async for chunk in communicate.stream():
        print(chunk["type"])
        if chunk["type"] == "WordBoundary":
            words.append(chunk["text"])
    print(words)

asyncio.run(test_tts())
