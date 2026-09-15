// GET /api/shipments
// Reads the shipments seed file and returns the full array as JSON.
// In a production system this would query a database instead.

const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

router.get("/", (_req, res) => {
  const filePath = path.join(__dirname, "../data/shipments.json");
  const shipments = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  res.json(shipments);
});

module.exports = router;
