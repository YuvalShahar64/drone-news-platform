const articlesEl     = document.getElementById('articles');
const searchInput    = document.getElementById('search-input');
const searchBtn      = document.getElementById('search-btn');
const modal          = document.getElementById('modal');
const modalBody      = document.getElementById('modal-body');
const modalClose     = document.getElementById('modal-close');
const breakingStrip  = document.getElementById('breaking-strip');
const breakingScroll = document.getElementById('breaking-scroll');

// ── localStorage helpers ──────────────────────────────────────────────────────

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── State ─────────────────────────────────────────────────────────────────────

let allArticles    = [];
let activeCategory = 'All';
let activeHours    = 24;
let debounceTimer  = null;
let toastTimer     = null;
let alertTimer     = null;
let statusTimer    = null;
let retryTimer     = null;
let retryCount     = 0;
const MAX_RETRIES    = 5;
const RETRY_DELAY_MS = 3000;

const PILL_HOURS  = CONFIG.PILL_HOURS;
const PILL_LABELS = CONFIG.PILL_LABELS;

const CATEGORY_CLASS = {
  'Military & Defense':        'cat-military',
  'Delivery & Logistics':      'cat-delivery',
  'Racing & Sport':            'cat-racing',
  'Regulations & Policy':      'cat-regulations',
  'Technology & Innovation':   'cat-technology',
  'Surveillance & Security':   'cat-surveillance',
  'General':                   'cat-general',
};

// ── Tracking ──────────────────────────────────────────────────────────────────

function trackArticleClick(article) {
  let recent = load('dn_recentArticles', []);
  recent = [
    { url: article.url, title: article.title, source: article.source, published_at: article.published_at, category: article.category },
    ...recent.filter(r => r.url !== article.url),
  ].slice(0, CONFIG.MAX_RECENT_ARTICLES);
  save('dn_recentArticles', recent);

  if (article.category) {
    let cats = load('dn_readCategories', []);
    if (!cats.includes(article.category)) {
      cats.push(article.category);
      save('dn_readCategories', cats);
    }
  }

  const seen = load('dn_seenUrls', []);
  if (!seen.includes(article.url)) {
    save('dn_seenUrls', [article.url, ...seen].slice(0, 500));
  }

  renderPanel();
}

function trackAuthorView(name, articleUrl) {
  let recent = load('dn_recentAuthors', []);
  recent = [{ name, articleUrl }, ...recent.filter(r => r.name !== name)].slice(0, CONFIG.MAX_RECENT_AUTHORS);
  save('dn_recentAuthors', recent);
  renderPanel();
}

function trackSearch(keyword) {
  if (!keyword) return;
  let recent = load('dn_recentSearches', []);
  recent = [keyword, ...recent.filter(s => s !== keyword)].slice(0, CONFIG.MAX_RECENT_SEARCHES);
  save('dn_recentSearches', recent);
}

// ── History panel ─────────────────────────────────────────────────────────────

function renderPanel() {
  const articlesList = document.getElementById('recent-articles-list');
  const authorsList  = document.getElementById('recent-authors-list');
  const articles     = load('dn_recentArticles', []);
  const authors      = load('dn_recentAuthors',  []);

  articlesList.innerHTML = articles.length
    ? articles.map(a =>
        `<li class="panel-item">
           <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" title="${escAttr(a.title)}">${esc(a.title || 'Untitled')}</a>
           ${a.source ? `<span class="panel-item-meta">${esc(a.source)}</span>` : ''}
         </li>`
      ).join('')
    : '<li class="panel-empty">Nothing yet.</li>';

  authorsList.innerHTML = authors.length
    ? authors.map(a =>
        `<li class="panel-item">
           <button class="panel-author-btn" data-author="${escAttr(a.name)}" data-article-url="${escAttr(a.articleUrl)}">${esc(a.name)}</button>
         </li>`
      ).join('')
    : '<li class="panel-empty">Nothing yet.</li>';
}

function togglePanel(open) {
  const panel  = document.getElementById('history-panel');
  const toggle = document.getElementById('panel-toggle');
  const isOpen = open !== undefined ? open : !panel.classList.contains('open');
  panel.classList.toggle('open', isOpen);
  toggle.classList.toggle('panel-is-open', isOpen);
  save('dn_panelOpen', isOpen);
}

// ── Search suggestions ────────────────────────────────────────────────────────

function renderSuggestions(query) {
  const list    = document.getElementById('search-suggestions');
  const recent  = load('dn_recentSearches', []);
  const q       = query.toLowerCase();
  const matches = q ? recent.filter(s => s.toLowerCase().includes(q)) : recent;

  if (matches.length === 0) { list.classList.remove('visible'); return; }
  list.innerHTML = matches.map(s =>
    `<li class="suggestion-item" role="option">${esc(s)}</li>`
  ).join('');
  list.classList.add('visible');
}

function hideSuggestions() {
  document.getElementById('search-suggestions').classList.remove('visible');
}

// ── For You alert ─────────────────────────────────────────────────────────────

function topCategories(n) {
  const counts = {};
  for (const a of load('dn_recentArticles', [])) {
    if (a.category) counts[a.category] = (counts[a.category] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([cat]) => cat);
}

function checkForYouAlert() {
  const topCats  = topCategories(2);
  const searches = load('dn_recentSearches', []);
  const seenSet  = new Set(load('dn_seenUrls', []));

  // Fresh category articles
  const freshCat = topCats.length > 0
    ? allArticles.filter(a => topCats.includes(a.category) && !seenSet.has(a.url))
    : [];

  // Fresh search articles — deduplicated against category results
  const counted = new Set(freshCat.map(a => a.url));
  let freshSearchCount = 0;
  for (const term of searches) {
    const lower = term.toLowerCase();
    for (const a of allArticles) {
      if (!seenSet.has(a.url) && !counted.has(a.url) &&
          ((a.title || '').toLowerCase().includes(lower) ||
           (a.description || '').toLowerCase().includes(lower))) {
        counted.add(a.url);
        freshSearchCount++;
      }
    }
  }

  const total = freshCat.length + freshSearchCount;
  if (total === 0) return;

  let msg;
  if (freshCat.length > 0 && freshSearchCount > 0) {
    msg = `${total} new article${total > 1 ? 's' : ''} in your categories and searches`;
  } else if (freshCat.length > 0) {
    msg = `${freshCat.length} new article${freshCat.length > 1 ? 's' : ''} in your categories`;
  } else {
    msg = `${freshSearchCount} new article${freshSearchCount > 1 ? 's' : ''} matching your searches`;
  }

  const alertEl = document.getElementById('foryou-alert');
  document.getElementById('foryou-alert-msg').textContent = msg;
  alertEl.classList.remove('hidden');
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => alertEl.classList.add('hidden'), CONFIG.FORYOU_ALERT_MS);
}

function dismissAlert() {
  document.getElementById('foryou-alert').classList.add('hidden');
  clearTimeout(alertTimer);
}

function switchToForYou() {
  dismissAlert();
  activeCategory = '__foryou__';
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.category === '__foryou__')
  );
  applyFilters();
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function loadNews(keyword = '', _isRetry = false) {
  if (!_isRetry) {
    retryCount = 0;
    clearTimeout(retryTimer);
    renderLoading();
  }
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  try {
    const res  = await fetch(`/api/news?${params}`);
    const data = await res.json();
    allArticles = data.articles || [];

    // If the server just started and the initial NewsAPI fetch hasn't completed yet,
    // keep retrying rather than showing "No articles yet" immediately.
    if (allArticles.length === 0 && !keyword && retryCount < MAX_RETRIES) {
      retryCount++;
      retryTimer = setTimeout(() => loadNews('', true), RETRY_DELAY_MS);
      return;
    }

    applyFilters();
    checkForYouAlert();
  } catch {
    renderError('Could not load articles. Please try again.');
  }
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function filterByTime(articles, hours, now) {
  if (hours === 0) return articles;
  return articles.filter(a => {
    if (!a.published_at) return false;
    return (now - new Date(a.published_at).getTime()) / 36e5 <= hours;
  });
}

function setActivePill(hours) {
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', Number(p.dataset.hours) === hours);
  });
}

function showPillToast(msg) {
  const toast = document.getElementById('pill-toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), CONFIG.PILL_TOAST_MS);
}

function applyFilters(showToast = false) {
  const now = Date.now();

  // Breaking news strip (always from full unfiltered set)
  const cutoff24h = now - 24 * 36e5;
  renderBreaking(allArticles.filter(
    a => a.published_at && new Date(a.published_at).getTime() >= cutoff24h
  ));

  // For You tab
  if (activeCategory === '__foryou__') {
    const topCats = topCategories(2);
    if (topCats.length === 0) {
      articlesEl.innerHTML = '<p class="state-msg">Read some articles first to personalise your feed.</p>';
      return;
    }
    const seenUrls = load('dn_seenUrls', []);
    const seenSet  = new Set(seenUrls);
    const searches = load('dn_recentSearches', []);

    // Search groups: unread articles (any category) matching each search term
    const claimedUrls = new Set();
    const searchGroups = [];
    for (const term of searches) {
      const lower   = term.toLowerCase();
      const matched = allArticles.filter(a =>
        !seenSet.has(a.url) &&
        !claimedUrls.has(a.url) &&
        ((a.title || '').toLowerCase().includes(lower) ||
         (a.description || '').toLowerCase().includes(lower))
      );
      if (matched.length === 0) continue;
      matched.forEach(a => claimedUrls.add(a.url));
      searchGroups.push({ term, articles: matched });
    }

    // Category articles: unread, in top 2 categories, not already in a search group
    const catArticles = allArticles.filter(a =>
      topCats.includes(a.category) && !seenSet.has(a.url) && !claimedUrls.has(a.url)
    );

    renderForYou(searchGroups, catArticles);
    return;
  }

  // Category filter
  const byCat = activeCategory === 'All'
    ? allArticles
    : allArticles.filter(a => a.category === activeCategory);

  // Time filter with auto-advance
  let byTime = filterByTime(byCat, activeHours, now);

  if (byTime.length === 0 && byCat.length > 0) {
    const requestedHours = activeHours;
    const idx = PILL_HOURS.indexOf(activeHours);
    for (let i = idx + 1; i < PILL_HOURS.length; i++) {
      const candidate = filterByTime(byCat, PILL_HOURS[i], now);
      if (candidate.length > 0 || PILL_HOURS[i] === 0) {
        activeHours = PILL_HOURS[i];
        setActivePill(activeHours);
        byTime = candidate;
        if (showToast) {
          showPillToast(`No articles in the last ${PILL_LABELS[requestedHours]} — showing ${PILL_LABELS[activeHours]} instead`);
        }
        break;
      }
    }
  }

  renderGrid(byTime);
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderLoading() {
  articlesEl.innerHTML = '<p class="state-msg loading">Loading articles…</p>';
}

function renderError(msg) {
  articlesEl.innerHTML = `<p class="state-msg error">${esc(msg)}</p>`;
}

function renderBreaking(articles) {
  if (articles.length === 0) { breakingStrip.classList.add('hidden'); return; }
  breakingStrip.classList.remove('hidden');
  breakingScroll.innerHTML = articles.map((a, i) =>
    (i > 0 ? '<span class="breaking-sep" aria-hidden="true">·</span>' : '') +
    `<a class="breaking-item" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title || 'Untitled')}</a>`
  ).join('');
}

function renderGrid(articles) {
  if (articles.length === 0) {
    const msg = allArticles.length === 0
      ? 'No articles yet — check back soon.'
      : 'No articles match the current filters.';
    articlesEl.innerHTML = `<p class="state-msg">${esc(msg)}</p>`;
    return;
  }
  articlesEl.innerHTML = articles.map(a => buildCard(a)).join('');
}

function buildCard(a, highlighted = false) {
  const date   = a.published_at
    ? new Date(a.published_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';
  const meta      = [a.source, date].filter(Boolean).join(' · ');
  const imgTag    = a.url_to_image
    ? `<img src="${esc(a.url_to_image)}" alt="" loading="lazy" onerror="this.style.display='none'" />`
    : '';
  const catClass  = CATEGORY_CLASS[a.category] || 'cat-general';
  const catTag    = a.category
    ? `<span class="card-category ${catClass}">${esc(a.category)}</span>`
    : '';
  const authorBtn = a.author
    ? `<button class="btn-author" data-author="${escAttr(a.author)}" data-article-url="${escAttr(a.url)}">Author Info</button>`
    : '';
  const extraClass = highlighted ? ' card-highlighted' : '';
  return `
    <article class="card${extraClass}"
      data-url="${escAttr(a.url)}"
      data-title="${escAttr(a.title)}"
      data-source="${escAttr(a.source)}"
      data-published="${escAttr(a.published_at)}"
      data-category="${escAttr(a.category)}">
      ${imgTag}
      <div class="card-body">
        ${catTag}
        <div class="card-meta">${esc(meta)}</div>
        <div class="card-title">
          <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title || 'Untitled')}</a>
        </div>
        <div class="card-description">${esc(a.description || '')}</div>
        <div class="card-author">
          <span>${esc(a.author || 'Unknown author')}</span>
          ${authorBtn}
        </div>
      </div>
    </article>`;
}

function renderForYou(searchGroups, catArticles) {
  if (searchGroups.length === 0 && catArticles.length === 0) {
    articlesEl.innerHTML = '<p class="state-msg">You\'re all caught up — check back later for new articles.</p>';
    return;
  }
  let html = '';

  for (const { term, articles } of searchGroups) {
    html += `<h2 class="foryou-group-header">Because you searched: <em>"${esc(term)}"</em></h2>`;
    html += articles.map(a => buildCard(a, true)).join('');
  }

  if (catArticles.length > 0) {
    if (html) {
      html += `<h2 class="foryou-group-header foryou-group-header--more">New in your top categories</h2>`;
    }
    html += catArticles.map(a => buildCard(a)).join('');
  }

  articlesEl.innerHTML = html;
}

// ── Author modal ──────────────────────────────────────────────────────────────

async function showAuthorInfo(name, articleUrl) {
  trackAuthorView(name, articleUrl);
  modalBody.innerHTML = '<p>Loading…</p>';
  modal.classList.remove('hidden');
  try {
    const params = new URLSearchParams({ articleUrl });
    const res  = await fetch(`/api/author/${encodeURIComponent(name)}?${params}`);
    const data = await res.json();
    renderModal(data, name);
  } catch {
    modalBody.innerHTML = '<p class="modal-error">Failed to fetch author information.</p>';
  }
}

function renderModal(data, name) {
  if (!data.ok) {
    modalBody.innerHTML = `<p class="modal-error">${esc(data.message || 'Author information not available.')}</p>`;
    return;
  }
  if (data.type === 'link') {
    modalBody.innerHTML = `
      <h2>${esc(name)}</h2>
      <p>An author profile page was found for this article.</p>
      <a class="btn-profile" href="${esc(data.authorUrl)}" target="_blank" rel="noopener noreferrer">View Author Profile &rarr;</a>`;
    return;
  }
  if (data.type === 'wiki') {
    const thumb    = data.thumbnail
      ? `<img class="modal-thumb" src="${esc(data.thumbnail)}" alt="${escAttr(data.title)}" />`
      : '';
    const wikiLink = data.url
      ? `<a href="${esc(data.url)}" target="_blank" rel="noopener noreferrer">Read on Wikipedia &rarr;</a>`
      : '';
    modalBody.innerHTML = `${thumb}<h2>${esc(data.title)}</h2><p>${esc(data.summary)}</p>${wikiLink}`;
  }
}

// ── Feed status label ─────────────────────────────────────────────────────────

function relTime(ms) {
  const diff = Math.round((Date.now() - ms) / 60_000);
  if (diff < 1) return 'just now';
  return `${diff} min ago`;
}

function inTime(ms) {
  const diff = Math.round((ms - Date.now()) / 60_000);
  if (diff <= 0) return 'any moment';
  if (diff === 1) return 'in 1 min';
  return `in ${diff} min`;
}

async function fetchAndRenderStatus() {
  try {
    const res  = await fetch('/api/status');
    const data = await res.json();
    if (!data.ok) return;
    const el       = document.getElementById('feed-status');
    const lastText = data.lastFetchAt != null ? relTime(data.lastFetchAt) : 'pending…';
    const nextText = inTime(data.nextFetchAt);
    el.innerHTML =
      `<span>Last fed <strong>${esc(lastText)}</strong></span>` +
      `<br><span>Next <strong>${esc(nextText)}</strong></span>`;
  } catch {}
}

function scheduleFeedStatus() {
  fetchAndRenderStatus();
  clearInterval(statusTimer);
  statusTimer = setInterval(fetchAndRenderStatus, 60_000);
}

// ── Escape helpers ────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

// ── Event listeners ───────────────────────────────────────────────────────────

// Search
searchBtn.addEventListener('click', () => {
  clearTimeout(debounceTimer);
  const kw = searchInput.value.trim();
  trackSearch(kw);
  hideSuggestions();
  loadNews(kw);
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer);
    const kw = searchInput.value.trim();
    trackSearch(kw);
    hideSuggestions();
    loadNews(kw);
  }
  if (e.key === 'Escape') hideSuggestions();
});
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  renderSuggestions(searchInput.value.trim());
  debounceTimer = setTimeout(() => loadNews(searchInput.value.trim()), CONFIG.DEBOUNCE_MS);
});
searchInput.addEventListener('focus', () => renderSuggestions(searchInput.value.trim()));
searchInput.addEventListener('blur',  () => setTimeout(hideSuggestions, 150));

document.getElementById('search-suggestions').addEventListener('click', e => {
  const item = e.target.closest('.suggestion-item');
  if (!item) return;
  const term = item.textContent;
  searchInput.value = term;
  hideSuggestions();
  trackSearch(term);
  loadNews(term);
});

// Category tabs
document.getElementById('category-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeCategory = tab.dataset.category;
  applyFilters();
});

// Time pills
document.getElementById('time-pills').addEventListener('click', e => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  activeHours = Number(pill.dataset.hours);
  setActivePill(activeHours);
  applyFilters(true);
});

// Article grid interactions
articlesEl.addEventListener('click', e => {
  const link = e.target.closest('.card-title a');
  if (link) {
    const card = link.closest('.card');
    if (card) {
      trackArticleClick({
        url:          card.dataset.url,
        title:        card.dataset.title,
        source:       card.dataset.source,
        published_at: card.dataset.published,
        category:     card.dataset.category,
      });
    }
  }
  const btn = e.target.closest('.btn-author');
  if (btn) showAuthorInfo(btn.dataset.author, btn.dataset.articleUrl);
});

// History panel
document.getElementById('panel-toggle').addEventListener('click', () => togglePanel());
document.getElementById('panel-close').addEventListener('click',  () => togglePanel(false));
document.getElementById('history-panel').addEventListener('click', e => {
  const btn = e.target.closest('.panel-author-btn');
  if (btn) showAuthorInfo(btn.dataset.author, btn.dataset.articleUrl);
});

// For You alert
document.getElementById('foryou-alert-btn').addEventListener('click',     switchToForYou);
document.getElementById('foryou-alert-dismiss').addEventListener('click', dismissAlert);

// Dev tools
document.getElementById('btn-add-mock').addEventListener('click', async () => {
  const kw = window.prompt('Keywords for the mock article (these appear in title & description):');
  if (!kw || !kw.trim()) return;
  await fetch('/api/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: kw.trim() }),
  });
  loadNews();
});

document.getElementById('btn-refresh').addEventListener('click', async () => {
  const btn = document.getElementById('btn-refresh');
  btn.disabled = true;
  btn.textContent = '↻ …';
  await fetch('/api/refresh', { method: 'POST' }).catch(() => {});
  btn.disabled = false;
  btn.textContent = '↻ Refresh';
  loadNews();
  scheduleFeedStatus();
});

// Modal
function closeModal() { modal.classList.add('hidden'); }
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Init ──────────────────────────────────────────────────────────────────────

renderPanel();
if (load('dn_panelOpen', false)) {
  // Open without triggering the CSS transition on first paint
  document.getElementById('history-panel').classList.add('open');
  document.getElementById('panel-toggle').classList.add('panel-is-open');
}
loadNews();
scheduleFeedStatus();
