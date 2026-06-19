const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../news.db');

function initDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      url         TEXT    UNIQUE NOT NULL,
      title       TEXT,
      description TEXT,
      author      TEXT,
      source      TEXT,
      published_at TEXT,
      url_to_image TEXT,
      content     TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

module.exports = { initDb, DB_PATH };
