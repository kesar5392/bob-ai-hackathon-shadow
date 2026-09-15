// ─── Load environment variables from .env ────────────────────────────────────
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
// Allow requests from the Vite dev server (localhost:5173) and any other origin.
app.use(cors());

// Parse incoming JSON request bodies so route handlers can read req.body.
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
// Used by the frontend and monitoring tools to verify the API is alive.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Each route module is created in later sub-tasks and mounted here under /api.

// ST-2: Shipments & Disruptions
app.use("/api/shipments",   require("./routes/shipments"));
app.use("/api/disruptions", require("./routes/disruptions"));

// ST-3: Risk Engine — affected shipments with risk scores
app.use("/api/affected",    require("./routes/affected"));

// ST-5: Cold-Chain temperature monitoring
app.use("/api/cold-chain",  require("./routes/coldChain"));

// ST-6: AI explanation endpoint
app.use("/api/ai",          require("./routes/ai"));

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SupplyChain Sentinel API listening on http://localhost:${PORT}`);
});
