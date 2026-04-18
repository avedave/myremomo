import httpx
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Ollama Web UI")

# Allow CORS for local development if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434"

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/api/models")
async def get_models():
    """Fetch available models from local Ollama"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Ollama: {exc}")
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"Ollama returned an error: {exc}")

@app.post("/api/chat")
async def chat(request: Request):
    """Proxy chat request to Ollama and stream back the response"""
    data = await request.json()
    model = data.get("model")
    messages = data.get("messages", [])
    
    if not model or not messages:
        raise HTTPException(status_code=400, detail="Model and messages are required")

    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }

    async def generate_stream():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload, timeout=None) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except Exception as e:
                yield json.dumps({"error": str(e)}).encode()

    return StreamingResponse(generate_stream(), media_type="application/x-ndjson")

@app.get("/")
async def root():
    """Redirect root to the static index.html"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9999)
