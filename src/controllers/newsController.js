const { getArticles } = require('../services/db');
const { filterByKeyword } = require('../lib/keywordFilter');

function getNews(req, res) {
  const articles = getArticles(req.query.category);
  const filtered = filterByKeyword(articles, req.query.keyword);
  if (filtered.length === 0 && !req.query.keyword && !req.query.category) {
    return res.json({
      ok: true,
      articles: [],
      message: 'No articles yet — the fetcher runs on startup and every 30 minutes.',
    });
  }
  res.json({ ok: true, articles: filtered });
}

module.exports = { getNews };
