const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/cold-chain
// Reads cold-chain temperature readings from the seed data file and enriches
// each record with an `excursion` boolean.
//
// Excursion detection logic:
//   A temperature excursion occurs when the recorded temperature falls outside
//   the safe range defined per shipment:
//     - excursion = true  if temp_celsius < min_ok  (too cold)
//     - excursion = true  if temp_celsius > max_ok  (too warm)
//     - excursion = false if min_ok <= temp_celsius <= max_ok  (within range)
//
// The frontend renders the flag as a status badge — detection stays here in
// the backend so the UI never has to duplicate business logic.
router.get("/", (_req, res) => {
  const dataPath = path.join(__dirname, "../data/cold-chain.json");
  const readings = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const enriched = readings.map((reading) => ({
    ...reading,
    excursion: reading.temp_celsius < reading.min_ok || reading.temp_celsius > reading.max_ok,
  }));

  res.json(enriched);
});

module.exports = router;
