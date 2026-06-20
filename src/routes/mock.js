const { Router } = require('express');
const { addMock } = require('../services/mockArticles');

const router = Router();

router.post('/', (req, res) => {
  const { keywords } = req.body;
  if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
    return res.status(400).json({ ok: false, message: 'keywords required' });
  }
  addMock(keywords.trim());
  res.json({ ok: true });
});

module.exports = router;
