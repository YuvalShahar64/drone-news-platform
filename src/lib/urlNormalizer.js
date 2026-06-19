const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source',
];

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    TRACKING_PARAMS.forEach(p => u.searchParams.delete(p));
    // Strip /amp suffix and trailing slashes from path
    u.pathname = u.pathname.replace(/\/amp\/?$/, '').replace(/\/+$/, '') || '/';
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

module.exports = { normalizeUrl };
