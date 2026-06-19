const { extractAuthorLink } = require('../lib/authorLinkExtractor');

const SCRAPE_TIMEOUT_MS = 6000;

async function scrapeAuthorLink(articleUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
  try {
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DroneNewsBot/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const origin = new URL(articleUrl).origin;
    return extractAuthorLink(html, origin);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { scrapeAuthorLink };
