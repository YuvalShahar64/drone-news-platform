const { parseWikiResponse } = require('../lib/wikiParser');
const { buildCacheKey, isFresh } = require('../lib/wikiCache');

const HIT_TTL  = 60 * 60 * 1000;      // 1 hour  — successful summaries
const MISS_TTL =  5 * 60 * 1000;      // 5 min   — not-found / fallback results

const cache = new Map();

async function getAuthorInfo(name) {
  const key   = buildCacheKey(name);
  const entry = cache.get(key);
  const now   = Date.now();

  if (entry) {
    const ttl = entry.value.ok ? HIT_TTL : MISS_TTL;
    if (isFresh(entry, now, ttl)) return entry.value;
    cache.delete(key);
  }

  const normalized = encodeURIComponent(name.replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${normalized}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res  = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    const result = parseWikiResponse(data);
    cache.set(key, { value: result, storedAt: now });
    return result;
  } catch (err) {
    const result = parseWikiResponse(err);
    cache.set(key, { value: result, storedAt: now });
    return result;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getAuthorInfo };
