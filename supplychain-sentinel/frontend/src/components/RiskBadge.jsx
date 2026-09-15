// RiskBadge — displays a small color-coded pill indicating the risk level of a
// shipment that is affected by a disruption.
//
// Props:
//   level (string) — one of: "low", "medium", "high", "critical"
//
// Color mapping:
//   low      → green
//   medium   → yellow
//   high     → orange
//   critical → red

import React from "react";

const LEVEL_STYLES = {
  low:      "bg-green-100 text-green-800",
  medium:   "bg-yellow-100 text-yellow-800",
  high:     "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function RiskBadge({ level }) {
  const classes = LEVEL_STYLES[level] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${classes}`}>
      {level}
    </span>
  );
}
