const express = require('express');
const path = require('path');
const { pool, waitForDb } = require('./db');
const wrap = require('./routes/wrap');
const deckRoutes = require('./routes/decks');
const cardRoutes = require('./routes/cards');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));

app.get('/api/health', wrap(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.use('/api/decks', deckRoutes);
app.use('/api', cardRoutes);

const PORT = process.env.PORT || 3000;
let server;
waitForDb()
  .then(() => { server = app.listen(PORT, () => console.log(`Word Cards running on port ${PORT}`)); })
  .catch((err) => { console.error(err); process.exit(1); });

// On SIGTERM close the server and the database, then exit
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  const done = () => pool.end().then(() => process.exit(0));
  server ? server.close(done) : done();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
