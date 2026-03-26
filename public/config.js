// ══════════════════════════════════════
//   CodeScan AI — config.js
//   ⚠️  PUT YOUR GROQ API KEY HERE
// ══════════════════════════════════════

const CONFIG = {

  // ── STEP 1: Get your free Groq API key ──
  //   → https://console.groq.com
  //   → Sign up → API Keys → Create
  GROQ_API_KEY: "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",   // ← PASTE KEY HERE

  // ── Model (all free on Groq) ──
  //   llama3-8b-8192       — fastest
  //   llama-3.3-70b-versatile — best quality ✓
  //   mixtral-8x7b-32768   — balanced
  GROQ_MODEL: "llama-3.3-70b-versatile",

  // ── Endpoints (do not change) ──
  GROQ_URL:    "https://api.groq.com/openai/v1/chat/completions",
  BACKEND_URL: "http://localhost:3000/api"
};
