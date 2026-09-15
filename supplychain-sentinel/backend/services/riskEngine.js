// riskEngine.js — Pure business-logic module for supply chain risk assessment.
// No Express, no file I/O here. The route handler is responsible for loading data
// and passing it in. This keeps the logic easy to unit-test in isolation.

/**
 * Calculates a 0–100 integer risk score for a shipment/disruption pair.
 *
 * Formula:
 *   base  = severity map (low=25, medium=50, high=75, critical=100)
 *   +10   if cargo_type is "perishable" or "pharmaceutical" (time/temp sensitive)
 *   capped at 100
 *
 * @param {Object} shipment   - A shipment object with at least a `cargo_type` field.
 * @param {Object} disruption - A disruption object with a `severity` field.
 * @returns {number} Integer risk score in the range [0, 100].
 */
function calculateRiskScore(shipment, disruption) {
  const severityBase = { low: 25, medium: 50, high: 75, critical: 100 };
  let score = severityBase[disruption.severity] ?? 25;

  if (shipment.cargo_type === "perishable" || shipment.cargo_type === "pharmaceutical") {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Maps a numeric risk score to a human-readable risk level string.
 *
 * Thresholds:
 *   0–30   → "low"
 *   31–55  → "medium"
 *   56–80  → "high"
 *   81–100 → "critical"
 *
 * @param {number} score - Integer score produced by calculateRiskScore.
 * @returns {string} One of: "low", "medium", "high", "critical".
 */
function getRiskLevel(score) {
  if (score <= 30) return "low";
  if (score <= 55) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

/**
 * Finds all (shipment, disruption) pairs where the shipment's route is listed
 * in the disruption's `affected_routes` array.
 *
 * A single shipment can match multiple disruptions, producing one result object
 * per matching pair. Each result is enriched with a calculated risk score and level.
 *
 * @param {Object[]} shipments   - Array of shipment objects.
 * @param {Object[]} disruptions - Array of disruption objects.
 * @returns {{ shipment: Object, disruption: Object, riskScore: number, riskLevel: string }[]}
 */
function findAffectedShipments(shipments, disruptions) {
  const results = [];

  for (const disruption of disruptions) {
    for (const shipment of shipments) {
      if (disruption.affected_routes.includes(shipment.route)) {
        const riskScore = calculateRiskScore(shipment, disruption);
        const riskLevel = getRiskLevel(riskScore);
        results.push({ shipment, disruption, riskScore, riskLevel });
      }
    }
  }

  return results;
}

/**
 * Generates a plain-English rerouting recommendation for a single
 * shipment/disruption pair.
 *
 * Strategy (rule-based, no ML):
 *   1. Find all shipments whose route is NOT listed in disruption.affected_routes.
 *   2. Take the first unique carrier from that safe set.
 *   3. If a safe carrier exists, recommend rerouting through them.
 *      Otherwise, advise holding at origin.
 *
 * @param {Object}   shipment      - The affected shipment object.
 * @param {Object}   disruption    - The disruption object (must have `affected_routes` array).
 * @param {Object[]} allShipments  - Full list of shipments used to find alternatives.
 * @returns {{ alternative_carrier: string|null, alternative_route: string|null, action: string }}
 */
function generateRecommendation(shipment, disruption, allShipments) {
  const safeShipments = allShipments.filter(
    (s) => !disruption.affected_routes.includes(s.route)
  );

  // Pick the first unique carrier from the safe set.
  const seen = new Set();
  let alternative = null;
  for (const s of safeShipments) {
    if (!seen.has(s.carrier)) {
      seen.add(s.carrier);
      alternative = s;
      break;
    }
  }

  if (alternative) {
    return {
      alternative_carrier: alternative.carrier,
      alternative_route: alternative.route,
      action: `Reroute via ${alternative.carrier} on ${alternative.route}`,
    };
  }

  return {
    alternative_carrier: null,
    alternative_route: null,
    action: "Hold at origin — no safe alternative route currently available",
  };
}

module.exports = { findAffectedShipments, calculateRiskScore, getRiskLevel, generateRecommendation };
