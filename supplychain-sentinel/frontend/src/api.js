// All fetch helpers for the SupplyChain Sentinel API.
// Components never call fetch() directly — they always go through these helpers.
// The BASE path "/api" is proxied by Vite to http://localhost:4000 in development.

const BASE = "/api";

// fetchShipments — retrieves the full list of shipments from the backend.
// Returns a Promise that resolves to an array of shipment objects.
export async function fetchShipments() {
  const res = await fetch(`${BASE}/shipments`);
  if (!res.ok) throw new Error(`Failed to fetch shipments: ${res.status}`);
  return res.json();
}

// fetchDisruptions — retrieves the full list of active disruptions from the backend.
// Returns a Promise that resolves to an array of disruption objects.
export async function fetchDisruptions() {
  const res = await fetch(`${BASE}/disruptions`);
  if (!res.ok) throw new Error(`Failed to fetch disruptions: ${res.status}`);
  return res.json();
}

// fetchAffected — retrieves all shipment/disruption pairs enriched with riskScore
// and riskLevel from the risk engine. Returns a Promise that resolves to an array
// of { shipment, disruption, riskScore, riskLevel } objects.
export async function fetchAffected() {
  const res = await fetch(`${BASE}/affected`);
  if (!res.ok) throw new Error(`Failed to fetch affected shipments: ${res.status}`);
  return res.json();
}

// fetchColdChain — retrieves cold-chain temperature readings enriched with an
// `excursion` boolean from the backend route. Returns a Promise that resolves
// to an array of reading objects.
export async function fetchColdChain() {
  const res = await fetch(`${BASE}/cold-chain`);
  if (!res.ok) throw new Error(`Failed to fetch cold-chain data: ${res.status}`);
  return res.json();
}

// postAiExplain — sends a context string to the AI explanation endpoint and
// returns the parsed JSON response containing { explanation: string }.
export async function postAiExplain(context) {
  const res = await fetch(`${BASE}/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) throw new Error(`AI explain failed: ${res.status}`);
  return res.json();
}
