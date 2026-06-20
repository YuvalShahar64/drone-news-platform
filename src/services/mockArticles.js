const { classifyArticle } = require('../lib/categoryClassifier');

const mocks = [];

function addMock(keywords) {
  mocks.unshift({
    id:           null,
    url:          `mock://article-${Date.now()}`,
    title:        `[Mock] ${keywords}`,
    description:  keywords,
    author:       'Mock',
    source:       'Mock News',
    published_at: new Date().toISOString(),
    url_to_image: null,
    content:      null,
    category:     classifyArticle({ title: keywords, description: keywords }),
  });
}

function getMocks() { return [...mocks]; }

module.exports = { addMock, getMocks };
