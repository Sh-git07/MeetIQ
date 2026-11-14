# MeetIQ Backend Service

Production-ready FastAPI backend for **MeetIQ** — an AI-powered executive meeting research assistant.

## Features
- **RESTful API**: Manage meetings, trigger background research, and retrieve executive briefing packages.
- **Server-Sent Events (SSE)**: Real-time progress updates through stages (`planning` → `searching` → `verifying` → `generating` → `completed` / `failed`).
- **Dynamic AI Engine Integration**: Connects dynamically with Person 3's `ai_engine.orchestrator.run_research` when present, with a rich built-in mock orchestrator for independent operation and testing.
- **ReportLab PDF Generation**: Generates high-resolution, branded executive briefing PDFs.
- **Database Layer**: SQLAlchemy ORM with PostgreSQL / Supabase, featuring automatic SQLite fallback for zero-configuration local development and testing.
- **CORS Configured**: Pre-configured for Person 1's React frontend at `http://localhost:5173`.

---

## 1. Quickstart

### Prerequisites
- Python 3.10 or 3.11+
- Virtual environment (recommended)

### Install Dependencies
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

If `DATABASE_URL` is left blank, MeetIQ will automatically use a local SQLite database (`meetiq.db`).

### Start the Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (Redoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 2. API Contract & Endpoints

### Meetings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/meetings` | Create a new meeting |
| `GET` | `/api/meetings` | List all meeting sessions |
| `GET` | `/api/meetings/{id}` | Get meeting details by ID |

#### Create Meeting Request:
```json
{
  "company": "Microsoft",
  "website": "https://microsoft.com",
  "meeting_date": "2026-11-15T15:00:00Z",
  "meeting_type": "Partnership",
  "objective": "Explore a strategic partnership",
  "additional_context": "Focus on AI products"
}
```

#### Create Meeting Response (`201 Created`):
```json
{
  "meeting_id": "meet_a1b2c3d4",
  "status": "created",
  "message": "Meeting created successfully"
}
```

---

### Research
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/meetings/{id}/research` | Start background research session |
| `GET` | `/api/research/{id}/status` | Get research progress and status |
| `GET` | `/api/research/{id}/events` | SSE event stream for live updates |

#### Research Start Response (`200 OK`):
```json
{
  "research_id": "research_e5f6g7h8",
  "status": "started",
  "message": "Research started"
}
```

#### SSE Stream Format (`text/event-stream`):
```
data: {"stage": "planning", "message": "Analyzing meeting objective...", "progress": 15, "data": {...}}

data: {"stage": "searching", "message": "Searching past 30 days of signals...", "progress": 40, "data": {...}}

data: {"stage": "completed", "message": "Briefing ready", "progress": 100, "data": {"briefing_id": "brief_12345678"}}
```

---

### Briefings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/briefings` | List synthesized briefings |
| `GET` | `/api/briefings/{id}` | Get briefing report JSON |
| `GET` | `/api/briefings/{id}/pdf` | Download formatted executive PDF |

#### Briefing Response Schema:
```json
{
  "briefing_id": "brief_12345678",
  "meeting_id": "meet_a1b2c3d4",
  "status": "completed",
  "created_at": "2026-11-14T10:00:00Z",
  "report": {
    "company": "Microsoft",
    "executive_summary": "...",
    "recent_developments": [],
    "opportunities": [],
    "risks": [],
    "questions": [],
    "sources": [],
    "research_limitations": []
  }
}
```

---

## 3. Frontend Integration (Person 1)

1. Ensure the backend is running on `http://localhost:8000`.
2. In `frontend/.env`:
   ```bash
   VITE_USE_MOCKS=false
   VITE_API_BASE_URL=http://localhost:8000
   ```
3. Run the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. All endpoints in `frontend/src/services/api.js` and `useResearchStream.js` will seamlessly communicate with this backend.

---

## 4. AI Engine Integration (Person 3)

When Person 3 delivers the AI Engine:
1. Place their package in the project root as `ai_engine/`:
   ```
   MeetIQ/
   ├── ai_engine/
   │   ├── __init__.py
   │   ├── orchestrator.py  # Must define run_research(request, progress_callback)
   │   └── ...
   ├── backend/
   └── frontend/
   ```
2. The backend (`backend/app/services/agent_adapter.py`) will automatically detect and import `from ai_engine.orchestrator import run_research`. No backend code changes required!

---

## 5. Running Automated Tests

Run the full test suite with Pytest:
```bash
pytest tests/ -v
```
