import React, { useState, useEffect } from "react";
import { fetchShipments, fetchDisruptions, fetchAffected, fetchColdChain } from "./api";
import ShipmentTable from "./components/ShipmentTable";
import DisruptionList from "./components/DisruptionList";
import ColdChainPanel from "./components/ColdChainPanel";
import AiPanel from "./components/AiPanel";

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [affected, setAffected] = useState([]);
  const [coldChain, setColdChain] = useState([]);

  useEffect(() => {
    // Load both datasets immediately when the component mounts, then
    // re-fetch every 5 seconds so the dashboard reflects the latest data
    // without requiring a manual page refresh (polling pattern).
    function loadData() {
      fetchShipments()
        .then(setShipments)
        .catch((err) => console.error("Shipments fetch failed:", err));

      fetchDisruptions()
        .then(setDisruptions)
        .catch((err) => console.error("Disruptions fetch failed:", err));

      fetchAffected()
        .then(setAffected)
        .catch((err) => console.error("Affected fetch failed:", err));

      fetchColdChain()
        .then(setColdChain)
        .catch((err) => console.error("Cold-chain fetch failed:", err));
    }

    loadData(); // initial fetch on mount

    // Schedule periodic re-fetch every 5 s.
    const intervalId = setInterval(loadData, 5000);

    // Cleanup: cancel the interval when the component unmounts to prevent
    // state updates on an unmounted component.
    return () => clearInterval(intervalId);
  }, []); // empty deps → runs once on mount, cleans up on unmount

  // ── Derived alert condition (no new state needed) ──────────────────────────
  // Show the critical banner if any affected shipment is critical-risk OR any
  // cold-chain reading has an active temperature excursion.
  const hasCriticalAlert =
    affected.some((a) => a.riskLevel === "critical") ||
    coldChain.some((r) => r.excursion === true);

  // ── Derived KPI counts ─────────────────────────────────────────────────────
  const affectedUniqueCount = new Set(affected.map((a) => a.shipment.id)).size;
  const excursionCount = coldChain.filter((r) => r.excursion).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-[#0f1f3d] text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          {/* Left: app name */}
          <h1 className="text-2xl font-bold tracking-tight">
            🚢 SupplyChain Sentinel
          </h1>
          {/* Right: subtitle + IBM badge */}
          <div className="text-right">
            <p className="text-sm text-blue-300">
              Supply Chain Disruption Assistant &amp; Fleet Utilization Optimizer
            </p>
            <span className="inline-block mt-1 text-xs text-gray-400 border border-gray-600 rounded px-2 py-0.5">
              IBM Technology
            </span>
          </div>
        </div>
      </header>

      {/* ── Critical alert banner (conditional) ── */}
      {hasCriticalAlert && (
        <div className="bg-red-600 text-white px-6 py-2 text-sm font-semibold">
          ⚠ ALERT: Critical supply chain risks detected — immediate action required
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Shipments */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{shipments.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total Shipments</p>
          </div>

          {/* Active Disruptions */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{disruptions.length}</p>
            <p className="text-sm text-gray-500 mt-1">Active Disruptions</p>
          </div>

          {/* Affected Shipments */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{affectedUniqueCount}</p>
            <p className="text-sm text-gray-500 mt-1">Affected Shipments</p>
          </div>

          {/* Temp Excursions */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{excursionCount}</p>
            <p className="text-sm text-gray-500 mt-1">Temp Excursions</p>
          </div>

        </div>
      </div>

      {/* ── Main content ── */}
      <main className="p-6 space-y-6 flex-1">

        {/* Two-column row: Shipments | Disruptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left column: Shipments */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Active Shipments
            </h2>
            <ShipmentTable shipments={shipments} affected={affected} />
          </section>

          {/* Right column: Disruptions */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Active Disruptions
            </h2>
            <DisruptionList disruptions={disruptions} />
          </section>

        </div>

        {/* Full-width Cold-Chain panel */}
        <ColdChainPanel readings={coldChain} />

        {/* Full-width AI Analyst panel */}
        <AiPanel />

      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0f1f3d] text-gray-400 text-xs text-center py-3">
        SupplyChain Sentinel — IBM BOB Hackathon MVP | Built with React + Node.js + watsonx.ai
      </footer>

    </div>
  );
}
