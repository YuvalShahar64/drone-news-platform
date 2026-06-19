const { initDb } = require('../db/init');
const { normalizeUrl } = require('../lib/urlNormalizer');

const db = initDb();

// One-time migration: normalize any pre-existing URLs that weren't normalised
// (e.g. rows with #fragment, utm_* params, or /amp).
// UPDATE OR IGNORE leaves the row unchanged when the normalized URL already
// exists (UNIQUE conflict), so we explicitly delete that duplicate instead.
(function migrateExistingUrls() {
  const stale = db.prepare(
    "SELECT id, url FROM articles WHERE url LIKE '%#%' OR url LIKE '%utm_%' OR url LIKE '%/amp'"
  ).all();
  if (stale.length === 0) return;
  const update = db.prepare('UPDATE OR IGNORE articles SET url = ? WHERE id = ?');
  const del    = db.prepare('DELETE FROM articles WHERE id = ?');
  db.transaction(() => {
    for (const row of stale) {
      const norm = normalizeUrl(row.url);
      if (norm === row.url) continue;
      const { changes } = update.run(norm, row.id);
      if (changes === 0) del.run(row.id); // normalized URL already exists — drop duplicate
    }
  })();
  console.log(`[db] Normalised ${stale.length} existing URL(s)`);
})();

function getArticles(category) {
  if (category && category !== 'All') {
    return db.prepare('SELECT * FROM articles WHERE category = ? ORDER BY published_at DESC').all(category);
  }
  return db.prepare('SELECT * FROM articles ORDER BY published_at DESC').all();
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

module.exports = { getArticles, upsertArticles };
