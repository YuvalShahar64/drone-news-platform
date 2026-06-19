const { parseWikiResponse } = require('../lib/wikiParser');

async function getAuthorInfo(name) {
  const normalized = encodeURIComponent(name.replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${normalized}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    return parseWikiResponse(data);
  } catch (err) {
    return parseWikiResponse(err);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getAuthorInfo };
