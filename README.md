# MeetIQ

> AI-powered pre-meeting briefing agent (Global AI Hackathon 2026, Problem 05).

MeetIQ researches public signals from the past 30 days around a company or executive to synthesize a concise, source-backed executive briefing before your meeting.

---

## Frontend

### Setup & Run

```bash
cd frontend
npm install
npm run dev
```

### Mock vs Live Backend
The frontend runs in **mock API mode** by default (`VITE_USE_MOCKS=true` in `frontend/.env.example`; copy it to `frontend/.env` to configure).

To connect to the real backend:
1. In `frontend/.env`, set `VITE_USE_MOCKS=false`.
2. Set `VITE_API_BASE_URL=http://localhost:8000` (or your backend URL).

---

## Backend

FastAPI backend with background research orchestration, real-time SSE streaming, ReportLab PDF generation, and PostgreSQL / Supabase with SQLite fallback.

### Setup & Run

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Run Tests: `pytest tests/ -v` (inside `backend/`)

---

## AI Agent

*(Placeholder — to be added by AI / research agent team)*
