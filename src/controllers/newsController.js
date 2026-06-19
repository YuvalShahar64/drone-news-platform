const { getArticles } = require('../services/db');
const { filterByKeyword } = require('../lib/keywordFilter');

function getNews(req, res) {
  const articles = getArticles();
  if (articles.length === 0) {
    return res.json({
      ok: true,
      articles: [],
      message: 'No articles yet — the fetcher runs on startup and every 30 minutes.',
    });
  }
  const filtered = filterByKeyword(articles, req.query.keyword);
  res.json({ ok: true, articles: filtered });
}

module.exports = { getNews };
