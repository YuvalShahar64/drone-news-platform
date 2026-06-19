# Technical Design Document — VOOM / Skywatch Project

## 1. System Overview
The system is a full-stack web application designed to keep drone enthusiasts up to date with the latest news in the field. It continuously fetches articles, stores them locally, and serves them via an HTTP server that allows searching and filtering. The system is wrapped in a simple, readable user interface, with no user management (no authentication).

## 2. Architecture & Runtime Environment (Stack)
- **Runtime:** Node.js (target **v20+**). Chosen for its ability to run both background services and a web server under a single process, which simplifies the testing process. Uses the **native `fetch`** API and `AbortController` — no `axios` or `node-fetch`.
- **Network Layer (Framework):** Express.js. Manages routing and serves the static client-side files.
- **Database:** SQLite via **`better-sqlite3`** (synchronous, no callback handling, easy to wrap). Provides persistent storage with no external infrastructure. The DB file is created locally in the project folder.
  - **WAL mode enabled** (Write-Ahead Logging): allows the background worker to write while the API reads concurrently, with better performance. Produces sidecar files (`*.db-wal`, `*.db-shm`) which are gitignored.

## 3. Background Worker
- **Library:** `node-cron`.
- **Process:** A background job that **runs once immediately on startup** (so a fresh clone is not empty), then repeats **every 30 minutes**, querying the News API (`/v2/everything`) with the keyword `"drone"`.
- **Data Storage Strategy:** Data is saved to SQLite using **UPSERT** with the article **`url`** as the `UNIQUE` conflict key (`ON CONFLICT(url) DO UPDATE`). NewsAPI articles have no stable ID, so `url` serves as the natural unique identifier. This maintains a stream of news without duplicates and without deleting old information.

## 4. RESTful Endpoints

### `GET /api/news` (Mandatory)
- Fetches news from the **local database** (not the external API) for fast response times.
- **Filtering:** Supports a `?keyword=...` parameter. When provided, the server performs a `LIKE` query on the `title` and `description` fields and returns only matching results.
- **Empty-DB handling:** When no rows exist yet, returns a friendly payload rather than a bare array, e.g. `{ ok: true, articles: [], message: "No articles yet — the fetcher runs on startup and every 30 minutes." }`.

### `GET /api/author/:name` (Bonus — External Integration)
- Accepts a reporter's name and queries the **Wikipedia REST API** (`https://en.wikipedia.org/api/rest_v1/page/summary/{name}`) for a summary.
- **Name normalization:** Spaces are converted to underscores and the name is URL-encoded before the request.
- **Disambiguation handling:** If Wikipedia returns a disambiguation page (`type === "disambiguation"`), it is treated as **not found** and the fallback message is returned, rather than showing a confusing stub.
- **Fault Tolerance:** The call is wrapped in try/catch with a **5-second timeout** (via `AbortController`). If Wikipedia is unavailable, times out, 404s, or returns a disambiguation page, the server does **not** crash — it returns a graceful fallback JSON.

### `GET /api/health`
- A trivial liveness endpoint returning `{ ok: true }`, so a reviewer can confirm the server is up independent of whether any data has been fetched yet.

### Error / Fallback Response Shape
All error and fallback cases use a consistent shape:
```json
{ "ok": false, "message": "..." }
```

## 5. Frontend (Presentation Layer)
- **Technologies:** Vanilla HTML, CSS, and pure JavaScript (no React/Angular).
- **Serving Method:** UI files reside in `/public` and are served statically by Express.
- **Functionality:**
  - Automatic `fetch` to `/api/news` on page load.
  - Articles displayed in a modern card layout.
  - A search bar that triggers a new `fetch` with the `keyword` parameter (on typing or button click).
  - An "Author Info" button on each card that calls the Wikipedia endpoint and displays the summary or the fallback message.

## 6. Software Testing & Reliability (Unit Testing)
- **Framework:** Jest.
- **Strategy:** Unit-test the **business logic**, not the network. The two testable units are written as **pure functions in `/src/lib/`** with **no DB or network imports**, so tests call them directly with plain objects and require no mocks for the core logic:
  1. **Keyword filtering** — given an array of articles and a keyword, returns the matching subset.
  2. **Wikipedia response parsing / error handling** — given a Wikipedia API response object (or error/disambiguation case), returns a clean summary or the fallback.
- Any remaining network or DB boundaries are mocked where unavoidable, but the core logic needs none.

## 7. Environment Management, Security & GitHub (DevOps & Tooling)
- **Environment Variables:** `dotenv`. Sensitive keys (`NEWS_API_KEY`) live in a local `.env` that is **not** committed. A `.env.example` is committed to guide the reviewer.
- **.gitignore:** Configured to exclude secrets (`.env`), `node_modules`, and all database files including WAL sidecars: `*.db`, `*.sqlite`, `*.sqlite3`, `*.db-wal`, `*.db-shm`.
- **Minimal dependencies:** No tooling (ESLint, Prettier, Husky, Docker, TypeScript, etc.) is added beyond what is specified here without explicit approval.
- **Documentation (README.md):** Concise technical doc covering system/architecture overview, prerequisites (Node 20+), step-by-step run instructions (rename `.env.example` → `.env`, `npm install`, `npm start`), and test instructions (`npm test`).
  - Note on NewsAPI free tier: limited articles, ~24h delay, and dev-environment restrictions — documented so the reviewer is not surprised.

## 8. Folder Structure
```
/public            → static frontend (HTML/CSS/JS)
/src
  /routes          → Express route definitions
  /controllers     → request/response handling
  /services        → DB access, News API client, Wikipedia client, worker
  /lib             → PURE functions (keyword filter, Wikipedia parser) — no DB/network imports
  db/init          → SQLite init script (creates articles table, sets WAL)
.env.example
.gitignore
package.json       → scripts: start, test
README.md
```
