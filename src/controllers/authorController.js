const { getAuthorInfo } = require('../services/wikiService');

async function getAuthor(req, res) {
  const result = await getAuthorInfo(req.params.name);
  res.json(result);
}

module.exports = { getAuthor };
