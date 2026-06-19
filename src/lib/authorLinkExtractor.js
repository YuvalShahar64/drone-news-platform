const AUTHOR_PATH_RE = /href=["']([^"']*\/(?:authors?|writers?|staff|contributors?|bio|people)\/[^"'\s?#]{3,})[^"']*["']/gi;

function extractAuthorLink(html, baseUrl) {
  AUTHOR_PATH_RE.lastIndex = 0;
  let m;
  while ((m = AUTHOR_PATH_RE.exec(html)) !== null) {
    const href = m[1];
    if (/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)$/i.test(href)) continue;
    try {
      return new URL(href, baseUrl).href;
    } catch {
      // malformed href — skip
    }
  }
  return null;
}

module.exports = { extractAuthorLink, AUTHOR_PATH_RE };
