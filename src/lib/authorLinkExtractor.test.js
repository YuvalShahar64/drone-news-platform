const { extractAuthorLink } = require('./authorLinkExtractor');

const BASE = 'https://example.com';

describe('extractAuthorLink', () => {
  test('finds an /author/ link', () => {
    const html = `<a href="/author/jane-doe">Jane Doe</a>`;
    expect(extractAuthorLink(html, BASE)).toBe('https://example.com/author/jane-doe');
  });

  test('finds an /authors/ link', () => {
    const html = `<a href="/authors/john-smith">John Smith</a>`;
    expect(extractAuthorLink(html, BASE)).toBe('https://example.com/authors/john-smith');
  });

  test('finds a /staff/ link', () => {
    const html = `<a href="/staff/reporter-name">Reporter</a>`;
    expect(extractAuthorLink(html, BASE)).toBe('https://example.com/staff/reporter-name');
  });

  test('finds a /bio/ link', () => {
    const html = `<a href="https://news.com/bio/alice-jones">Alice</a>`;
    expect(extractAuthorLink(html, BASE)).toBe('https://news.com/bio/alice-jones');
  });

  test('returns null when no author link present', () => {
    const html = `<a href="/about">About</a><a href="/contact">Contact</a>`;
    expect(extractAuthorLink(html, BASE)).toBeNull();
  });

  test('skips asset paths', () => {
    const html = `<a href="/author/photo.png">Photo</a><a href="/staff/reporter">Reporter</a>`;
    expect(extractAuthorLink(html, BASE)).toBe('https://example.com/staff/reporter');
  });

  test('resolves relative hrefs against baseUrl', () => {
    const html = `<a href="/writers/bob">Bob</a>`;
    expect(extractAuthorLink(html, 'https://site.org')).toBe('https://site.org/writers/bob');
  });

  test('returns null for slug shorter than 3 chars', () => {
    const html = `<a href="/author/ab">Short</a>`;
    expect(extractAuthorLink(html, BASE)).toBeNull();
  });

  test('does not throw on empty html', () => {
    expect(() => extractAuthorLink('', BASE)).not.toThrow();
    expect(extractAuthorLink('', BASE)).toBeNull();
  });

  test('resets state correctly across multiple calls', () => {
    const html = `<a href="/author/first-author">A</a>`;
    expect(extractAuthorLink(html, BASE)).toBe('https://example.com/author/first-author');
    expect(extractAuthorLink(html, BASE)).toBe('https://example.com/author/first-author');
  });
});
