// Backend configuration constants.
// Secrets (API keys, PORT) stay in .env — this file is for tuneable values
// that are not environment-specific and do not need to be hidden.

module.exports = {
  // Pagination
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT:    100,

  // Wikipedia TTL cache
  WIKI_HIT_TTL_MS:  60 * 60 * 1000,   // 1 hour  — successful lookups
  WIKI_MISS_TTL_MS:  5 * 60 * 1000,   // 5 min   — not-found / fallback

  // Rate limiter
  RATE_LIMIT_WINDOW_MS:  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
  RATE_LIMIT_MAX:        parseInt(process.env.RATE_LIMIT_MAX,       10) || 60,

  // Cron schedule (node-cron syntax)
  CRON_SCHEDULE: '*/30 * * * *',

  // News API fetch timeout
  NEWS_FETCH_TIMEOUT_MS: 10_000,

  // Article scraper timeout + user-agent
  SCRAPER_TIMEOUT_MS: 6_000,
  SCRAPER_UA: 'Mozilla/5.0 (compatible; DroneNewsBot/1.0)',
};
