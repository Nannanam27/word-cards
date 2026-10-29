// API routes for sets
const express = require('express');
const { pool } = require('../db');
const wrap = require('./wrap');

const router = express.Router();

router.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT d.*, COUNT(c.id)::int AS card_count,
           COALESCE(SUM(CASE WHEN c.known THEN 1 ELSE 0 END),0)::int AS known_count
    FROM decks d LEFT JOIN cards c ON c.deck_id = d.id
    GROUP BY d.id ORDER BY d.id`);
  res.json(rows);
}));

router.post('/', wrap(async (req, res) => {
  const { name, description = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { rows } = await pool.query(
    'INSERT INTO decks (name, description) VALUES ($1,$2) RETURNING *',
    [name.trim(), description]);
  res.status(201).json(rows[0]);
}));

router.put('/:id', wrap(async (req, res) => {
  const { name, description = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const { rows } = await pool.query(
    'UPDATE decks SET name=$1, description=$2 WHERE id=$3 RETURNING *',
    [name.trim(), description, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Deck not found' });
  res.json(rows[0]);
}));

router.delete('/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM decks WHERE id=$1', [req.params.id]);
  res.status(204).end();
}));

module.exports = router;
