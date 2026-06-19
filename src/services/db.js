const { initDb } = require('../db/init');

const db = initDb();

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
