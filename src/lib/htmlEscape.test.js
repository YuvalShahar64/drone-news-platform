const { escHtml } = require('./htmlEscape');

describe('escHtml', () => {
  test('escapes &', () => expect(escHtml('a & b')).toBe('a &amp; b'));
  test('escapes <', () => expect(escHtml('<script>')).toBe('&lt;script&gt;'));
  test('escapes >', () => expect(escHtml('a > b')).toBe('a &gt; b'));
  test('escapes "', () => expect(escHtml('say "hi"')).toBe('say &quot;hi&quot;'));
  test("escapes '", () => expect(escHtml("it's")).toBe('it&#39;s'));
  test('returns empty string for null', () => expect(escHtml(null)).toBe(''));
  test('returns empty string for undefined', () => expect(escHtml(undefined)).toBe(''));
  test('leaves safe strings untouched', () => expect(escHtml('hello world')).toBe('hello world'));
});
