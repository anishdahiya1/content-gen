# Backend — CreatorPilot AI

## Quick start

1. Install dependencies
   ```bash
   poetry install
   ```

2. Run the app
   ```bash
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API endpoints

- `GET /health` — health check
- `POST /upload` — upload a video file
- `POST /transcript` — submit a transcript generation request
