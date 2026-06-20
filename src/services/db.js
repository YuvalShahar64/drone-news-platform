const { initDb } = require('../db/init');
const { normalizeUrl } = require('../lib/urlNormalizer');

const db = initDb();

// One-time migration: normalize every stored URL and update any that differ.
// Covers all normalizer rules (tracking params, #fragments, /amp, trailing
// slashes) without relying on pattern-matching in SQL.
// UPDATE OR IGNORE leaves the row unchanged when the normalized URL already
// exists (UNIQUE conflict), so we explicitly delete that duplicate instead.
(function migrateExistingUrls() {
  const all   = db.prepare('SELECT id, url FROM articles').all();
  const stale = all.filter(row => normalizeUrl(row.url) !== row.url);
  if (stale.length === 0) return;
  const update = db.prepare('UPDATE OR IGNORE articles SET url = ? WHERE id = ?');
  const del    = db.prepare('DELETE FROM articles WHERE id = ?');
  db.transaction(() => {
    for (const row of stale) {
      const norm = normalizeUrl(row.url);
      const { changes } = update.run(norm, row.id);
      if (changes === 0) del.run(row.id); // normalized URL already exists — drop duplicate
    }
  })();
  console.log(`[db] Normalised ${stale.length} existing URL(s)`);
})();

function getArticles({ category, keyword, limit, offset } = {}) {
  const conditions = [];
  const params     = {};

  if (category && category !== 'All') {
    conditions.push('category = @category');
    params.category = category;
  }
  if (keyword) {
    conditions.push('(title LIKE @pattern OR description LIKE @pattern)');
    params.pattern = `%${keyword}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM articles ${where}`)
    .get(params).n;

  const articles = db.prepare(
    `SELECT * FROM articles ${where} ORDER BY published_at DESC LIMIT @limit OFFSET @offset`
  ).all({ ...params, limit: limit ?? 20, offset: offset ?? 0 });

  return { articles, total };
}

function upsertArticles(articles) {
  const stmt = db.prepare(`
    INSERT INTO articles (url, title, description, author, source, published_at, url_to_image, content, category)
    VALUES (@url, @title, @description, @author, @source, @published_at, @url_to_image, @content, @category)
    ON CONFLICT(url) DO UPDATE SET
      title        = excluded.title,
      description  = excluded.description,
      author       = excluded.author,
      source       = excluded.source,
      published_at = excluded.published_at,
      url_to_image = excluded.url_to_image,
      content      = excluded.content,
      category     = excluded.category
  `);
  const upsertMany = db.transaction((rows) => {
    for (const row of rows) stmt.run(row);
  });
  upsertMany(articles);
}

function closeDb() {
  db.close();
  console.log('[db] Connection closed');
}

module.exports = { getArticles, upsertArticles, closeDb };
