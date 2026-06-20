require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', require('./middleware/rateLimit'));
app.use('/api/health', require('./routes/health'));
app.use('/api/news',   require('./routes/news'));
app.use('/api/author', require('./routes/author'));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  require('./services/cronWorker').startWorker();
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received — shutting down gracefully`);

  require('./services/cronWorker').stopWorker();

  server.close(() => {
    console.log('[shutdown] HTTP server closed');
    require('./services/db').closeDb();
    process.exit(0);
  });
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
