const { parseWikiResponse } = require('./wikiParser');

const successResponse = {
  type: 'standard',
  title: 'Elon Musk',
  extract: 'Elon Musk is a business magnate and investor.',
  thumbnail: { source: 'https://example.com/thumb.jpg' },
  content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Elon_Musk' } },
};

describe('parseWikiResponse', () => {
  test('returns clean summary object on success', () => {
    const result = parseWikiResponse(successResponse);
    expect(result.ok).toBe(true);
    expect(result.title).toBe('Elon Musk');
    expect(result.summary).toBe('Elon Musk is a business magnate and investor.');
    expect(result.thumbnail).toBe('https://example.com/thumb.jpg');
    expect(result.url).toBe('https://en.wikipedia.org/wiki/Elon_Musk');
  });

  test('returns fallback on Error object', () => {
    const result = parseWikiResponse(new Error('Network error'));
    expect(result.ok).toBe(false);
    expect(result.message).toBeDefined();
  });

  test('returns fallback on null', () => {
    expect(parseWikiResponse(null).ok).toBe(false);
  });

  test('returns fallback on undefined', () => {
    expect(parseWikiResponse(undefined).ok).toBe(false);
  });

  test('returns fallback for disambiguation page', () => {
    const result = parseWikiResponse({
      type: 'disambiguation',
      title: 'Mercury',
      extract: 'Mercury may refer to:',
    });
    expect(result.ok).toBe(false);
  });

  test('returns fallback for 404 not-found response (no extract)', () => {
    const result = parseWikiResponse({
      type: 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found',
      title: 'Not found.',
    });
    expect(result.ok).toBe(false);
  });

  test('handles missing thumbnail gracefully', () => {
    const noThumb = { ...successResponse, thumbnail: undefined };
    const result = parseWikiResponse(noThumb);
    expect(result.ok).toBe(true);
    expect(result.thumbnail).toBeNull();
  });

  test('handles missing content_urls gracefully', () => {
    const noUrls = { ...successResponse, content_urls: undefined };
    const result = parseWikiResponse(noUrls);
    expect(result.ok).toBe(true);
    expect(result.url).toBeNull();
  });
});
