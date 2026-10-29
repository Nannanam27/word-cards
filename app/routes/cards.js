// API routes for cards
const express = require('express');
const { pool } = require('../db');
const wrap = require('./wrap');

const router = express.Router();

router.get('/decks/:id/cards', wrap(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE deck_id=$1 ORDER BY id', [req.params.id]);
  res.json(rows);
}));

router.post('/decks/:id/cards', wrap(async (req, res) => {
  const { word, translation, part_of_speech = '', example = '' } = req.body;
  if (!word?.trim() || !translation?.trim())
    return res.status(400).json({ error: 'Word and translation are required' });
  const { rows } = await pool.query(
    `INSERT INTO cards (deck_id, word, translation, part_of_speech, example)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, word.trim(), translation.trim(), part_of_speech, example]);
  res.status(201).json(rows[0]);
}));

router.put('/cards/:id', wrap(async (req, res) => {
  const { word, translation, part_of_speech = '', example = '', known = false } = req.body;
  if (!word?.trim() || !translation?.trim())
    return res.status(400).json({ error: 'Word and translation are required' });
  const { rows } = await pool.query(
    `UPDATE cards SET word=$1, translation=$2, part_of_speech=$3, example=$4, known=$5
     WHERE id=$6 RETURNING *`,
    [word.trim(), translation.trim(), part_of_speech, example, !!known, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Card not found' });
  res.json(rows[0]);
}));

router.delete('/cards/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM cards WHERE id=$1', [req.params.id]);
  res.status(204).end();
}));

module.exports = router;
