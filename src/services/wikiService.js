const { parseWikiResponse } = require('../lib/wikiParser');
const { buildCacheKey, isFresh } = require('../lib/wikiCache');

const { WIKI_HIT_TTL_MS: HIT_TTL, WIKI_MISS_TTL_MS: MISS_TTL } = require('../config');

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
