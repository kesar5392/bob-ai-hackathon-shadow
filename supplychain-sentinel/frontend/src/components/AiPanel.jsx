// ─── AiPanel ──────────────────────────────────────────────────────────────────
// Full-width panel that lets the user ask an AI analyst to summarize current
// supply chain risks.
//
// The textarea is pre-filled with a realistic scenario so the demo works
// immediately — the user can click "Ask AI" without typing anything.
//
// Mock mode: the backend returns a hardcoded explanation when IBM_CLOUD_API_KEY is
// "mock" or unset. The note at the bottom of the panel always surfaces this.

import React, { useState } from "react";
import { postAiExplain } from "../api";

// Default prompt pre-filled in the textarea for demo convenience.
const DEFAULT_CONTEXT =
  "Summarize the current supply chain risks: multiple active disruptions " +
  "including a critical port strike on the US West Coast, a high-severity " +
  "typhoon in the South China Sea, and cold-chain temperature excursions on " +
  "pharmaceutical shipments SHP-004 and SHP-009.";

/**
 * AiPanel
 *
 * Renders a self-contained AI analyst widget. No props required — it manages
 * its own context, loading, and explanation state.
 */
export default function AiPanel() {
  // context — the text sent to the AI; editable by the user before submitting.
  const [context, setContext] = useState(DEFAULT_CONTEXT);

  // explanation — the AI-generated response, or null before the first request.
  const [explanation, setExplanation] = useState(null);

  // loading — true while awaiting the API response; disables the button.
  const [loading, setLoading] = useState(false);

  // handleAsk — calls the backend and updates explanation state.
  async function handleAsk() {
    setLoading(true);
    try {
      const data = await postAiExplain(context);
      setExplanation(data.explanation);
    } catch (err) {
      setExplanation("Error: could not reach the AI service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* ── Section title ── */}
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        🤖 AI Supply Chain Analyst
      </h2>

      {/* ── Context textarea — pre-filled, user-editable ── */}
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={4}
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Describe the supply chain situation you want analysed…"
      />

      {/* ── Ask AI button ── */}
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={handleAsk}
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "⟳ Thinking..." : "Ask AI"}
        </button>
      </div>

      {/* ── AI explanation result ── */}
      {explanation && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {explanation}
        </div>
      )}

      {/* ── Mock-mode note — always shown because the API key is never exposed to the browser ── */}
      <p className="mt-3 text-xs text-gray-400">
        Note: Using mock AI response. Set <code className="font-mono">IBM_CLOUD_API_KEY</code> in{" "}
        <code className="font-mono">.env</code> to enable watsonx.ai. See README for setup steps.
      </p>
    </section>
  );
}
