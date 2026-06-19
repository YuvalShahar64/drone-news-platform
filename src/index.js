require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/health', require('./routes/health'));
app.use('/api/news',   require('./routes/news'));
app.use('/api/author', require('./routes/author'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  require('./services/cronWorker').startWorker();
});

module.exports = app;
