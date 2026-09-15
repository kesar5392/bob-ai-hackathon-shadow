// ─── AI Route ─────────────────────────────────────────────────────────────────
// Exposes a single POST /explain endpoint that accepts a context string and
// returns an AI-generated supply chain risk explanation.
// Mounted at /api/ai in server.js, so the full path is POST /api/ai/explain.

const express = require("express");
const router  = express.Router();
const { explain } = require("../services/aiService");

/**
 * POST /explain
 *
 * Body:    { context: string }  — free-text description of the current situation.
 * Returns: { explanation: string }
 * Errors:  400 if `context` is missing or empty.
 */
router.post("/explain", async (req, res) => {
  const { context } = req.body;

  // Validate that context is a non-empty string.
  if (!context || typeof context !== "string" || context.trim() === "") {
    return res.status(400).json({ error: "context is required" });
  }

  const explanation = await explain(context.trim());
  res.json({ explanation });
});

module.exports = router;
