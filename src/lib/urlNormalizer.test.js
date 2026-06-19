const { normalizeUrl } = require('./urlNormalizer');

describe('normalizeUrl', () => {
  test('strips utm tracking params', () => {
    expect(normalizeUrl('https://example.com/article?utm_source=twitter&utm_medium=social'))
      .toBe('https://example.com/article');
  });

  test('strips fbclid', () => {
    expect(normalizeUrl('https://example.com/article?fbclid=abc123'))
      .toBe('https://example.com/article');
  });

  test('keeps meaningful query params', () => {
    expect(normalizeUrl('https://example.com/search?q=drone'))
      .toBe('https://example.com/search?q=drone');
  });

  test('strips /amp suffix', () => {
    expect(normalizeUrl('https://example.com/article/amp'))
      .toBe('https://example.com/article');
  });

  test('strips trailing slash', () => {
    expect(normalizeUrl('https://example.com/article/'))
      .toBe('https://example.com/article');
  });

  test('strips hash fragment', () => {
    expect(normalizeUrl('https://example.com/article#section'))
      .toBe('https://example.com/article');
  });

  test('returns original url on parse failure', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
  });

  test('two urls that differ only by tracking params normalise to the same string', () => {
    const a = normalizeUrl('https://site.com/story?utm_source=google');
    const b = normalizeUrl('https://site.com/story?utm_source=facebook');
    expect(a).toBe(b);
  });
});
