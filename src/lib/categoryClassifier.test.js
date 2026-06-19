const { classifyArticle, DEFAULT_CATEGORY } = require('./categoryClassifier');

describe('classifyArticle', () => {
  test('classifies military article', () => {
    expect(classifyArticle({ title: 'Pentagon deploys combat drones', description: '' }))
      .toBe('Military & Defense');
  });

  test('classifies delivery article', () => {
    expect(classifyArticle({ title: 'Amazon drone delivery expands to new cities', description: '' }))
      .toBe('Delivery & Logistics');
  });

  test('classifies racing article', () => {
    expect(classifyArticle({ title: 'FPV racing championship results', description: '' }))
      .toBe('Racing & Sport');
  });

  test('classifies regulations article', () => {
    expect(classifyArticle({ title: 'FAA issues new airspace rules', description: '' }))
      .toBe('Regulations & Policy');
  });

  test('classifies surveillance article', () => {
    expect(classifyArticle({ title: 'Border patrol uses surveillance drones', description: '' }))
      .toBe('Surveillance & Security');
  });

  test('classifies technology article', () => {
    expect(classifyArticle({ title: 'New autonomous drone prototype unveiled', description: '' }))
      .toBe('Technology & Innovation');
  });

  test('falls back to General when no rule matches', () => {
    expect(classifyArticle({ title: 'A drone flew over a field', description: '' }))
      .toBe(DEFAULT_CATEGORY);
  });

  test('is case-insensitive', () => {
    expect(classifyArticle({ title: 'FAA REGULATION UPDATE', description: '' }))
      .toBe('Regulations & Policy');
  });

  test('matches on description when title does not match', () => {
    expect(classifyArticle({ title: 'Drone spotted', description: 'Military soldiers used it in combat' }))
      .toBe('Military & Defense');
  });

  test('handles null title and description without throwing', () => {
    expect(() => classifyArticle({ title: null, description: null })).not.toThrow();
    expect(classifyArticle({ title: null, description: null })).toBe(DEFAULT_CATEGORY);
  });
});
