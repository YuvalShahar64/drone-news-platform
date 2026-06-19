const { filterByKeyword } = require('./keywordFilter');

const articles = [
  { title: 'Drone delivery expands in urban areas', description: 'Major companies rolling out drone delivery.' },
  { title: 'New aviation regulations proposed', description: 'FAA considers rules for unmanned aerial vehicles.' },
  { title: null, description: null },
];

describe('filterByKeyword', () => {
  test('returns all articles when keyword is empty string', () => {
    expect(filterByKeyword(articles, '')).toEqual(articles);
  });

  test('returns all articles when keyword is undefined', () => {
    expect(filterByKeyword(articles, undefined)).toEqual(articles);
  });

  test('returns all articles when keyword is null', () => {
    expect(filterByKeyword(articles, null)).toEqual(articles);
  });

  test('filters by title match (case-insensitive)', () => {
    const result = filterByKeyword(articles, 'DRONE');
    expect(result).toHaveLength(1);
    expect(result[0].title).toMatch(/Drone/i);
  });

  test('filters by description match', () => {
    const result = filterByKeyword(articles, 'unmanned aerial');
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('unmanned aerial');
  });

  test('returns empty array when no articles match', () => {
    expect(filterByKeyword(articles, 'helicopter')).toEqual([]);
  });

  test('handles articles with null title or description without throwing', () => {
    expect(() => filterByKeyword(articles, 'drone')).not.toThrow();
  });
});
