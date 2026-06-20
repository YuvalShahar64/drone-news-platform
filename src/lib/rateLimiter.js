function pruneTimestamps(timestamps, now, windowMs) {
  return timestamps.filter(t => now - t < windowMs);
}

function isRateLimited(timestamps, now, windowMs, max) {
  return pruneTimestamps(timestamps, now, windowMs).length >= max;
}

module.exports = { isRateLimited, pruneTimestamps };
