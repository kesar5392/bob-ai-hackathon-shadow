// ─── AI Service ───────────────────────────────────────────────────────────────
// Integrates with IBM watsonx.ai using its OpenAI-compatible model gateway.
//
// Authentication flow (real mode):
//   1. Read IBM_CLOUD_API_KEY from environment variables.
//   2. POST that key to the IBM IAM token endpoint to receive a short-lived
//      IAM access token (valid for 3600 s / 1 hour).
//   3. Cache the access token in memory. Re-use it for subsequent requests
//      until it is within 5 minutes of expiry, then exchange for a fresh one.
//   4. Pass the IAM access token as the `api_key` to the OpenAI SDK so it is
//      sent as `Authorization: Bearer <token>` to the watsonx.ai gateway.
//
// The IBM Cloud API key is NEVER sent to the frontend or logged.
//
// Mock mode (default):
//   When IBM_CLOUD_API_KEY is absent, empty, or set to "mock", no network calls
//   are made. A hardcoded response is returned immediately. This lets the app
//   run and be demonstrated with zero IBM credentials.
//
// References:
//   Endpoint:  https://cloud.ibm.com/apidocs/watsonx-ai  (model gateway)
//   IAM token: https://cloud.ibm.com/docs/account?topic=account-iamtoken_from_apikey
//   Model:     ibm/granite-3-3-8b-instruct (multitenant, April 2025+)

"use strict";

const { OpenAI } = require("openai");

// ── IAM token endpoint (IBM Cloud) ────────────────────────────────────────────
const IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token";

// ── In-memory token cache ─────────────────────────────────────────────────────
// Stores the last fetched IAM access token and its expiry epoch (ms).
// Module-level so it persists across requests for the lifetime of the process.
const _tokenCache = {
  accessToken: null,   // string | null
  expiresAtMs: 0,      // epoch milliseconds when the token expires
};

// Refresh the token this many milliseconds before it actually expires.
// IBM IAM tokens are valid for 3600 s (1 hour). We refresh 5 min early.
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes in ms

// ── Mock response ─────────────────────────────────────────────────────────────
const MOCK_RESPONSE =
  "Based on the current disruption data, the affected shipments face elevated " +
  "risk due to route conflicts with active disruptions. Immediate rerouting " +
  "through alternative carriers is recommended to minimize delays and protect " +
  "cargo integrity. For cold-chain shipments showing temperature excursions, " +
  "emergency intervention and cargo inspection should be prioritized.";

// ── isMockMode() ──────────────────────────────────────────────────────────────
// Returns true when no real IBM credentials are configured, meaning the service
// should return the hardcoded mock response instead of calling watsonx.ai.
function isMockMode() {
  const key = process.env.IBM_CLOUD_API_KEY;
  return !key || key.trim() === "" || key.trim() === "mock";
}

// ── getIamToken() ─────────────────────────────────────────────────────────────
/**
 * Returns a valid IBM IAM access token, fetching a new one from the IBM IAM
 * endpoint only when the cached token is missing or about to expire.
 *
 * The IBM Cloud API key is read directly from process.env here so it is never
 * stored in a variable that could be serialised or logged elsewhere.
 *
 * @returns {Promise<string>} A valid IAM bearer token string.
 * @throws  {Error}          If the IAM token exchange fails.
 */
async function getIamToken() {
  const now = Date.now();

  // Return the cached token if it is still valid (with buffer).
  if (_tokenCache.accessToken && now < _tokenCache.expiresAtMs - TOKEN_REFRESH_BUFFER_MS) {
    return _tokenCache.accessToken;
  }

  // Token is missing or stale — exchange the API key for a fresh one.
  // We use the built-in `fetch` (Node 18+) to avoid adding dependencies.
  const params = new URLSearchParams({
    grant_type: "urn:ibm:params:oauth:grant-type:apikey",
    apikey: process.env.IBM_CLOUD_API_KEY,
  });

  const response = await fetch(IAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    // Do NOT include the raw response body in logs — it may contain sensitive info.
    throw new Error(`IAM token exchange failed: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("IAM token exchange succeeded but response contained no access_token");
  }

  // Cache the token. `expires_in` is in seconds (IBM returns 3600 = 1 hour).
  const expiresInMs = (data.expires_in || 3600) * 1000;
  _tokenCache.accessToken = data.access_token;
  _tokenCache.expiresAtMs = now + expiresInMs;

  return _tokenCache.accessToken;
}

// ── explain(contextText) ──────────────────────────────────────────────────────
/**
 * Generates an AI-powered supply chain risk explanation for the given context.
 *
 * In mock mode (IBM_CLOUD_API_KEY absent/empty/"mock"):
 *   Returns the hardcoded MOCK_RESPONSE immediately — no network call.
 *
 * In real mode:
 *   1. Fetches (or reuses) an IAM access token via getIamToken().
 *   2. Instantiates an OpenAI-compatible client pointing at the watsonx.ai
 *      model gateway, using the IAM token as the bearer credential.
 *   3. Sends a chat completions request with a supply-chain-analyst system
 *      prompt and the provided contextText as the user message.
 *   4. Returns the model's text response.
 *
 * This function never throws — errors are caught and returned as a
 * user-friendly string so the backend always responds with HTTP 200.
 *
 * @param  {string}          contextText  Free-text description of the situation.
 * @returns {Promise<string>}             Explanation text.
 */
async function explain(contextText) {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (isMockMode()) {
    return MOCK_RESPONSE;
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  try {
    // Step 1: Get a valid IAM access token (cached or freshly exchanged).
    const iamToken = await getIamToken();

    // Step 2: Build the OpenAI-compatible client for this request.
    //
    // The watsonx.ai model gateway is OpenAI-compatible. The correct baseURL
    // for the chat completions endpoint is:
    //   https://<region>.<cloud-provider-domain>/ml/gateway/v1
    //
    // The OpenAI SDK appends "/chat/completions" to this base, so the full
    // request URL becomes:
    //   https://<region>.<cloud-provider-domain>/ml/gateway/v1/chat/completions
    //
    // Source: IBM watsonx.ai docs — "Inferencing models through the model gateway"
    // https://cloud.ibm.com/apidocs/watsonx-ai#create-chat-completions
    //
    // The IAM access token is used as the api_key so the SDK sends it as:
    //   Authorization: Bearer <iam_token>
    const client = new OpenAI({
      baseURL: process.env.WATSONX_BASE_URL,
      apiKey: iamToken, // IAM token — NOT the IBM Cloud API key
      // The OpenAI SDK adds a default "OpenAI-Organization" header which
      // watsonx.ai does not recognise. Setting defaultHeaders to empty
      // prevents any unexpected headers from being sent.
      defaultHeaders: {},
    });

    // Step 3: Send the chat completions request.
    const response = await client.chat.completions.create({
      // Model ID confirmed from IBM docs (multitenant, no deployment needed):
      //   granite-3-3-8b-instruct — available from April 2025 on multitenant hardware.
      //   Replaces withdrawn ibm/granite-13b-chat-v2.
      model: process.env.AI_MODEL || "ibm/granite-3-3-8b-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a supply chain risk analyst. Provide concise, actionable " +
            "recommendations based on the logistics data provided. Keep your " +
            "response under 200 words.",
        },
        {
          role: "user",
          content: contextText,
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content;

  } catch (err) {
    // Log the error server-side for debugging but never expose stack traces
    // or credential-related details to the frontend.
    console.error("[aiService] Error calling watsonx.ai:", err.message);

    // Return a user-friendly message. The frontend displays this as-is.
    if (err.message && err.message.includes("IAM token")) {
      return (
        "AI authentication failed. Please verify that IBM_CLOUD_API_KEY is " +
        "set correctly in your .env file and that the key has access to " +
        "watsonx.ai. See README.md for setup instructions."
      );
    }

    return (
      "AI analysis is temporarily unavailable. The watsonx.ai service returned " +
      "an error. Please check your WATSONX_BASE_URL and AI_MODEL in .env, " +
      "then restart the backend."
    );
  }
}

module.exports = { explain };
