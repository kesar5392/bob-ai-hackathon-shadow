import React from "react";

// ColdChainPanel — displays a table of cold-chain temperature readings.
//
// Each row represents one sensor reading for a shipment. The backend has
// already computed the `excursion` flag for each reading, so this component
// is purely presentational — it never recalculates business logic.
//
// Props:
//   readings — array of enriched reading objects from GET /api/cold-chain:
//     { shipment_id, location, temp_celsius, min_ok, max_ok, timestamp, excursion }
export default function ColdChainPanel({ readings }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Section title */}
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Cold-Chain Temperature Monitor
      </h2>

      {/* Empty state */}
      {(!readings || readings.length === 0) ? (
        <p className="text-sm text-gray-500">No cold-chain data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-2 pr-4 font-medium">Shipment</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">Temp (°C)</th>
                <th className="py-2 pr-4 font-medium">Safe Range</th>
                <th className="py-2 pr-4 font-medium">Timestamp</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r, idx) => (
                // Rows with an excursion get a light red background so operators
                // can spot problems at a glance without relying on the badge alone.
                <tr
                  key={idx}
                  className={`border-b border-gray-100 ${r.excursion ? "bg-red-50" : ""}`}
                >
                  <td className="py-2 pr-4 font-medium text-gray-800">
                    {r.shipment_id}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{r.location}</td>
                  <td className="py-2 pr-4 text-gray-800">{r.temp_celsius}</td>
                  {/* Safe Range: shows the inclusive [min_ok, max_ok] window */}
                  <td className="py-2 pr-4 text-gray-600">
                    {r.min_ok}°C – {r.max_ok}°C
                  </td>
                  <td className="py-2 pr-4 text-gray-500">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  {/* Status badge: red pill for excursion, green pill for OK */}
                  <td className="py-2">
                    {r.excursion ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        ⚠ EXCURSION
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        ✓ OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
