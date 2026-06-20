const { Router }       = require('express');
const { getLastFetchAt } = require('../services/cronWorker');

const router = Router();

router.get('/', (req, res) => {
  const now = Date.now();
  // Next fire of */30 * * * *: the next :00 or :30 of the current hour
  const d = new Date(now);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  res.json({ ok: true, lastFetchAt: getLastFetchAt(), nextFetchAt: d.getTime() });
});

module.exports = router;
