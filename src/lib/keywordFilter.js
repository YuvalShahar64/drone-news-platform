function filterByKeyword(articles, keyword) {
  if (!keyword) return articles;
  const lower = keyword.toLowerCase();
  return articles.filter(a =>
    (a.title && a.title.toLowerCase().includes(lower)) ||
    (a.description && a.description.toLowerCase().includes(lower))
  );
}

module.exports = { filterByKeyword };
