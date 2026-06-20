// Frontend configuration constants.
// Loaded as a plain <script> before app.js — no build step required.
// Do NOT put secrets here; this file is served to the browser.

const CONFIG = {
  // Search debounce (ms before firing a fetch after the user stops typing)
  DEBOUNCE_MS: 300,

  // Pill toast duration (ms the "no articles in X — showing Y instead" message stays)
  PILL_TOAST_MS: 3000,

  // For You alert auto-dismiss duration (ms)
  FORYOU_ALERT_MS: 8000,

  // History panel caps
  MAX_RECENT_ARTICLES: 10,
  MAX_RECENT_AUTHORS:   5,
  MAX_RECENT_SEARCHES:  5,

  // Time-filter pill definitions (hours; 0 = all time)
  PILL_HOURS:  [24, 168, 720, 0],
  PILL_LABELS: { 24: '24h', 168: '7 days', 720: '30 days', 0: 'all time' },
};
