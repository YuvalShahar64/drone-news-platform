const { getAuthorInfo }    = require('../services/wikiService');
const { scrapeAuthorLink } = require('../services/articleScraper');

async function getAuthor(req, res) {
  const { name } = req.params;
  const { articleUrl } = req.query;

  if (articleUrl) {
    try {
      const link = await scrapeAuthorLink(decodeURIComponent(articleUrl));
      if (link) return res.json({ ok: true, type: 'link', authorUrl: link });
    } catch {}
  }

  const wiki = await getAuthorInfo(name);
  if (wiki.ok) return res.json({ ...wiki, type: 'wiki' });

  return res.json({ ok: false, message: 'Author information not available.' });
}

module.exports = { getAuthor };
