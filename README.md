# MeetIQ

> AI-powered pre-meeting briefing agent (Global AI Hackathon 2026, Problem 05).

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tavily](https://img.shields.io/badge/Tavily-Search%20API-4F46E5.svg)](https://tavily.com/)
[![Bifrost](https://img.shields.io/badge/Bifrost-LLM%20Gateway-FF6B6B.svg)](https://github.com/maxim-ai/bifrost)

🌐 **Live Demo / Deployed App:** [https://meet-iq-lemon.vercel.app/](https://meet-iq-lemon.vercel.app/)

---

## 1. Problem

Preparing for high-stakes executive meetings (partnerships, client sales, investor discussions) requires hours of tedious manual research across company blogs, news wires, press releases, and earnings calls. 

Public information is scattered, frequently outdated beyond 30 days, repetitive, and lacks source verification. Busy professionals are often forced into critical meetings with unverified claims, outdated context, and strategic blind spots.

---

## 2. What MeetIQ Does

MeetIQ takes meeting parameters and synthesizes a verified, source-backed executive briefing within minutes:

- **Input**:
  - Target company name (e.g., `Microsoft`)
  - Official website URL (optional, e.g., `https://microsoft.com`)
  - Scheduled meeting date (`ISO 8601`, e.g., `2026-11-15T15:00:00Z`)
  - Meeting type (`Partnership`, `Sales`, `Investor meeting`, `Client meeting`, `Business development`)
  - Primary meeting objective (e.g., `Explore a strategic partnership around enterprise agentic workflows`)
  - Additional context (e.g., `Focus on AI products and enterprise cloud synergies`)

- **Output**:
  - **Structured Executive Briefing JSON** with source-grounded developments and citations.
  - **Downloadable Executive PDF** formatted with ReportLab containing branding, metadata, executive callouts, and numbered citations.

### Briefing Contents
1. **Executive Summary**: Strategic overview tailored to the meeting objective.
2. **Recent Developments**: Verified events from the past 30 days with importance ratings (`high`, `medium`, `low`) and relevance justifications.
3. **Strategic Opportunities**: High-yield collaboration or business angles grounded in verified signals.
4. **Strategic Risks**: Potential challenges, native feature overlaps, or regulatory hurdles.
5. **Recommended Questions**: Strategic meeting questions designed to uncover priorities and address risks.
6. **Verified Sources**: Catalog of cited sources with canonical URLs, publishers, and publication dates.
7. **Research Limitations**: Explicit accounting of undated sources, missing evidence, or research boundaries.

---

## 3. How It Works (End to End)

```mermaid
flowchart TD
    User([Executive / User]) -->|1. Create Meeting| Frontend[React 19 Frontend<br/>Vite + Tailwind CSS]
    Frontend -->|POST /api/meetings| Backend[FastAPI Backend Server]
    Backend -->|Persist Meeting| DB[(Database<br/>Supabase PostgreSQL / SQLite)]
    
    Frontend -->|2. Start Research| Backend
    Backend -->|POST /api/meetings/:id/research| Backend
    Backend -->|Spawn Background Task| Worker[Async Background Worker<br/>execute_research_task]
    Backend -.->|200 OK + research_id| Frontend
    
    Frontend -->|3. Connect EventSource| SSE[GET /api/research/:id/events<br/>Server-Sent Events Stream]
    
    subgraph AIEngine [MeetIQ AI Research Engine]
        Worker -->|run_research| Orchestrator[Orchestrator Pipeline]
        Orchestrator --> Stage1[1. Context & 30-Day Window]
        Stage1 --> Stage2[2. Research Planner]
        Stage2 --> Stage3[3. Tavily Search]
        Stage3 --> Stage4[4. Freshness Evaluator]
        Stage4 --> Stage5[5. Claim Extractor]
        Stage5 --> Stage6[6. Evidence Verifier]
        Stage6 --> Stage7[7. Iterative Deepening]
        Stage7 --> Stage8[8. Briefing Writer]
    end
    
    Stage2 <-->|Formulate Queries| Bifrost[Bifrost LLM Gateway<br/>OpenAI-compatible]
    Stage3 <-->|Execute Searches| Tavily[Tavily Search API<br/>News & Recency Filter]
    Stage5 <-->|Extract Claims| Bifrost
    Stage6 <-->|Fact-Check Claims| Bifrost
    Stage7 <-->|Targeted Follow-ups| Tavily
    Stage8 <-->|Synthesize Report| Bifrost
    
    Orchestrator -.->|Progress Callbacks| Worker
    Worker -->|Broadcast Events| SSE
    SSE -.->|Live Stage Updates| Frontend
    
    Worker -->|Save Briefing & Sources| DB
    Frontend -->|4. Fetch Briefing JSON| Backend
    Backend -->|GET /api/briefings/:id| DB
    Frontend -->|5. Download PDF| Backend
    Backend -->|GET /api/briefings/:id/pdf| PDFGen[ReportLab PDF Generator]
    PDFGen -->|Stream PDF Bytes| User
```

### Request Lifecycle
1. **Create Meeting**: Client sends `POST /api/meetings`. FastAPI validates the request against `MeetingCreate`, writes a new `Meeting` row (status: `created`), and returns `meeting_id`.
2. **Start Research**: Client sends `POST /api/meetings/{id}/research`. FastAPI creates a `ResearchSession` row (status: `started`), marks meeting `in_progress`, and launches `execute_research_task` asynchronously in the background. Returns `research_id` immediately.
3. **Real-time SSE Connection**: Client subscribes to `GET /api/research/{id}/events`. The `ResearchStreamManager` registers an `asyncio.Queue` and replays past events for seamless reconnection.
4. **AI Pipeline Execution**: The background worker invokes `ai_engine.orchestrator.run_research()`. Safe progress callbacks stream stage transitions (`planning` → `searching` → `verifying` → `generating` → `completed`).
5. **Briefing Storage**: On pipeline completion, the worker stores the generated `Briefing` record and normalized `ResearchSource` rows, updates session and meeting statuses to `completed`, and sends a terminal SSE event with `briefing_id`.
6. **Report & PDF Delivery**: The client displays the briefing via `GET /api/briefings/{id}` or retrieves an executive PDF document via `GET /api/briefings/{id}/pdf`.

---

## 4. AI Engine Pipeline

The AI engine executes an 8-stage verification pipeline inside `ai_engine/orchestrator.py`:

| Stage | Name | Implementation Module | Technology | Core Function |
|---|---|---|---|---|
| 1 | Meeting Context Analysis | `planner.py` | Pure Python | Validates input, sanitizes dates, and computes the dynamic 30-day temporal window (`window_start` to `cutoff_date`). |
| 2 | Research Planner | `planner.py` | Bifrost / Pure Python fallback | Generates objective-tailored search queries across 5 strategic angles (launches, partnerships, leadership, financials, competitors). |
| 3 | Tavily Research | `researcher.py` | Tavily API | Dispatches news searches constrained to the 30-day window (`days=30`), deduplicating canonical URLs. |
| 4 | Freshness Filtering | `researcher.py` | Pure Python | Parses publication dates, categorizing each source as verified within the 30-day window or undated. |
| 5 | Claim Extraction | `researcher.py` | Bifrost / Pure Python fallback | Extracts factual claims grounded in the source snippets, assigning preliminary importance and relevance. |
| 6 | Evidence Verification | `verifier.py` | Bifrost / Pure Python fallback | Cross-examines extracted claims against source text, verifies temporal bounds, computes confidence scores, and flags evidence gaps. |
| 7 | Iterative Deepening | `orchestrator.py` | Tavily Search | If Stage 6 detects insufficient evidence in critical categories, runs up to 2 targeted follow-up search rounds (hard cap: `max_iterative_rounds=2`). |
| 8 | Briefing Synthesis | `writer.py` | Bifrost / Pure Python fallback | Synthesizes verified developments into executive summary, opportunities, risks, questions, source catalog, and research limitations. |

### Pipeline Guardrails & Logic
- **30-Day Freshness Window**: Computed relative to `meeting_date` (`cutoff_date - timedelta(days=30)`). Developments occurring outside this window are flagged or excluded.
- **Source Attribution**: Enforced at the Pydantic model validator level (`validate_source_integrity`). Any `source_id` referenced in developments, opportunities, or risks must exist in the canonical `sources` catalog; invalid references are pruned.
- **Conflict & Rejection Handling**: When claims fail textual grounding or are rejected during verification, they are dropped from developments and documented in `research_limitations`.
- **Research Limitations**: Automatically logs undated sources, unverified assertions, or missing public disclosures so executives know where public signals end.

---

## 5. Bifrost Integration

[Bifrost](https://github.com/maxim-ai/bifrost) is an open-source, high-performance LLM gateway developed by Maxim AI that provides an OpenAI-compatible interface (`/v1/chat/completions`) across model providers.

### How MeetIQ Uses Bifrost
- **Called By**: Stage 2 (Query Planning), Stage 5 (Claim Extraction), Stage 6 (Evidence Verification), and Stage 8 (Briefing Synthesis).
- **Client Implementation**: `ai_engine/integrations/bifrost_client.py` implements:
  - **Structured JSON Output**: Uses `response_format={"type": "json_object"}` with Pydantic validation.
  - **Bounded JSON Repair**: If an LLM response contains invalid JSON or schema violations, it runs a corrective prompt round.
  - **Rate Limit & Retry Handling**: Automatic retries with exponential backoff on HTTP `429` (rate limit) and `5xx` gateway errors.
  - **Deterministic Fallback**: If Bifrost is offline or unreachable, each pipeline module falls back to programmatic heuristic generators so research never completely halts.
- **Model Selection**: Configured via `BIFROST_MODEL` (defaults to `openai/gpt-4o-mini`).
- **Gateway Flexibility**: Switching LLM providers (e.g., from OpenAI to Anthropic, Gemini, or local models) only requires changing the Bifrost gateway configuration or `BIFROST_MODEL`, requiring zero code changes in MeetIQ.

### Bifrost Environment Variables
```env
BIFROST_BASE_URL=http://localhost:8080/v1
BIFROST_API_KEY=your_bifrost_api_key
BIFROST_MODEL=openai/gpt-4o-mini
```

---

## 6. Tavily Integration

[Tavily](https://tavily.com/) is a search engine optimized for AI agents and LLMs.

### How MeetIQ Uses Tavily
- **Called By**: Stage 3 (Primary Search) and Stage 7 (Iterative Deepening).
- **Client Implementation**: `ai_engine/integrations/tavily_client.py`:
  - **Targeted Query Categories**: Searches are generated per strategic category (e.g., `"<company>" product launch release new 2026`).
  - **Temporal News Constraint**: Passes `topic="news"` and `days=30` to enforce recency at search time.
  - **URL Canonicalization**: Strips tracking parameters (`utm_*`, `ref`, `fbclid`, `gclid`), removes `www.`, and normalizes trailing slashes to prevent duplicate sources.
  - **Metadata Ingestion**: Ingests title, canonical URL, publisher domain, published date, and raw text snippets into `NormalizedSource` objects.
  - **Iterative Deepening Rounds**: When Stage 6 verification flags insufficient evidence for a category, up to 2 targeted follow-up searches are executed with `max_results=3`.
- **Environment Variable**: `TAVILY_API_KEY`.
- **Documentation**: [Tavily API Documentation](https://docs.tavily.com/).

---

## 7. Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios | Responsive dashboard, meeting form, real-time SSE animation, report reader, PDF export |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, `pydantic-settings` | REST API, background worker orchestration, SSE streaming, input validation |
| **Database** | PostgreSQL (Supabase) + SQLAlchemy 2.0 (with SQLite fallback) | Persistence for meetings, research sessions, briefings, and sources |
| **AI Engine** | Python 3.10+, Bifrost LLM Gateway, Tavily Search API | 8-stage research pipeline, date windowing, claim extraction, verification, synthesis |
| **Document Generation** | ReportLab 4.0+ | Executive branded PDF generation with custom layout and dynamic pagination |
| **Testing** | Pytest, `pytest-mock`, `pytest-asyncio` | Unit, integration, schema validation, and mocked end-to-end testing |

---

## 8. Project Structure

```
MeetIQ/
├── ai_engine/                         # AI research engine package
│   ├── config.py                      # AI engine configuration & credential status
│   ├── orchestrator.py                # 8-stage pipeline coordinator & run_research entrypoint
│   ├── planner.py                     # Stage 1 & 2: Context analysis & query planning
│   ├── researcher.py                  # Stage 3, 4 & 5: Tavily search, recency, claim extraction
│   ├── schemas.py                     # Pydantic schemas (MeetingRequest, ExecutiveBriefing, etc.)
│   ├── verifier.py                    # Stage 6: Evidence verification & temporal checking
│   ├── writer.py                      # Stage 8: Executive briefing synthesis
│   ├── integrations/
│   │   ├── bifrost_client.py          # Bifrost LLM gateway client (OpenAI-compatible)
│   │   └── tavily_client.py           # Tavily Search API client with URL canonicalization
│   ├── prompts/                       # Externalized prompt templates (planning, extraction, verification, briefing)
│   └── tests/                         # AI engine test suite (unit + mocked integration)
├── backend/                           # FastAPI backend service
│   ├── app/
│   │   ├── config.py                  # Backend settings (DB URL, CORS, SQLite fallback)
│   │   ├── main.py                    # FastAPI application, CORS middleware, lifespan
│   │   ├── models/
│   │   │   ├── database_models.py     # SQLAlchemy ORM models (Meeting, ResearchSession, Briefing, Source)
│   │   │   └── schemas.py             # FastAPI request/response Pydantic models
│   │   ├── routes/
│   │   │   ├── briefings.py           # GET /api/briefings, GET /api/briefings/:id, PDF export
│   │   │   ├── meetings.py            # POST/GET /api/meetings, GET /api/meetings/:id
│   │   │   └── research.py            # POST /api/meetings/:id/research, status, SSE stream
│   │   ├── services/
│   │   │   ├── agent_adapter.py       # Integration adapter connecting backend to ai_engine
│   │   │   ├── database.py            # Database engine, sessionmaker, init_db()
│   │   │   ├── pdf_generator.py       # ReportLab PDF generator
│   │   │   └── research_manager.py    # Async pub/sub SSE event broker
│   │   └── utils/
│   │       └── helpers.py             # ID generation (meet_, research_, brief_) and datetime helpers
│   ├── requirements.txt               # Backend dependencies
│   ├── .env.example                   # Backend environment template
│   └── tests/                         # Backend test suite (meetings, research, briefings)
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── components/                # UI components (briefing cards, activity logs, stage indicator)
│   │   ├── hooks/                     # Custom hooks (useResearchStream, useMeetings, useBriefing)
│   │   ├── pages/                     # Pages (Dashboard, NewBriefing, Research, Briefing, History)
│   │   └── services/api.js            # Axios client with mock mode toggle
│   ├── package.json                   # Frontend dependencies
│   └── .env.example                   # Frontend environment template
├── requirements.txt                   # Root / AI engine dependencies
├── sample_input.json                  # Sample meeting input payload
├── sample_output.json                 # Sample generated executive briefing
├── .env.example                       # Root environment template (Bifrost & Tavily)
└── README.md                          # Project documentation
```

---

## 9. Quick Start

You can run MeetIQ in **Mock Mode** (no API keys required) or in **Live Mode** (with Bifrost, Tavily, and Supabase).

### Option A: Mock Mode (Zero Keys Needed, < 2 Minutes)

1. **Start the Backend**:
   ```bash
   cd backend
   # Leave DATABASE_URL empty in .env to use automatic SQLite fallback
   cp .env.example .env
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *Backend is running at `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`).*

2. **Start the Frontend**:
   ```bash
   cd frontend
   cp .env.example .env
   # Ensure VITE_USE_MOCKS=true in frontend/.env
   npm install
   npm run dev
   ```
   *Frontend is running at `http://localhost:5173` with simulated research streaming.*

---

### Option B: Live Mode (Full Pipeline with Real Keys)

#### 1. Configure Root Environment (AI Engine)
Copy the root `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
Populate your credentials in `.env`:
```env
BIFROST_BASE_URL=http://localhost:8080/v1
BIFROST_API_KEY=your_bifrost_api_key
BIFROST_MODEL=openai/gpt-4o-mini
TAVILY_API_KEY=tvly-your_tavily_key
```

#### 2. Configure & Start Backend
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env`:
```env
# Supabase PostgreSQL connection string (or leave empty for local SQLite)
DATABASE_URL=postgresql+psycopg2://postgres.xxxx:password@aws-1-xx.pooler.supabase.com:5432/postgres
FRONTEND_URL=http://localhost:5173
PORT=8000
```
Install dependencies and launch the backend:
```bash
pip install -r requirements.txt
pip install -r ../requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### 3. Configure & Start Frontend
```bash
cd frontend
cp .env.example .env
```
Edit `frontend/.env` to connect to the live backend:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCKS=false
```
Install dependencies and start the Vite dev server:
```bash
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 10. Environment Variables

| Variable | Required / Optional | Used By | Description & Example Placeholder |
|---|---|---|---|
| `BIFROST_BASE_URL` | Optional | AI Engine (`ai_engine/config.py`) | Base URL for Bifrost LLM gateway. Default: `http://localhost:8080/v1` |
| `BIFROST_API_KEY` | Required for Live LLM | AI Engine (`ai_engine/config.py`) | Authentication key for Bifrost. Example: `bf_sec_xxxx` |
| `BIFROST_MODEL` | Optional | AI Engine (`ai_engine/config.py`) | Model routed through Bifrost. Default: `openai/gpt-4o-mini` |
| `TAVILY_API_KEY` | Required for Live Search | AI Engine (`ai_engine/config.py`) | API key for Tavily search. Example: `tvly-xxxx` |
| `DATABASE_URL` | Optional | Backend (`backend/app/config.py`) | PostgreSQL / Supabase connection URL. If empty, falls back to SQLite (`meetiq.db`). |
| `SUPABASE_URL` | Optional | Backend (`backend/app/config.py`) | Supabase project URL. Example: `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | Optional | Backend (`backend/app/config.py`) | Supabase service/anon key. |
| `FRONTEND_URL` | Optional | Backend (`backend/app/config.py`) | Allowed CORS origin. Default: `http://localhost:5173` |
| `VITE_API_BASE_URL`| Required for Live FE | Frontend (`frontend/src/services/api.js`) | Backend endpoint URL. Default: `http://localhost:8000` |
| `VITE_USE_MOCKS` | Optional | Frontend (`frontend/src/services/api.js`) | Set `false` for live backend, `true` for client-only mock. Default: `true` |

---

## 11. API Reference

### Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/meetings` | Create a new executive meeting research session |
| `GET` | `/api/meetings` | List all created meetings |
| `GET` | `/api/meetings/{id}` | Retrieve single meeting details by ID |
| `POST` | `/api/meetings/{id}/research` | Start background research session for a meeting |
| `GET` | `/api/research/{id}/status` | Retrieve status and progress of a research session |
| `GET` | `/api/research/{id}/events` | SSE stream for real-time progress events |
| `GET` | `/api/briefings` | List synthesized executive briefings |
| `GET` | `/api/briefings/{id}` | Retrieve full briefing JSON by briefing ID |
| `GET` | `/api/briefings/{id}/pdf` | Download formatted ReportLab briefing PDF |
| `GET` | `/health` | Health check probe (reports DB dialect and status) |

---

### Example Payloads

#### 1. Create Meeting
**`POST /api/meetings`**
```json
{
  "company": "Microsoft",
  "website": "https://microsoft.com",
  "meeting_date": "2026-11-15T15:00:00Z",
  "meeting_type": "Partnership",
  "objective": "Explore a strategic partnership around enterprise agentic workflows",
  "additional_context": "Focus on AI products and cloud synergies"
}
```
**Response (`201 Created`):**
```json
{
  "meeting_id": "meet_c95b0a2f",
  "status": "created",
  "message": "Meeting created successfully"
}
```

#### 2. Start Research
**`POST /api/meetings/meet_c95b0a2f/research`**
```json
{}
```
**Response (`200 OK`):**
```json
{
  "research_id": "research_6e5957cc",
  "status": "started",
  "message": "Research started"
}
```

#### 3. Research Status
**`GET /api/research/research_6e5957cc/status`**
**Response (`200 OK`):**
```json
{
  "research_id": "research_6e5957cc",
  "meeting_id": "meet_c95b0a2f",
  "status": "completed",
  "progress": 100,
  "current_stage": "completed",
  "stage": "completed",
  "error_message": null,
  "started_at": "2026-11-15T10:00:00Z",
  "completed_at": "2026-11-15T10:00:45Z",
  "briefing_id": "brief_4a8b12e3"
}
```

#### 4. Server-Sent Events (SSE) Stream
**`GET /api/research/research_6e5957cc/events`** (`text/event-stream`)
```
data: {"stage": "planning", "message": "Analyzing meeting context and computing date windows", "progress": 10}

data: {"stage": "searching", "message": "Searching public sources across 5 categories", "progress": 35, "data": {"queries": ["..."]}}

data: {"stage": "verifying", "message": "Cross-checking claims and temporal boundaries", "progress": 65, "data": {"sources": [...]}}

data: {"stage": "generating", "message": "Synthesizing executive briefing document", "progress": 90}

data: {"stage": "completed", "message": "Executive briefing generation complete", "progress": 100, "data": {"briefing_id": "brief_4a8b12e3"}}
```

The six SSE stages are: `planning`, `searching`, `verifying`, `generating`, `completed`, and `failed`.

---

## 12. Output Schema

The executive briefing output adheres strictly to the `ExecutiveBriefing` schema (verified against `sample_output.json`):

```json
{
  "company": "Microsoft",
  "executive_summary": "In the past 30 days, Microsoft expanded its enterprise agentic AI footprint, rolled out automated autonomous agent orchestration across Azure AI Foundry, and strengthened its secure cloud data boundary for enterprise copilot deployments. These initiatives align directly with the proposed partnership objective by opening clear integration avenues for agentic infrastructure, enterprise security compliance, and joint co-selling opportunities across enterprise accounts.",
  "recent_developments": [
    {
      "title": "Launch of Azure AI Foundry Agent Orchestration SDK",
      "description": "Microsoft introduced multi-agent orchestration tools within Azure AI Foundry to enable developers to deploy coordinated autonomous agent clusters with built-in evaluation and guardrails.",
      "date": "2026-11-04",
      "importance": "high",
      "meeting_relevance": "Directly impacts joint agentic workflow architectures and SDK compatibility.",
      "source_ids": [
        "src_001"
      ]
    },
    {
      "title": "Strategic Enterprise Copilot Security Enhancement",
      "description": "Microsoft updated enterprise data boundaries to ensure customer tenant isolation during agentic execution and external web grounding.",
      "date": "2026-10-28",
      "importance": "high",
      "meeting_relevance": "Addresses enterprise compliance requirements for joint deployment.",
      "source_ids": [
        "src_002"
      ]
    }
  ],
  "opportunities": [
    {
      "title": "Joint Agentic Enterprise Solution Integration",
      "description": "Integrate agent orchestration capabilities directly into Azure AI Foundry marketplace to reach mutual enterprise customers.",
      "source_ids": [
        "src_001"
      ]
    },
    {
      "title": "Co-Sell Enterprise Security Alignment",
      "description": "Leverage Microsoft's new tenant isolation standards to co-market compliant agentic workflows to Fortune 500 prospects.",
      "source_ids": [
        "src_002"
      ]
    }
  ],
  "risks": [
    {
      "title": "Native Feature Overlap",
      "description": "Rapid development of internal Microsoft agent building blocks may create competitive pressure on third-party agent frameworks.",
      "source_ids": [
        "src_001"
      ]
    }
  ],
  "questions": [
    "How does your team view third-party orchestration frameworks integrating alongside native Azure AI Foundry agent tools?",
    "What are Microsoft's preferred commercial structures for joint enterprise co-selling in the AI agent domain over the next two quarters?",
    "Which customer compliance requirements currently present the greatest friction for enterprise agent adoption on Azure?"
  ],
  "sources": [
    {
      "source_id": "src_001",
      "title": "Azure AI Foundry Unveils Coordinated Multi-Agent Orchestration",
      "url": "https://azure.microsoft.com/en-us/blog/azure-ai-foundry-agent-orchestration/",
      "publisher": "Microsoft Azure Blog",
      "published_at": "2026-11-04"
    },
    {
      "source_id": "src_002",
      "title": "Microsoft Bolsters Data Security Boundaries for Enterprise Copilots",
      "url": "https://news.microsoft.com/2026/10/28/copilot-data-security-updates/",
      "publisher": "Microsoft News Center",
      "published_at": "2026-10-28"
    }
  ],
  "research_limitations": []
}
```

---

## 13. Testing

### Run AI Engine Tests
```bash
python -m pytest ai_engine/tests -v
```
- **Coverage**: 20 automated tests covering time window calculation, query planning, objective differentiation, Tavily canonicalization, 30-day freshness filtering, claim extraction, evidence verification, conflict handling, and schema validation.
- **Result**: `19 passed, 1 skipped`.
- **Live Integration Test**: `test_live_genuine_end_to_end` in `ai_engine/tests/test_integration.py` is automatically skipped when `BIFROST_API_KEY` or `TAVILY_API_KEY` is not present in `.env` via `@pytest.mark.skipif(not config.has_live_credentials())`. To run the live test against actual APIs, add your keys to `.env` and rerun pytest.

### Run Backend Tests
```bash
python -m pytest backend/tests -v
```
- **Coverage**: 12 tests covering meeting creation, retrieval, validation error handling, research session initialization, SSE connectivity, failure simulation (`FailTest`), briefing endpoints, and ReportLab PDF binary export (`%PDF-` header check).

---

## 14. Deployment

- **Frontend**: Deployed on Vercel at [https://meet-iq-lemon.vercel.app/](https://meet-iq-lemon.vercel.app/).
  - Configured with environment variables `VITE_API_BASE_URL` pointing to the live backend and `VITE_USE_MOCKS=false`.
- **Backend & AI Engine**: Designed for containerized deployment (e.g., Docker, AWS ECS, Google Cloud Run, Render, or Railway) running `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **Database**: Hosted PostgreSQL managed via Supabase.

---

## 15. Limitations and Roadmap

### Known Limitations
- **Public Web Reliance**: The research pipeline only accesses publicly indexed web content via Tavily. Proprietary data, private pitch decks, or information behind paywalls cannot be ingested.
- **Date Metadata Inconsistency**: Some third-party websites do not publish structured machine-readable publication dates. These sources are conservatively marked as undated in `research_limitations`.
- **Bifrost Local Standalone Dependency**: When running the live AI engine pipeline locally without an active Bifrost instance at `http://localhost:8080`, gateway retries can introduce a 30-40 second latency before falling back to deterministic generation.

### Planned Features
- **[Planned] Multi-Calendar Integration**: Direct OAuth integration with Google Calendar and Microsoft Outlook to automatically ingest upcoming meetings and trigger briefing synthesis 24 hours in advance.
- **[Planned] Private Document Grounding**: Ingestion of internal CRM notes (HubSpot, Salesforce) and past meeting transcripts to cross-reference internal intelligence with public signals.
- **[Planned] Executive Person Profiling**: Deep-dive biographical and strategic profiling on individual meeting attendees in addition to company-level intelligence.

---

## 16. Team

Built for the **Global AI Hackathon 2026 (Problem 05)**:

- **Person 1 — Frontend Engineer**: React 19 UI, Tailwind CSS design system, SSE event consumption, state management, and Vercel deployment.
- **Person 2 — Backend Engineer**: FastAPI service, PostgreSQL/Supabase database models, SSE streaming broker, ReportLab PDF generation, and automated test suite.
- **Person 3 — AI Research Engineer**: 8-stage research pipeline, Bifrost LLM gateway integration, Tavily search orchestration, temporal verification, and briefing synthesis.
