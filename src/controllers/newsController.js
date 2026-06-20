const { getArticles }     = require('../services/db');
const { getMocks }        = require('../services/mockArticles');
const { parsePagination } = require('../lib/parsePagination');

function getNews(req, res) {
  const { limit, offset }   = parsePagination(req.query);
  const { category, keyword } = req.query;
  const { articles, total } = getArticles({ category, keyword, limit, offset });
  const mocks = getMocks();

  if (total === 0 && mocks.length === 0 && !keyword && !category) {
    return res.json({
      ok: true,
      articles: [],
      total: 0,
      limit,
      offset,
      message: 'No articles yet — the fetcher runs on startup and every 30 minutes.',
    });
  }

  res.json({ ok: true, articles: [...mocks, ...articles], total: total + mocks.length, limit, offset });
}

module.exports = { getNews };
