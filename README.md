# Drone News Platform

A full-stack Node.js application that fetches drone-related news from the NewsAPI, stores it persistently in a local SQLite database, and serves it via a REST API with a clean Vanilla JS frontend.

## Architecture

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Web server | Express.js |
| Database | SQLite via `better-sqlite3` (WAL mode enabled) |
| Background job | `node-cron` — fetches on startup, then every 30 minutes |
| Frontend | Vanilla HTML / CSS / JS (no build step) |

## Prerequisites

- Node.js 20 or later

## How to Run

```bash
# 1. Copy the example env file and fill in your NewsAPI key
cp .env.example .env   # then open .env and set NEWS_API_KEY

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The server starts on `http://localhost:3000` (or the port set in `.env`).

## How to Run Tests

```bash
npm test
```

Tests cover the two pure-function modules (`keywordFilter`, `wikiParser`) with no mocks and no network or DB access required.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ ok: true }` |
| GET | `/api/news` | All articles from DB; supports `?keyword=` filter |
| GET | `/api/author/:name` | Wikipedia summary for an author name |

## NewsAPI Free-Tier Notes

- The free Developer plan returns a limited number of articles per request.
- Articles may be delayed by up to **24 hours** on the free tier.
- Free-tier access is **restricted to localhost** (dev use only) — the API will reject requests from deployed/public servers. You will need a paid plan for production use.
