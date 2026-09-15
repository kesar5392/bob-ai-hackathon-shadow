// ShipmentTable — displays the list of shipments in a styled table.
// Props:
//   shipments: array of shipment objects from GET /api/shipments
//   affected:  array of { shipment, disruption, riskScore, riskLevel, recommendation } from GET /api/affected
//
// Each row shows: ID, Origin → Destination, Carrier, Cargo type, Status (pill badge),
// Risk (RiskBadge for the highest-scoring disruption affecting this shipment),
// Recommendation (action string for the highest-risk disruption), ETA.

import React from "react";
import RiskBadge from "./RiskBadge";

// Maps a shipment status value to Tailwind pill classes.
const STATUS_STYLES = {
  in_transit: "bg-blue-100 text-blue-800",
  delayed:    "bg-orange-100 text-orange-800",
  at_port:    "bg-yellow-100 text-yellow-800",
  delivered:  "bg-green-100 text-green-800",
};

function StatusBadge({ status }) {
  const classes = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${classes}`}>
      {label}
    </span>
  );
}

/**
 * Builds a lookup map from shipment ID to the highest-risk entry for that shipment.
 * When the same shipment is matched by multiple disruptions, only the entry with
 * the highest riskScore is kept (to show the worst-case badge and recommendation).
 *
 * @param {Object[]} affected - Array of { shipment, disruption, riskScore, riskLevel, recommendation }
 * @returns {Map<string, { riskScore: number, riskLevel: string, recommendation: Object }>}
 */
function buildRiskMap(affected) {
  const map = new Map();
  for (const entry of affected) {
    const id = entry.shipment.id;
    const existing = map.get(id);
    if (!existing || entry.riskScore > existing.riskScore) {
      map.set(id, {
        riskScore: entry.riskScore,
        riskLevel: entry.riskLevel,
        recommendation: entry.recommendation,
      });
    }
  }
  return map;
}

export default function ShipmentTable({ shipments, affected = [] }) {
  if (!shipments || shipments.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No shipment data available.
      </p>
    );
  }

  const riskMap = buildRiskMap(affected);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider">
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Route</th>
            <th className="py-2 pr-4">Carrier</th>
            <th className="py-2 pr-4">Cargo</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Risk</th>
            <th className="py-2 pr-4">Recommendation</th>
            <th className="py-2">ETA</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => {
            const risk = riskMap.get(s.id);
            return (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-mono font-medium text-gray-700">{s.id}</td>
                <td className="py-2 pr-4 text-gray-600">
                  {s.origin} <span className="text-gray-400">→</span> {s.destination}
                </td>
                <td className="py-2 pr-4 text-gray-600">{s.carrier}</td>
                <td className="py-2 pr-4 text-gray-600 capitalize">{s.cargo_type}</td>
                <td className="py-2 pr-4">
                  <StatusBadge status={s.status} />
                </td>
                <td className="py-2 pr-4">
                  {risk ? <RiskBadge level={risk.riskLevel} /> : null}
                </td>
                <td className="py-2 pr-4">
                  {risk?.recommendation
                    ? <span className="text-gray-400 italic text-xs">{risk.recommendation.action}</span>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 text-gray-600">{s.eta}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
