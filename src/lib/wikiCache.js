function buildCacheKey(name) {
  return String(name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isFresh(entry, now, ttl) {
  return now - entry.storedAt < ttl;
}

module.exports = { buildCacheKey, isFresh };
