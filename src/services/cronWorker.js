const cron = require('node-cron');
const { fetchAndStoreDroneNews } = require('./newsService');

function startWorker() {
  fetchAndStoreDroneNews();
  cron.schedule('*/30 * * * *', fetchAndStoreDroneNews);
  console.log('[cron] Worker started — running now and every 30 minutes');
}

module.exports = { startWorker };
