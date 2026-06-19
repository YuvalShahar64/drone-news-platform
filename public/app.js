const articlesEl  = document.getElementById('articles');
const searchInput = document.getElementById('search-input');
const searchBtn   = document.getElementById('search-btn');
const modal       = document.getElementById('modal');
const modalBody   = document.getElementById('modal-body');
const modalClose  = document.getElementById('modal-close');

// ── Fetch & render ──────────────────────────────────────────────────────────

async function loadNews(keyword = '') {
  articlesEl.innerHTML = '<p class="empty-msg">Loading…</p>';
  const url = keyword
    ? `/api/news?keyword=${encodeURIComponent(keyword)}`
    : '/api/news';
  try {
    const res  = await fetch(url);
    const data = await res.json();
    renderArticles(data);
  } catch {
    articlesEl.innerHTML = '<p class="empty-msg">Failed to load news. Is the server running?</p>';
  }
}

function renderArticles({ articles, message }) {
  if (!articles || articles.length === 0) {
    articlesEl.innerHTML = `<p class="empty-msg">${esc(message || 'No articles found.')}</p>`;
    return;
  }
  articlesEl.innerHTML = articles.map(buildCard).join('');
}

function buildCard(a) {
  const date   = a.published_at ? new Date(a.published_at).toLocaleDateString() : '';
  const meta   = [a.source, date].filter(Boolean).join(' · ');
  const imgTag = a.url_to_image
    ? `<img src="${esc(a.url_to_image)}" alt="" loading="lazy" onerror="this.style.display='none'" />`
    : '';
  const authorBtn = a.author
    ? `<button class="btn-author" data-author="${escAttr(a.author)}">Author Info</button>`
    : '';
  return `
    <article class="card">
      ${imgTag}
      <div class="card-body">
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

// ── Author modal ────────────────────────────────────────────────────────────

async function showAuthorInfo(name) {
  modalBody.innerHTML = '<p>Loading…</p>';
  modal.classList.remove('hidden');
  try {
    const res  = await fetch(`/api/author/${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!data.ok) {
      modalBody.innerHTML = `<p class="modal-error">${esc(data.message)}</p>`;
      return;
    }
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
  } catch {
    modalBody.innerHTML = '<p class="modal-error">Failed to fetch author information.</p>';
  }
}

function closeModal() { modal.classList.add('hidden'); }

// ── Escape helpers ──────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

// ── Event listeners ─────────────────────────────────────────────────────────

searchBtn.addEventListener('click', () => loadNews(searchInput.value.trim()));
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') loadNews(searchInput.value.trim());
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

articlesEl.addEventListener('click', e => {
  const btn = e.target.closest('.btn-author');
  if (btn) showAuthorInfo(btn.dataset.author);
});

// ── Init ────────────────────────────────────────────────────────────────────

loadNews();
