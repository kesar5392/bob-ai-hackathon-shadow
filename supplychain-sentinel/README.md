# 🚢 SupplyChain Sentinel

**Supply Chain Disruption Assistant & Fleet Utilization Optimizer**
*IBM BOB Hackathon MVP*

---

## What It Does

SupplyChain Sentinel is a real-time logistics control-tower dashboard that helps operations teams detect and respond to supply chain disruptions before they become crises. It continuously polls live shipment and disruption data, calculates risk scores for every affected shipment, and surfaces actionable rerouting recommendations alongside cold-chain temperature monitoring. An integrated AI analyst (powered by watsonx.ai or a local mock) can explain any risk in plain English on demand, giving every user — from warehouse coordinator to VP of Logistics — the information they need to act fast.

---

## Features

- **Live shipment tracking** — table of all active shipments with origin, destination, carrier, status, and ETA, refreshed every 5 seconds.
- **Disruption feed** — live cards showing event type, severity badge, affected region, and description.
- **Risk engine** — automatically matches shipments to disruptions by route overlap and calculates a 0–100 risk score per pair.
- **Risk levels** — colour-coded badges: low (green), medium (yellow), high (orange), critical (red).
- **Rerouting recommendations** — for each affected shipment, the engine suggests an alternative carrier and route, or advises holding at origin when no alternative exists.
- **Cold-chain monitoring** — temperature sensor readings for every shipment; rows with out-of-range readings are highlighted and flagged with an EXCURSION badge.
- **Critical alert banner** — a red top-of-page banner fires automatically whenever any shipment reaches critical risk or any cold-chain excursion is active.
- **KPI stats bar** — at-a-glance counts: Total Shipments, Active Disruptions, Affected Shipments, Temp Excursions.
- **AI analyst panel** — type any question or pre-filled context about a disruption and click "Ask AI" to get a plain-English explanation and recommendation from watsonx.ai (or the built-in mock).

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18 (Vite) + Tailwind CSS                  |
| Backend    | Node.js 18 + Express 4                          |
| Data       | JSON flat-files (seed data, no database needed) |
| AI         | OpenAI JS SDK v4 (watsonx.ai-compatible)        |
| Polling    | `setInterval` REST polling every 5 s            |

---

## Prerequisites

- **Node.js 18 or later** — [nodejs.org](https://nodejs.org)
- **npm 9 or later** (ships with Node 18)

Verify with:

```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

---

## Getting Started

### 1. Clone the project

```bash
git clone <repo-url>
cd supplychain-sentinel
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and review the variables:

| Variable            | Default value                                        | Purpose                                                          |
|---------------------|------------------------------------------------------|------------------------------------------------------------------|
| `PORT`              | `4000`                                               | Port the Express backend listens on                              |
| `IBM_CLOUD_API_KEY` | `mock`                                               | Your IBM Cloud API key. Leave as `mock` for offline demo mode    |
| `WATSONX_BASE_URL`  | `https://us-south.ml.cloud.ibm.com/ml/gateway/v1`   | watsonx.ai model gateway base URL for your region               |
| `AI_MODEL`          | `ibm/granite-3-3-8b-instruct`                        | Model ID sent to watsonx.ai                                      |

> **The default `.env` works out of the box with no changes** — the backend uses mock AI mode when `IBM_CLOUD_API_KEY=mock`.

### 3. Start the backend

```bash
cd backend
npm install
npm start
```

The API is now available at **http://localhost:4000**.
You should see:

```
SupplyChain Sentinel API listening on port 4000
```

Verify with: `curl http://localhost:4000/health` → should return `{"status":"ok"}`.

### 4. Start the frontend

Open a **second terminal** (keep the backend running) and run:

```bash
cd frontend
npm install
npm run dev
```

The dashboard is now available at **http://localhost:5173**.

---

## Demo Walkthrough

Once both servers are running, open **http://localhost:5173** and follow these steps:

1. **Stats bar** — at the top you will see four KPI cards: Total Shipments, Active Disruptions, Affected Shipments, and Temp Excursions. These update every 5 seconds automatically.

2. **Critical alert banner** — if the seed data includes any critical-risk shipments or cold-chain excursions (it does by design), a red banner will appear just below the header reading *"⚠ ALERT: Critical supply chain risks detected — immediate action required"*. This is live — it appears and disappears as data changes.

3. **Active Shipments table** — the left panel shows all 10 seed shipments. Shipments that are affected by a disruption show a coloured Risk badge and a rerouting recommendation inline (e.g. *"Reroute via Rotterdam — use carrier DHL Express"*).

4. **Active Disruptions list** — the right panel shows the 6 seed disruption events. Each card has a severity badge (low/medium/high/critical) and a description of the event.

5. **Cold-Chain panel** — below the two columns, this panel lists all temperature sensor readings. Rows highlighted in red/pink are excursions — the temperature was outside the acceptable range. These rows also display an **EXCURSION** badge.

6. **AI Analyst panel** — at the bottom of the page. A textarea is pre-filled with a summary prompt. Click **Ask AI** to send the context to the backend. In mock mode you will see a canned response instantly; with a real watsonx.ai key you will receive a live explanation. You can edit the textarea and ask anything about the supply chain situation.

---

## Enabling Real watsonx.ai

By default the app runs in **mock mode** — no API calls are made and no credits consumed.
To connect to a real IBM watsonx.ai instance, follow the steps below exactly.

### How authentication works

```
IBM_CLOUD_API_KEY (your secret, stays in .env, never sent to the browser)
        │
        ▼
POST https://iam.cloud.ibm.com/identity/token
        │
        ▼
IAM Access Token  (valid 1 hour, cached in backend memory, auto-refreshed)
        │
        ▼
Authorization: Bearer <iam_token>  →  watsonx.ai model gateway
        │
        ▼
AI response  →  backend  →  frontend
```

Your IBM Cloud API key **never leaves the backend process**. The frontend only receives the final AI-generated text.

---

### Step 1 — Provision watsonx.ai on IBM Cloud

1. Log in to [cloud.ibm.com](https://cloud.ibm.com).
2. Search for **watsonx.ai** in the catalog and provision an instance if you do not have one.
3. Note the **region** where your instance is provisioned (e.g. `us-south`, `eu-de`).

### Step 2 — Create an IBM Cloud API key

1. In the IBM Cloud console, go to **Manage → Access (IAM) → API keys**.
2. Click **Create an IBM Cloud API key**.
3. Give it a descriptive name (e.g. `supplychain-sentinel-dev`).
4. Click **Create**, then **Copy** or **Download** the key immediately.
   > ⚠️ The key is shown only once. Store it securely (e.g. a password manager).

### Step 3 — Choose your region URL

The watsonx.ai model gateway base URL follows this exact format:

```
https://<region>.ml.cloud.ibm.com/ml/gateway/v1
```

| Region    | WATSONX_BASE_URL                                          |
|-----------|-----------------------------------------------------------|
| Dallas    | `https://us-south.ml.cloud.ibm.com/ml/gateway/v1`        |
| Frankfurt | `https://eu-de.ml.cloud.ibm.com/ml/gateway/v1`           |
| London    | `https://eu-gb.ml.cloud.ibm.com/ml/gateway/v1`           |
| Tokyo     | `https://jp-tok.ml.cloud.ibm.com/ml/gateway/v1`          |

> Note: This is the **model gateway** endpoint, not the older `/ml/v1/text/chat` endpoint.
> The gateway is the correct OpenAI-compatible path as documented in the IBM watsonx.ai API reference.

### Step 4 — Update your `.env` file

Open `backend/.env` (or the `.env` at the project root — wherever you copied `.env.example` to) and set:

```dotenv
IBM_CLOUD_API_KEY=your-ibm-cloud-api-key-here
WATSONX_BASE_URL=https://us-south.ml.cloud.ibm.com/ml/gateway/v1
AI_MODEL=ibm/granite-3-3-8b-instruct
```

Replace `your-ibm-cloud-api-key-here` with the key you copied in Step 2.
Replace `us-south` with your actual region if different.

> The model `ibm/granite-3-3-8b-instruct` is IBM Granite 3.3 8B Instruct —
> available on multitenant hardware with no deployment setup required.
> It replaces the withdrawn `ibm/granite-13b-chat-v2`.

### Step 5 — Restart the backend

```bash
# In the backend terminal:
# Press Ctrl+C to stop the current process, then:
npm start
```

You should see the server start message. The AI panel will now call the real watsonx.ai API.
The "mock mode" note in the UI is a static label — real responses will appear in the blue result box.

---

## Project Structure

```
supplychain-sentinel/
├── .env.example                  ← Template for environment variables
├── README.md                     ← This file
│
├── backend/
│   ├── package.json              ← Backend dependencies (express, cors, dotenv, openai)
│   ├── server.js                 ← Express app entry point; mounts all routes
│   ├── data/
│   │   ├── shipments.json        ← 10 seed shipments
│   │   ├── disruptions.json      ← 6 seed disruption events
│   │   └── cold-chain.json       ← 8 temperature sensor readings (incl. excursions)
│   ├── routes/
│   │   ├── shipments.js          ← GET /api/shipments
│   │   ├── disruptions.js        ← GET /api/disruptions
│   │   ├── affected.js           ← GET /api/affected (risk engine output)
│   │   ├── coldChain.js          ← GET /api/cold-chain
│   │   └── ai.js                 ← POST /api/ai/explain
│   └── services/
│       ├── riskEngine.js         ← Route-matching, risk scoring, recommendations
│       └── aiService.js          ← IAM token exchange + caching + watsonx.ai gateway calls
│
└── frontend/
    ├── package.json              ← Frontend dependencies (react, vite, tailwindcss)
    ├── vite.config.js            ← Vite config with API proxy to localhost:4000
    ├── index.html                ← HTML entry point
    └── src/
        ├── main.jsx              ← React root mount
        ├── App.jsx               ← Root component: layout, state, polling
        ├── api.js                ← All fetch helpers (never call fetch in components)
        └── components/
            ├── ShipmentTable.jsx ← Shipments table with risk badges + recommendations
            ├── DisruptionList.jsx← Disruption cards with severity badges
            ├── RiskBadge.jsx     ← Coloured risk-level badge (low/medium/high/critical)
            ├── ColdChainPanel.jsx← Temperature readings table with excursion highlights
            └── AiPanel.jsx       ← AI analyst textarea + Ask AI button + response display
```

---

## API Reference

All endpoints are served from `http://localhost:4000`.

| Method | Endpoint            | Description                                                                                         |
|--------|---------------------|-----------------------------------------------------------------------------------------------------|
| GET    | `/health`           | Health check. Returns `{ "status": "ok" }`.                                                         |
| GET    | `/api/shipments`    | Returns the full array of shipment objects from `data/shipments.json`.                              |
| GET    | `/api/disruptions`  | Returns the full array of disruption objects from `data/disruptions.json`.                          |
| GET    | `/api/affected`     | Returns enriched array: `[{ shipment, disruption, riskScore, riskLevel, recommendation }]`.         |
| GET    | `/api/cold-chain`   | Returns temperature readings enriched with `excursion: true/false`.                                 |
| POST   | `/api/ai/explain`   | Body: `{ "context": "<text>" }`. Returns `{ "explanation": "<text>" }` from watsonx.ai or mock.    |

---

*SupplyChain Sentinel — IBM BOB Hackathon MVP | Built with React + Node.js + watsonx.ai*
