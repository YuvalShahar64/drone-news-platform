const FALLBACK = { ok: false, message: 'Author information not available.' };

function parseWikiResponse(responseOrError) {
  if (!responseOrError || responseOrError instanceof Error) {
    return FALLBACK;
  }
  if (responseOrError.type === 'disambiguation') {
    return FALLBACK;
  }
  if (!responseOrError.extract) {
    return FALLBACK;
  }
  return {
    ok: true,
    title: responseOrError.title,
    summary: responseOrError.extract,
    thumbnail: responseOrError.thumbnail ? responseOrError.thumbnail.source : null,
    url: responseOrError.content_urls && responseOrError.content_urls.desktop
      ? responseOrError.content_urls.desktop.page
      : null,
  };
}

module.exports = { parseWikiResponse };
