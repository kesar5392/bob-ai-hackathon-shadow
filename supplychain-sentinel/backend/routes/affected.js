// GET / — Returns all shipments affected by active disruptions, each enriched
// with a calculated riskScore, riskLevel, and recommendation via the riskEngine service.
// Mounted at /api/affected in server.js.

const express = require("express");
const path = require("path");
const fs = require("fs");
const { findAffectedShipments, generateRecommendation } = require("../services/riskEngine");

const router = express.Router();

router.get("/", (req, res) => {
  const dataDir = path.join(__dirname, "../data");

  const shipments = JSON.parse(
    fs.readFileSync(path.join(dataDir, "shipments.json"), "utf8")
  );
  const disruptions = JSON.parse(
    fs.readFileSync(path.join(dataDir, "disruptions.json"), "utf8")
  );

  const affected = findAffectedShipments(shipments, disruptions);

  const results = affected.map(({ shipment, disruption, riskScore, riskLevel }) => ({
    shipment,
    disruption,
    riskScore,
    riskLevel,
    recommendation: generateRecommendation(shipment, disruption, shipments),
  }));

  res.json(results);
});

module.exports = router;
