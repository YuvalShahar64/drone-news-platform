const { parsePagination, DEFAULT_LIMIT, MAX_LIMIT } = require('./parsePagination');

describe('parsePagination', () => {
  test('returns defaults when query is empty', () => {
    expect(parsePagination({})).toEqual({ limit: DEFAULT_LIMIT, offset: 0 });
  });

  test('parses valid limit and offset', () => {
    expect(parsePagination({ limit: '10', offset: '40' })).toEqual({ limit: 10, offset: 40 });
  });

  test('clamps limit above MAX_LIMIT to MAX_LIMIT', () => {
    expect(parsePagination({ limit: '999' }).limit).toBe(MAX_LIMIT);
  });

  test('clamps limit below 1 to DEFAULT_LIMIT', () => {
    expect(parsePagination({ limit: '0' }).limit).toBe(DEFAULT_LIMIT);
  });

  test('clamps negative offset to 0', () => {
    expect(parsePagination({ offset: '-5' }).offset).toBe(0);
  });

  test('treats NaN limit as default', () => {
    expect(parsePagination({ limit: 'abc' }).limit).toBe(DEFAULT_LIMIT);
  });

  test('treats NaN offset as 0', () => {
    expect(parsePagination({ offset: 'abc' }).offset).toBe(0);
  });

  test('treats missing params as defaults', () => {
    expect(parsePagination({ limit: undefined, offset: undefined }))
      .toEqual({ limit: DEFAULT_LIMIT, offset: 0 });
  });
});
