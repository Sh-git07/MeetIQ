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

*(Placeholder — to be added by backend team)*

---

## AI Agent

*(Placeholder — to be added by AI / research agent team)*
