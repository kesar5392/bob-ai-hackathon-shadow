# SupplyChain Sentinel — MVP Plan

## Overview

Build a beginner-friendly, fully functional MVP of a Supply Chain Disruption Assistant
and Fleet Utilization Optimizer called **SupplyChain Sentinel**.

The application shows a logistics control-tower dashboard that:
- Displays live (polled) shipment and disruption data.
- Calculates risk scores for shipments affected by disruptions.
- Recommends rerouting or alternative fleet assets.
- Monitors cold-chain temperature and flags excursions.
- Provides AI-assisted explanations via an OpenAI-compatible endpoint (watsonx.ai ready).

### Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | React (Vite) + Tailwind CSS       |
| Backend      | Node.js + Express                 |
| Data         | JSON flat-files (seed data)       |
| AI           | OpenAI SDK (watsonx.ai-compatible)|
| Comms        | REST polling (every 5 s)          |

### Folder Layout

```
supplychain-sentinel/
  backend/
    data/               ← JSON seed files
    routes/             ← Express route handlers
    services/           ← riskEngine + aiService
    server.js
    package.json
  frontend/
    src/
      components/       ← React UI components
      api.js            ← all fetch helpers
      App.jsx
      main.jsx
    index.html
    package.json
  .env.example
  README.md
```

---

## Sub-Task 1 — Project Scaffold & Seed Data

**Status:** [ ] pending

### Intent
Set up the project skeleton so every following sub-task has a working place to add code.
Create realistic JSON seed data that powers the entire demo.

### Expected Outcomes
- `backend/` has a running Express server on port 4000 with a `/health` endpoint.
- `frontend/` bootstraps with Vite + React and shows "SupplyChain Sentinel" on screen.
- `.env.example` lists every required environment variable.
- `README.md` explains how to start both apps with two commands.
- Three seed JSON files exist with 8–12 realistic records each.

### Todo List
1. Create `backend/package.json` with dependencies: `express`, `cors`, `dotenv`, `openai`.
2. Create `backend/server.js` — Express app, CORS, JSON body-parser, `/health` route, port from env.
3. Create `backend/data/shipments.json` — 10 shipments with fields:
   `id, origin, destination, carrier, route, status, cargo_type, eta, lat, lng`.
4. Create `backend/data/disruptions.json` — 6 disruptions with fields:
   `id, type, severity, affected_region, affected_routes[], description, start_date`.
5. Create `backend/data/cold-chain.json` — 8 readings with fields:
   `shipment_id, timestamp, temp_celsius, min_ok, max_ok, location`.
6. Create `frontend/` using Vite React template config (`package.json`, `vite.config.js`).
7. Install Tailwind CSS in the frontend.
8. Create minimal `frontend/src/App.jsx` that renders a page title and a placeholder grid.
9. Create `.env.example` with: `PORT`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
10. Create `README.md` with setup and run instructions.

### Relevant Context
- Backend runs on `http://localhost:4000`.
- Frontend runs on `http://localhost:5173` (Vite default).
- `.env.example` must not contain real keys — use placeholder strings like `your-key-here`.

---

## Sub-Task 2 — Shipments & Disruptions API + Display

**Status:** [ ] pending

### Intent
Build the two core read APIs and the frontend components that display them.
This is the foundation of the dashboard.

### Expected Outcomes
- `GET /api/shipments` returns the full shipments array.
- `GET /api/disruptions` returns the full disruptions array.
- The dashboard shows a **Shipments Table** (id, origin→destination, carrier, status, ETA).
- The dashboard shows a **Disruptions List** (type, severity badge, region, description).
- Both panels refresh automatically every 5 seconds via polling.

### Todo List
1. Create `backend/routes/shipments.js` — reads `shipments.json`, returns JSON array.
2. Create `backend/routes/disruptions.js` — reads `disruptions.json`, returns JSON array.
3. Mount both routes in `server.js` under `/api/shipments` and `/api/disruptions`.
4. Create `frontend/src/api.js` — export `fetchShipments()` and `fetchDisruptions()` using `fetch`.
5. Create `frontend/src/components/ShipmentTable.jsx` — displays shipments in a table with status color coding.
6. Create `frontend/src/components/DisruptionList.jsx` — displays disruption cards with severity badge coloring (low=yellow, medium=orange, high=red).
7. Wire both components into `App.jsx` using `useEffect` + `setInterval` polling every 5 s.

### Relevant Context
- All fetch helpers live in `api.js` — components never call `fetch` directly.
- Severity badge colors map: `low → yellow`, `medium → orange`, `high → red`, `critical → dark red`.

---

## Sub-Task 3 — Risk Engine: Affected Shipments + Risk Scores

**Status:** [ ] pending

### Intent
Implement the core business logic: determine which shipments are affected by which
disruptions, calculate a risk score, and expose this through a dedicated API endpoint.

### Expected Outcomes
- `GET /api/affected` returns an array of objects:
  `{ shipment, disruption, riskScore, riskLevel }`.
- Risk score is an integer 0–100 calculated from disruption severity + cargo type.
- `RiskBadge` component shows color-coded risk level in the Shipments Table.
- Affected shipments are highlighted or flagged in the UI.

### Todo List
1. Create `backend/services/riskEngine.js`:
   - `findAffectedShipments(shipments, disruptions)` — matches shipments to disruptions by `route` overlapping `affected_routes`.
   - `calculateRiskScore(shipment, disruption)` — returns 0–100; higher for critical severity, perishable/pharma cargo, and longer delay.
   - `getRiskLevel(score)` — maps score to `low / medium / high / critical` string.
2. Create `backend/routes/affected.js` — calls riskEngine and returns enriched array.
3. Mount `/api/affected` in `server.js`.
4. Add `fetchAffected()` to `frontend/src/api.js`.
5. Create `frontend/src/components/RiskBadge.jsx` — small colored badge for risk level.
6. Update `ShipmentTable.jsx` to show `RiskBadge` per row using affected data.

### Relevant Context
- A shipment is "affected" if any value in `disruption.affected_routes[]` matches the
  shipment's `route` field.
- Risk score formula (simple): `base = severity_score (low=25, medium=50, high=75, critical=100)`;
  add +10 if cargo is `perishable` or `pharmaceutical`; cap at 100.
- This service has no external dependencies — pure JS logic, easy to unit-test later.

---

## Sub-Task 4 — Rerouting & Fleet Recommendations

**Status:** [ ] pending

### Intent
For each affected shipment, generate a simple rerouting suggestion or alternative
fleet asset recommendation. This makes the MVP actionable, not just informational.

### Expected Outcomes
- `GET /api/affected` response is extended with a `recommendation` field per item.
- Recommendation includes: `alternative_route`, `alternative_carrier` (from non-affected carriers), `action` (string like "Reroute via Rotterdam" or "Hold at origin").
- Recommendations are shown in the dashboard next to each affected shipment.

### Todo List
1. Extend `backend/services/riskEngine.js` with `generateRecommendation(shipment, disruption, allShipments)`:
   - Find carriers operating on unaffected routes (from `shipments.json` pool).
   - If an alternative carrier exists, suggest rerouting.
   - If no alternative, suggest holding at origin.
   - Return a plain-English `action` string and `alternative_carrier` (may be null).
2. Update `backend/routes/affected.js` to include `recommendation` in each result item.
3. Update `frontend/src/components/ShipmentTable.jsx` to show the recommendation action string inline.

### Relevant Context
- Keep recommendation logic rule-based (no ML). A few if/else rules are enough for MVP.
- Alternative carrier = any carrier whose shipments do not share the disrupted route.

---

## Sub-Task 5 — Cold-Chain Monitoring & Excursion Detection

**Status:** [ ] pending

### Intent
Read cold-chain temperature sensor data and flag any readings that fall outside
the acceptable temperature range for that shipment's cargo.

### Expected Outcomes
- `GET /api/cold-chain` returns all readings enriched with `excursion: true/false`.
- `ColdChainPanel` component shows each reading as a row with temp value and a red
  "EXCURSION" badge if out of range.
- Panel polls every 5 s.

### Todo List
1. Create `backend/routes/coldChain.js`:
   - Reads `cold-chain.json`.
   - Adds `excursion: boolean` to each reading (true if `temp_celsius < min_ok` or `temp_celsius > max_ok`).
   - Returns enriched array.
2. Mount `/api/cold-chain` in `server.js`.
3. Add `fetchColdChain()` to `frontend/src/api.js`.
4. Create `frontend/src/components/ColdChainPanel.jsx`:
   - Table showing `shipment_id`, `location`, `temp_celsius`, `min_ok–max_ok range`, `timestamp`, excursion badge.
   - Rows with excursions are highlighted in red/pink.

### Relevant Context
- Cold-chain seed data must include at least 2–3 deliberate excursions for demo purposes.
- `min_ok` and `max_ok` fields are on each reading (may vary per shipment/cargo type).

---

## Sub-Task 6 — AI Explanation & Recommendation Panel

**Status:** [ ] pending

### Intent
Integrate an OpenAI-compatible LLM endpoint so the user can ask the AI for a plain-English
explanation of a disruption or shipment risk. This uses `watsonx.ai` in production
but works with any OpenAI-compatible key locally.

### Expected Outcomes
- `POST /api/ai/explain` accepts `{ context }` and returns `{ explanation }`.
- `AiPanel` component shows a text area pre-filled with context and an "Ask AI" button.
- Clicking the button sends the request and displays the streamed (or full) response.
- If `AI_API_KEY=mock`, the backend returns a hardcoded mock response (no real API call).

### Todo List
1. Create `backend/services/aiService.js`:
   - Initialise OpenAI client with `baseURL = process.env.AI_BASE_URL` and `apiKey = process.env.AI_API_KEY`.
   - Export `explain(contextText)` — sends a single user message and returns the text response.
   - If `AI_API_KEY === 'mock'`, skip the API call and return a predefined mock string.
2. Create `backend/routes/ai.js` — `POST /api/ai/explain`, calls `aiService.explain`, returns JSON.
3. Mount `/api/ai/explain` in `server.js`.
4. Create `frontend/src/components/AiPanel.jsx`:
   - Textarea pre-filled with a summary of the most critical disruption/risk.
   - "Ask AI" button — `POST`s to `/api/ai/explain` and displays the result below.
   - Shows a loading spinner while waiting.
5. Add `postAiExplain(context)` to `frontend/src/api.js`.

### Relevant Context
- `.env.example` already includes `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
- watsonx.ai base URL format: `https://<region>.ml.cloud.ibm.com/ml/v1/text/chat?version=2024-05-31` — document this in the README.
- The mock mode (`AI_API_KEY=mock`) is critical for offline demo/development without burning real API credits.

---

## Sub-Task 7 — Dashboard Layout, Polish & README

**Status:** [x] done

### Intent
Assemble all components into a clean, professional-looking control-tower dashboard
and make sure a first-time user can run the whole project in under 5 minutes.

### Expected Outcomes
- Dashboard has a header, a top stats bar (total shipments, active disruptions, excursions, affected count).
- Main content is a two-column grid: Shipments Table (left) + Disruptions List (right).
- Cold-Chain Panel spans full width below.
- AI Panel is pinned to the bottom or accessible via a slide-out.
- The app looks clean on a 1080p screen (no broken layouts).
- `README.md` has: prerequisites, install, run, demo walkthrough, watsonx.ai setup note.

### Todo List
1. Redesign `App.jsx` layout:
   - Top header bar with project name and IBM logo placeholder.
   - Stats bar with 4 KPI cards (total shipments, active disruptions, affected, excursions).
   - Two-column grid row: `ShipmentTable` | `DisruptionList`.
   - Full-width `ColdChainPanel`.
   - Full-width `AiPanel`.
2. Apply Tailwind classes for consistent spacing, card shadows, and color scheme (dark navy header, white cards).
3. Add a simple top-of-page banner that flashes red if any `critical` risk or excursion exists.
4. Complete `README.md`:
   - Prerequisites (Node 18+, npm).
   - `cp .env.example .env` instruction.
   - `cd backend && npm install && npm start`.
   - `cd frontend && npm install && npm run dev`.
   - Demo walkthrough: what to click and what to expect.
   - Note on enabling real watsonx.ai calls.
5. Add code comments to `riskEngine.js` and `aiService.js` explaining each function.

### Relevant Context
- Tailwind utility classes keep CSS beginner-friendly — no separate `.css` files needed.
- The critical-alert banner gives the project a live "control tower" feel for demos.

---

## Implementation Notes

- Each sub-task is independent and builds on the previous one. Implement them in order 1→7.
- After each sub-task, verify the backend returns correct JSON and the component renders it.
- The mock AI mode must always work without any `.env` changes — default `AI_API_KEY=mock`.
- No authentication, no database migrations, no Docker — keep it runnable with `npm start`.
