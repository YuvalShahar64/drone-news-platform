const { isRateLimited, pruneTimestamps } = require('../lib/rateLimiter');

const WINDOW_MS    = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX,       10) || 60;

const store = new Map(); // ip → number[]

function rateLimitMiddleware(req, res, next) {
  const ip  = req.ip || 'unknown';
  const now = Date.now();

  const prev   = store.get(ip) ?? [];
  const recent = pruneTimestamps(prev, now, WINDOW_MS);

  if (isRateLimited(recent, now, WINDOW_MS, MAX_REQUESTS)) {
    return res.status(429).json({ ok: false, message: 'Too many requests — please slow down.' });
  }

  recent.push(now);
  store.set(ip, recent);
  next();
}

module.exports = rateLimitMiddleware;
