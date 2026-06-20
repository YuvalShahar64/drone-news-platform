const cron = require('node-cron');
const { fetchAndStoreDroneNews } = require('./newsService');
const { CRON_SCHEDULE } = require('../config');

let task        = null;
let lastFetchAt = null;

function runFetch() {
  return fetchAndStoreDroneNews().then(() => { lastFetchAt = Date.now(); });
}

function startWorker() {
  runFetch();
  task = cron.schedule(CRON_SCHEDULE, runFetch);
  console.log('[cron] Worker started — running now and every 30 minutes');
}

function stopWorker() {
  if (task) {
    task.stop();
    console.log('[cron] Worker stopped');
  }
}

function getLastFetchAt() { return lastFetchAt; }

module.exports = { startWorker, stopWorker, getLastFetchAt, runFetch };
