// DisruptionList — displays a list of disruption cards, one per active disruption.
// Props:
//   disruptions: array of disruption objects from GET /api/disruptions
// Each card shows: type (uppercase), severity badge, affected region, description, start date.

import React from "react";

// Maps severity level to Tailwind badge classes.
const SEVERITY_STYLES = {
  low:      "bg-yellow-100 text-yellow-800",
  medium:   "bg-orange-100 text-orange-800",
  high:     "bg-red-100 text-red-700",
  critical: "bg-red-900 text-white",
};

function SeverityBadge({ severity }) {
  const classes = SEVERITY_STYLES[severity] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${classes}`}>
      {severity}
    </span>
  );
}

export default function DisruptionList({ disruptions }) {
  if (!disruptions || disruptions.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No active disruptions.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {disruptions.map((d) => (
        <li key={d.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          {/* Header row: type + severity badge */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              {d.type.replace(/_/g, " ")}
            </span>
            <SeverityBadge severity={d.severity} />
          </div>

          {/* Affected region */}
          <p className="text-xs text-gray-500 mb-1">
            📍 {d.affected_region}
          </p>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-snug mb-2">
            {d.description}
          </p>

          {/* Start date */}
          <p className="text-xs text-gray-400">
            Since {d.start_date}
          </p>
        </li>
      ))}
    </ul>
  );
}
