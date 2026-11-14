# MeetIQ — Pre-Meeting Executive Intelligence Agent (Frontend)

Built for the **Global AI Hackathon 2026** (Problem 05: Pre-Meeting Briefing Agent).

MeetIQ is an AI research assistant for executives, sales leaders, partnership managers, and investors. Given a company or person, meeting date/time, and objective, MeetIQ conducts a deep investigation of public signals from the previous 30 days and synthesizes a concise, source-backed executive briefing with open questions.

---

## 1. Quick Start

### Prerequisites
- Node.js (v18+ recommended, v24+ supported)
- npm or pnpm

### Installation & Development
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

The app will run locally at `http://localhost:5173`.

---

## 2. Mock vs Real Mode

The frontend ships fully functional with realistic mock data and real-time SSE stream simulation. You can switch to the live FastAPI backend by editing `.env` without modifying any UI code.

### Configuration (`.env`)
```bash
# Backend endpoint
VITE_API_BASE_URL=http://localhost:8000

# Set to true for mock mode, false to connect to FastAPI backend
VITE_USE_MOCKS=true
```

### Switching to the Real Backend:
1. Set `VITE_USE_MOCKS=false` in `.env`.
2. Update `VITE_API_BASE_URL` if your FastAPI backend runs on a different port/host.
3. Restart Vite (`npm run dev`).

---

## 3. Project Structure

```
meetiq-frontend/
├── index.html                     # Root HTML template with Google Fonts
├── vite.config.js                 # Vite + React + Tailwind v4 config
├── package.json                   # Dependencies and scripts
├── .env.example                   # Environment variable template
├── .env                           # Local environment config
├── src/
│   ├── main.jsx                   # React entry point with BrowserRouter
│   ├── App.jsx                    # Root app layout, route transitions & providers
│   ├── index.css                  # Tailwind v4, design tokens & typography
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.jsx         # Adaptive, animated navbar (marketing vs app modes)
│   │   ├── effects/
│   │   │   ├── ScannerField.jsx   # Interactive 2D canvas particle grid with lens physics
│   │   │   ├── TextMagnifier.jsx  # Non-reflowing inline text scale magnifier
│   │   │   └── Constellation.jsx  # 2D canvas orbiting sources & briefing sheet assemble
│   │   ├── ui/
│   │   │   ├── Button.jsx         # Magnetic primary and ghost buttons
│   │   │   ├── Input.jsx          # Auto-sizing inline underlined inputs
│   │   │   ├── Select.jsx         # Underlined inline select input
│   │   │   ├── Badge.jsx          # Semantic status indicator pills
│   │   │   ├── Skeleton.jsx       # Loading skeletons for briefing & list rows
│   │   │   └── EmptyState.jsx     # Clean empty states with calls-to-action
│   │   ├── briefing/
│   │   │   ├── CitationMarker.jsx # Interactive superscript citation chips
│   │   │   ├── SourceCard.jsx     # Deep cream source cards with category color bar
│   │   │   ├── CoveragePanel.jsx  # Signal coverage bars (no fake confidence scores)
│   │   │   └── LimitationsBox.jsx # Amber permanent research limitations callout
│   │   └── research/
│   │       ├── StageIndicator.jsx # Live stage name, percentage & progress line
│   │       ├── ActivityLog.jsx    # Monospace chronological activity stream
│   │       └── QueryPills.jsx     # Underlined search query tags
│   ├── pages/
│   │   ├── Landing.jsx            # Hero screen with typed terminal and stats
│   │   ├── HowItWorks.jsx         # 4-stage pipeline with travelling glow dot
│   │   ├── Dashboard.jsx          # Executive dashboard with ruled lists
│   │   ├── NewBriefing.jsx        # Conversational inline-form meeting scheduler
│   │   ├── Research.jsx           # Live research workspace (no-nav focus mode)
│   │   ├── Briefing.jsx           # 3-column editorial briefing layout & PDF export
│   │   ├── History.jsx            # Searchable, filterable, sortable briefings
│   │   ├── Settings.jsx           # Profile, preferences & accessibility options
│   │   └── NotFound.jsx           # 404 signal lost page
│   ├── services/
│   │   └── api.js                 # Central Axios instance & error-normalizing methods
│   ├── mocks/
│   │   ├── mockData.js            # 9 meetings & 3 rich briefings with relative dates
│   │   └── mockStream.js          # Simulated SSE stream emitter with FailTest script
│   ├── hooks/
│   │   ├── useToast.jsx           # Floating status toasts
│   │   ├── useMeetings.js         # Meetings state & creation orchestrator
│   │   ├── useBriefing.js         # Single briefing fetcher with normalization
│   │   ├── useBriefings.js        # Briefing list query
│   │   ├── useResearchStream.js   # SSE / mock stream hook with reconnect recovery
│   │   └── useSettings.js         # LocalStorage settings persistence
│   └── utils/
│       ├── normalizeBriefing.js   # Defensive shape normalizer for API contract
│       └── formatters.js          # Date freshness, time & category color formatters
```

---

## 4. Design System & Design Tokens

The UI is **type-led and metaphor-driven**, drawing inspiration from high-end editorial publications and financial journalism rather than generic dashboard cards.

### Colors & Tokens
- **Page Background:** Warm cream `#FAF3E8`. Deeper cream `#F0E6D4`. Raised cream `#FDF8EF`. **Zero pure white.**
- **Ambient Page Glow:** Fixed soft peach `rgba(246,205,196,0.5)` top-left, soft yellow `rgba(245,229,127,0.35)` bottom-right.
- **Ink (Text):** `#1B1630`.
- **Muted Text:** `#665F75`.
- **Hairlines:** `rgba(27,22,48,0.15)`.
- **Accent Gradient (Fills):** `linear-gradient(90deg, hsla(52,82%,52%,1) 0%, hsla(1,92%,47%,1) 100%)` (`#E9D022` → `#E60B09`).
- **Readable Accent Gradient (Large Numerals):** `linear-gradient(90deg, #D48F00, #E60B09)`.
- **Flat Accents:** Red `#E60B09`, Yellow `#E9D022`, Deep Red `#C21A12`.
- **Citation Chip Background:** `#F5E8A8`.
- **Semantic Badges:** Sage `#D3E6CF` (verified/success), Butter `#F2DDA0` (limitations), Deep red `#C21A12` (errors).
- **Source Categories:**
  - Product: `#E60B09`
  - People / Leadership: `#1B1630`
  - Financials / Pricing: `#D4A300`
  - Press / News: `#3F7D58`

### Typography
- **Headings:** *Bricolage Grotesque* (800 weight, sentence case, tight tracking `-0.04em`, line-height `0.94`).
- **Body:** *DM Sans* (400, 500, 700).
- **Metadata, IDs, Dates, Labels:** *JetBrains Mono* (400, 500).

---

## 5. Ambient Cursor Behaviors & How to Disable Them

1. **ScannerField (Canvas 2D):**
   A grid of dots (~40px spacing). An interactive lens (radius ~120px) gently pushes dots outward with spring physics and tints them with the yellow→red gradient. Approx. 6% of dots reveal research labels near the lens. Idle for 3 seconds causes the lens to wander slowly. Clicking ripples through the field.
2. **TextMagnifier:**
   Scales words near the cursor by up to ~6% using `transform: scale()` only—zero layout reflows or jumps.
3. **Magnetic Buttons:**
   Primary buttons lean gently (~14%) toward the cursor within 80px radius.

### Accessibility & Disabling Motion:
- System `prefers-reduced-motion: reduce` automatically disables particle motion, text scaling, constellation spinning, and button attraction.
- Users can also toggle **"Force Reduced Motion"** directly in **Settings (`/settings`)**.
- Only activated on fine-pointer devices (`(pointer: fine)`). Touch devices run zero cursor listeners.

---

## 6. Shared API Contract

All non-streaming calls are mediated through `services/api.js`.

### Endpoints
- `POST /api/meetings` — Create meeting object.
- `GET /api/meetings` — List all meetings.
- `GET /api/meetings/{id}` — Fetch specific meeting metadata.
- `POST /api/meetings/{id}/research` — Initiate research run for a meeting.
- `GET /api/research/{id}/status` — Current status and stage of a research task.
- `GET /api/research/{id}/events` — SSE stream emitting live research events.
- `GET /api/briefings` — List generated executive briefings.
- `GET /api/briefings/{id}` — Retrieve detailed briefing report.
- `GET /api/briefings/{id}/pdf` — Download briefing as binary PDF blob.

### Event Format (SSE)
```json
{
  "stage": "searching",
  "message": "Searching recent developments",
  "progress": 40,
  "data": {
    "queries": ["microsoft partner revenue share"],
    "sources": [
      {
        "id": "1",
        "title": "Microsoft Official Blog",
        "publisher": "Microsoft Blog",
        "url": "https://blogs.microsoft.com",
        "published_at": "2026-11-10T12:00:00Z",
        "category": "product"
      }
    ],
    "verification": {
      "verified_ids": ["1"]
    }
  }
}
```
*Note on Optional `data`:* The `data` field is additive. If the backend emits events without `data`, the UI gracefully renders stage, progress, and activity message without errors.

---

## 7. QA & Verification Checklist

- [x] **Install & Build:** `npm install` and `npm run build` execute cleanly with zero errors.
- [x] **Route Deep Linking:** Direct access and browser page refreshes work on `/`, `/how`, `/dashboard`, `/new`, `/research/:researchId`, `/briefings/:briefingId`, `/history`, and `/settings`.
- [x] **Constellation Dual Mode:**
  - `hero` mode (Landing): Assembles on hover and on periodic loop; displays orbiting source stars.
  - `research` mode: Driven strictly by events; nodes appear when sources are delivered; turns solid upon verification; assembles into sheet on completion.
- [x] **FailTest Error Handling:** Entering `"FailTest"` as the company on `/new` triggers the simulated failure scenario on `/research`, displaying the error alert, dimming constellation nodes, turning the core ring deep red, and exposing the Retry button.
- [x] **Briefing Citations:** Hovering on citation chip `[1]` highlights Source card `#1` (and hovering Source card highlights its citation chips).
- [x] **Questions Copy:** Clicking "copy" on any question copies the prompt to the clipboard, changes label to "copied", and shows toast notification.
- [x] **Form Validation:** `/new` validates required company, valid URL structure, future meeting timestamp, and 10+ character objective with accessible `role="alert"` announcements.
- [x] **Search & Filters:** `/history` dynamically filters by status, meeting type, keyword search, and sorts by date.
- [x] **Responsive Design:** Holds layout on mobile (<600px), tablet (<900px), and desktop (>1200px).
