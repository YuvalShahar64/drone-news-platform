const cron = require('node-cron');
const { fetchAndStoreDroneNews } = require('./newsService');

let task = null;

function startWorker() {
  fetchAndStoreDroneNews();
  task = cron.schedule('*/30 * * * *', fetchAndStoreDroneNews);
  console.log('[cron] Worker started — running now and every 30 minutes');
}

function stopWorker() {
  if (task) {
    task.stop();
    console.log('[cron] Worker stopped');
  }
}

module.exports = { startWorker, stopWorker };
