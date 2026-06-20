const { getArticles }     = require('../services/db');
const { parsePagination } = require('../lib/parsePagination');

function getNews(req, res) {
  const { limit, offset }   = parsePagination(req.query);
  const { category, keyword } = req.query;
  const { articles, total } = getArticles({ category, keyword, limit, offset });

  if (total === 0 && !keyword && !category) {
    return res.json({
      ok: true,
      articles: [],
      total: 0,
      limit,
      offset,
      message: 'No articles yet — the fetcher runs on startup and every 30 minutes.',
    });
  }

  res.json({ ok: true, articles, total, limit, offset });
}

module.exports = { getNews };
