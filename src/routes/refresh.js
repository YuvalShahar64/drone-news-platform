const { Router }   = require('express');
const { runFetch } = require('../services/cronWorker');

const router = Router();

router.post('/', async (req, res) => {
  await runFetch();
  res.json({ ok: true });
});

module.exports = router;
