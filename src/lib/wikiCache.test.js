const { buildCacheKey, isFresh } = require('./wikiCache');

describe('buildCacheKey', () => {
  test('lowercases the name', () => {
    expect(buildCacheKey('Elon Musk')).toBe('elon musk');
  });

  test('trims surrounding whitespace', () => {
    expect(buildCacheKey('  Jane Doe  ')).toBe('jane doe');
  });

  test('collapses internal whitespace', () => {
    expect(buildCacheKey('John  A   Smith')).toBe('john a smith');
  });

  test('same key for differently-cased inputs', () => {
    expect(buildCacheKey('ELON MUSK')).toBe(buildCacheKey('elon musk'));
  });

  test('handles null/undefined without throwing', () => {
    expect(() => buildCacheKey(null)).not.toThrow();
    expect(() => buildCacheKey(undefined)).not.toThrow();
  });
});

describe('isFresh', () => {
  const TTL = 60_000; // 1 minute for tests

  test('returns true when entry is within TTL', () => {
    const entry = { storedAt: 1000 };
    expect(isFresh(entry, 1000 + TTL - 1, TTL)).toBe(true);
  });

  test('returns false when entry is exactly at TTL boundary', () => {
    const entry = { storedAt: 1000 };
    expect(isFresh(entry, 1000 + TTL, TTL)).toBe(false);
  });

  test('returns false when entry is past TTL', () => {
    const entry = { storedAt: 1000 };
    expect(isFresh(entry, 1000 + TTL + 1, TTL)).toBe(false);
  });

  test('returns true for a brand-new entry (age = 0)', () => {
    const now = 5000;
    const entry = { storedAt: now };
    expect(isFresh(entry, now, TTL)).toBe(true);
  });
});
