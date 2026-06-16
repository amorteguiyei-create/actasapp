const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

router.get('/search', async (req, res) => {
  try {
    const term = req.query.q || '';
    if (term.length < 2) return res.json([]);
    
    const result = await db.execute({
      sql: `
        SELECT e.*, g.nombre as grupo_nombre 
        FROM estudiantes e 
        LEFT JOIN grupos g ON e.grupo_id = g.id 
        WHERE e.nombre LIKE ? OR e.codigo LIKE ?
        LIMIT 20
      `,
      args: [`%${term}%`, `%${term}%`]
    });
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT e.*, g.nombre as grupo_nombre 
        FROM estudiantes e 
        LEFT JOIN grupos g ON e.grupo_id = g.id 
        WHERE e.id = ?
      `,
      args: [req.params.id]
    });
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/actas', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM actas WHERE estudiante_id = ? ORDER BY id DESC',
      args: [req.params.id]
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/seguimiento', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM seguimiento WHERE estudiante_id = ? ORDER BY id DESC',
      args: [req.params.id]
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
