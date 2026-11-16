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

## AI Agent Engine (`ai_engine`)

The MeetIQ AI Agent Engine is an autonomous multi-stage research and verification pipeline designed for executive pre-meeting intelligence. It gathers, filters, extracts, verifies, and synthesizes 30-day temporal signals into objective-tailored executive briefings.

### Pipeline Stages
1. **Meeting Context Analysis**: Parses meeting parameters, computes the 30-day freshness window before the cutoff date.
2. **Research Planner**: Formulates objective-tailored queries categorized across product launches, partnerships, leadership/financial shifts, competition, and regulatory compliance via Bifrost.
3. **Tavily Research**: Executes targeted multi-query web searches with URL canonicalization and source metadata capture.
4. **Freshness & Temporal Filtering**: Strictly evaluates publication dates within the 30-day window; isolates verified recent signals from undated or historical context.
5. **Claim Extraction**: Extracts structured developments with source attribution using Bifrost.
6. **Evidence Verification**: Fact-checks claims against source texts, enforces ground-truth checks, and flags conflicts.
7. **Iterative Deepening**: Identifies sparse categories and executes up to 2 targeted follow-up search rounds.
8. **Briefing Synthesis**: Produces a strictly-typed executive briefing conforming to the mandatory Pydantic schema.

---

### Setup & Environment

1. **Activate Virtual Environment & Install Dependencies**:
   ```bash
   # From the repository root (MeetIQ):
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your credentials:
   ```env
   BIFROST_BASE_URL=http://localhost:8080/v1
   BIFROST_API_KEY=your-bifrost-api-key
   BIFROST_MODEL=openai/gpt-4o-mini
   TAVILY_API_KEY=tvly-your-tavily-api-key
   ```
   *(Note: Never commit your `.env` file to source control).*

---

### Instructions for Person 2 (Backend Integration)

Person 2 can import and invoke the engine directly without any frontend or backend dependencies:

```python
from ai_engine.orchestrator import run_research

# 1. Define meeting data (dict)
meeting_data = {
    "meeting_id": "meet_001",
    "company": "Microsoft",
    "website": "https://microsoft.com",
    "meeting_date": "2026-11-15T15:00:00Z",
    "meeting_type": "Partnership",
    "objective": "Explore a strategic partnership around enterprise agentic workflows",
    "additional_context": "Focus on AI products and enterprise cloud synergies"
}

# 2. Define optional progress callback
def on_progress(event: dict):
    # event schema: {"stage": str, "message": str, "progress": int}
    # stages: "planning", "searching", "verifying", "generating", "completed", "failed"
    print(f"[{event['stage']}] {event['progress']}% - {event['message']}")

# 3. Execute research workflow
briefing = run_research(request=meeting_data, progress_callback=on_progress)
```

#### Progress Callback Protocol
- Handled gracefully: a failing or missing callback will never crash the research pipeline.
- Callback receives a dictionary:
  ```python
  {
      "stage": "planning" | "searching" | "verifying" | "generating" | "completed" | "failed",
      "message": "Human-readable status description",
      "progress": 0 to 100
  }
  ```

#### Output Schema (`ExecutiveBriefing`)
The return value is a validated Python dictionary matching:
```json
{
  "company": "Microsoft",
  "executive_summary": "Concise executive briefing text...",
  "recent_developments": [
    {
      "title": "Development headline",
      "description": "Factual description grounded in evidence",
      "date": "2026-11-10",
      "importance": "high",
      "meeting_relevance": "Strategic relevance to meeting objective",
      "source_ids": ["src_001"]
    }
  ],
  "opportunities": [
    {
      "title": "Collaboration opportunity",
      "description": "Evidence-linked opportunity description",
      "source_ids": ["src_001"]
    }
  ],
  "risks": [
    {
      "title": "Market or execution risk",
      "description": "Evidence-linked risk description",
      "source_ids": ["src_002"]
    }
  ],
  "questions": [
    "High-impact strategic question to ask in the meeting?"
  ],
  "sources": [
    {
      "source_id": "src_001",
      "title": "Source headline",
      "url": "https://...",
      "publisher": "Domain name",
      "published_at": "2026-11-10"
    }
  ],
  "research_limitations": []
}
```

---

### Running Tests

Run the full automated test suite with pytest:

```bash
# Run unit tests (integrations mocked, live test skipped when keys missing)
pytest ai_engine/tests -v

# Run with coverage report
pytest ai_engine/tests --cov=ai_engine -v
```

#### Running Live End-to-End Tests
To run the genuine live integration test against real Bifrost and Tavily endpoints:
1. Ensure `BIFROST_API_KEY` and `TAVILY_API_KEY` are populated in your local `.env`.
2. Run:
   ```bash
   pytest ai_engine/tests/test_integration.py -k "test_live_genuine_end_to_end" -v -s
   ```
   If credentials are missing or empty, this test is cleanly and automatically skipped.
