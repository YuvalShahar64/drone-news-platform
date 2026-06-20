const { upsertArticles } = require('./db');
const { classifyArticle } = require('../lib/categoryClassifier');
const { normalizeUrl }    = require('../lib/urlNormalizer');
const { NEWS_FETCH_TIMEOUT_MS } = require('../config');

async function fetchAndStoreDroneNews() {
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=drone&pageSize=100&apiKey=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    if (!Array.isArray(data.articles)) {
      console.error('News API error:', data.message || 'Unexpected response shape');
      return;
    }
    const seenTitles = new Set();
    const rows = data.articles
      .filter(a => a.url)
      .map(a => ({
        url:          normalizeUrl(a.url),
        title:        a.title        ?? null,
        description:  a.description  ?? null,
        author:       a.author       ?? null,
        source:       a.source?.name ?? null,
        published_at: a.publishedAt  ?? null,
        url_to_image: a.urlToImage   ?? null,
        content:      a.content      ?? null,
        category:     classifyArticle({ title: a.title, description: a.description }),
      }))
      .filter(row => {
        const key = row.title?.toLowerCase().trim();
        if (!key) return true;
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });
    upsertArticles(rows);
    console.log(`[cron] Upserted ${rows.length} articles`);
  } catch (err) {
    console.error('[cron] Fetch failed:', err.message);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchAndStoreDroneNews };
