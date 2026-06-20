const { extractAuthorLink } = require('../lib/authorLinkExtractor');
const { SCRAPER_TIMEOUT_MS, SCRAPER_UA } = require('../config');

const SCRAPE_TIMEOUT_MS = SCRAPER_TIMEOUT_MS;

async function scrapeAuthorLink(articleUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
  try {
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': SCRAPER_UA,
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
