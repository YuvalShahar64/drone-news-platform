const { isRateLimited, pruneTimestamps } = require('./rateLimiter');

const WINDOW = 60_000; // 1 minute
const MAX    = 5;

describe('pruneTimestamps', () => {
  test('keeps timestamps within the window', () => {
    const now = 10_000;
    const ts  = [5_000, 8_000, 9_500];
    expect(pruneTimestamps(ts, now, WINDOW)).toEqual([5_000, 8_000, 9_500]);
  });

  test('drops timestamps outside the window', () => {
    const now = 70_000;
    const ts  = [1_000, 50_000, 65_000];
    expect(pruneTimestamps(ts, now, WINDOW)).toEqual([50_000, 65_000]);
  });

  test('returns empty array when all timestamps expired', () => {
    expect(pruneTimestamps([1, 2, 3], 200_000, WINDOW)).toEqual([]);
  });
});

describe('isRateLimited', () => {
  test('returns false when under the limit', () => {
    const ts = [1000, 2000, 3000]; // 3 < MAX(5)
    expect(isRateLimited(ts, 5000, WINDOW, MAX)).toBe(false);
  });

  test('returns true when exactly at the limit', () => {
    const ts = [1000, 2000, 3000, 4000, 5000]; // 5 === MAX
    expect(isRateLimited(ts, 6000, WINDOW, MAX)).toBe(true);
  });

  test('returns true when over the limit', () => {
    const ts = [1000, 2000, 3000, 4000, 5000, 6000]; // 6 > MAX
    expect(isRateLimited(ts, 7000, WINDOW, MAX)).toBe(true);
  });

  test('expired timestamps do not count toward the limit', () => {
    const now = 200_000;
    // 4 old (expired) + 4 fresh — only 4 fresh count, under MAX(5)
    const ts = [1000, 2000, 3000, 4000, 180_000, 185_000, 190_000, 195_000];
    expect(isRateLimited(ts, now, WINDOW, MAX)).toBe(false);
  });

  test('returns false for an empty timestamp array', () => {
    expect(isRateLimited([], 1000, WINDOW, MAX)).toBe(false);
  });
});
