const articlesEl   = document.getElementById('articles');
const searchInput  = document.getElementById('search-input');
const searchBtn    = document.getElementById('search-btn');
const modal        = document.getElementById('modal');
const modalBody    = document.getElementById('modal-body');
const modalClose   = document.getElementById('modal-close');
const breakingStrip  = document.getElementById('breaking-strip');
const breakingScroll = document.getElementById('breaking-scroll');

// ── State ───────────────────────────────────────────────────────────────────

let allArticles    = [];
let activeCategory = 'All';
let activeHours    = 24;
let debounceTimer  = null;
let toastTimer     = null;

// Pill values ordered from most to least restrictive (0 = All time)
const PILL_HOURS  = [24, 168, 720, 0];
const PILL_LABELS = { 24: '24h', 168: '7 days', 720: '30 days', 0: 'all time' };

// ── Fetch ────────────────────────────────────────────────────────────────────

async function loadNews(keyword = '') {
  renderLoading();
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  try {
    const res  = await fetch(`/api/news?${params}`);
    const data = await res.json();
    allArticles = data.articles || [];
    applyFilters();
  } catch {
    renderError('Could not load articles. Please try again.');
  }
}

// ── Filtering ────────────────────────────────────────────────────────────────

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
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function applyFilters(showToast = false) {
  const now = Date.now();

  // Breaking news: articles < 24h from unfiltered set (ignores category/time filters)
  const cutoff24h = now - 24 * 36e5;
  const breaking = allArticles.filter(
    a => a.published_at && new Date(a.published_at).getTime() >= cutoff24h
  );
  renderBreaking(breaking);

  // Category filter
  const byCat = activeCategory === 'All'
    ? allArticles
    : allArticles.filter(a => a.category === activeCategory);

  // Time filter
  let byTime = filterByTime(byCat, activeHours, now);

  // If no articles match, auto-advance to the next less restrictive pill
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
          showPillToast(
            `No articles in the last ${PILL_LABELS[requestedHours]} — showing ${PILL_LABELS[activeHours]} instead`
          );
        }
        break;
      }
    }
  }

  renderGrid(byTime);
}

// ── Renderers ────────────────────────────────────────────────────────────────

function renderLoading() {
  articlesEl.innerHTML = '<p class="state-msg loading">Loading articles…</p>';
}

function renderError(msg) {
  articlesEl.innerHTML = `<p class="state-msg error">${esc(msg)}</p>`;
}

function renderBreaking(articles) {
  if (articles.length === 0) {
    breakingStrip.classList.add('hidden');
    return;
  }
  breakingStrip.classList.remove('hidden');
  breakingScroll.innerHTML = articles.map((a, i) =>
    (i > 0 ? '<span class="breaking-sep" aria-hidden="true">·</span>' : '') +
    `<a class="breaking-item" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title || 'Untitled')}</a>`
  ).join('');
}

function renderGrid(articles) {
  if (articles.length === 0) {
    const msg = allArticles.length === 0
      ? 'No corresponding articles yet — check back soon.'
      : 'No articles match the current filters.';
    articlesEl.innerHTML = `<p class="state-msg">${esc(msg)}</p>`;
    return;
  }
  articlesEl.innerHTML = articles.map(buildCard).join('');
}

function buildCard(a) {
  const date   = a.published_at
    ? new Date(a.published_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';
  const meta   = [a.source, date].filter(Boolean).join(' · ');
  const imgTag = a.url_to_image
    ? `<img src="${esc(a.url_to_image)}" alt="" loading="lazy" onerror="this.style.display='none'" />`
    : '';
  const categoryTag = a.category
    ? `<span class="card-category">${esc(a.category)}</span>`
    : '';
  const authorBtn = a.author
    ? `<button class="btn-author" data-author="${escAttr(a.author)}" data-article-url="${escAttr(a.url)}">Author Info</button>`
    : '';
  return `
    <article class="card">
      ${imgTag}
      <div class="card-body">
        ${categoryTag}
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

// ── Author modal ─────────────────────────────────────────────────────────────

async function showAuthorInfo(name, articleUrl) {
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
      <a class="btn-profile" href="${esc(data.authorUrl)}" target="_blank" rel="noopener noreferrer">View Author Profile →</a>`;
    return;
  }
  if (data.type === 'wiki') {
    const thumb = data.thumbnail
      ? `<img class="modal-thumb" src="${esc(data.thumbnail)}" alt="${escAttr(data.title)}" />`
      : '';
    const wikiLink = data.url
      ? `<a href="${esc(data.url)}" target="_blank" rel="noopener noreferrer">Read on Wikipedia →</a>`
      : '';
    modalBody.innerHTML = `
      ${thumb}
      <h2>${esc(data.title)}</h2>
      <p>${esc(data.summary)}</p>
      ${wikiLink}`;
  }
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

searchBtn.addEventListener('click', () => {
  clearTimeout(debounceTimer);
  loadNews(searchInput.value.trim());
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { clearTimeout(debounceTimer); loadNews(searchInput.value.trim()); }
});
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadNews(searchInput.value.trim()), 300);
});

document.getElementById('category-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeCategory = tab.dataset.category;
  applyFilters();
});

document.getElementById('time-pills').addEventListener('click', e => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  activeHours = Number(pill.dataset.hours);
  setActivePill(activeHours);
  applyFilters(true);
});

function closeModal() { modal.classList.add('hidden'); }
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

articlesEl.addEventListener('click', e => {
  const btn = e.target.closest('.btn-author');
  if (btn) showAuthorInfo(btn.dataset.author, btn.dataset.articleUrl);
});

// ── Init ──────────────────────────────────────────────────────────────────────

loadNews();
