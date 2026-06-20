# Drone News Platform

A full-stack Node.js application that fetches drone-related news from the NewsAPI, stores it persistently in a local SQLite database, and serves it via a REST API with a personalised Vanilla JS frontend.

## Architecture

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Web server | Express.js |
| Database | SQLite via `better-sqlite3` (WAL mode) |
| Background job | `node-cron` — fetches on startup, then every 30 minutes |
| Frontend | Vanilla HTML / CSS / JS (no build step) |
| Personalisation | `localStorage` — no backend storage of user data |

## Features

- **Category tabs** — filter articles by Military & Defense, Delivery & Logistics, Racing & Sport, Regulations & Policy, Technology & Innovation, Surveillance & Security, General
- **Time pills** — filter by 24 h / 7 days / 30 days / all time; auto-advances to the next wider window if the current one has no results
- **Breaking news strip** — articles from the last 24 hours scroll across a highlighted banner
- **Keyword search** — debounced live search with recent-searches dropdown
- **For You tab** — personalised feed of unread articles from your two most-read categories, with a "Because you searched: X" section that surfaces unread articles matching your recent searches (glowing highlight)
- **New-article alert** — toast notification when new unread articles appear in your top categories; click to jump to the For You tab
- **History panel** — slide-in left panel showing recently visited articles and authors
- **Author info modal** — scrapes the article page for an author profile link; falls back to Wikipedia
- **Rate limiting** — sliding-window limiter on all `/api/*` routes (configurable via env vars)
- **XSS hardening** — all user-facing strings escaped before insertion into the DOM

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

## Configuration

All tuneable constants live in two files — no magic numbers scattered through the code:

| File | Purpose |
|---|---|
| `src/config.js` | Backend: pagination limits, cache TTLs, rate-limit window, cron schedule, timeouts |
| `public/config.js` | Frontend: debounce delay, toast durations, recent-history caps, pill definitions |

Rate-limit settings can be overridden at runtime via environment variables:
```
RATE_LIMIT_WINDOW_MS=60000   # default: 60 s
RATE_LIMIT_MAX=60            # default: 60 requests per window
```

## How to Run Tests

```bash
npm test
```

Tests cover pure-function modules with no mocks, no network, and no DB access:

| Module | What is tested |
|---|---|
| `categoryClassifier` | Keyword-regex article categorisation |
| `urlNormalizer` | URL normalisation (trailing slash, fragments, query strings) |
| `keywordFilter` | Article keyword filtering |
| `wikiParser` | Wikipedia API response parsing |
| `wikiCache` | In-memory TTL cache (hit/miss/expiry) |
| `rateLimiter` | Sliding-window rate-limit logic |
| `parsePagination` | Query-string pagination parsing and clamping |
| `authorLinkExtractor` | HTML scraping for author profile links |
| `htmlEscape` | XSS escape helpers |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ ok: true }` |
| GET | `/api/news` | All articles from DB; supports `?keyword=`, `?limit=`, `?offset=` |
| GET | `/api/author/:name` | Author profile link (scraped) or Wikipedia summary; supports `?articleUrl=` |

## NewsAPI Free-Tier Notes

- The free Developer plan returns a limited number of articles per request.
- Articles may be delayed by up to **24 hours** on the free tier.
- Free-tier access is **restricted to localhost** (dev use only) — the API will reject requests from deployed/public servers. You will need a paid plan for production use.
