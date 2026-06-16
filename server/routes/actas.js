const express = require('express');
const router = express.Router();
const { generateActaDocx } = require('../services/docx-generator');
const { syncActaToAppYeye } = require('../services/firebase-sync');
const { db } = require('../db/database');

// Listar todas las actas
router.get('/', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM actas ORDER BY id DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consecutivo
router.get('/consecutivo', async (req, res) => {
  try {
    const result = await db.execute('SELECT MAX(numero_consecutivo) as max_num FROM actas');
    const consecutivo = (result.rows[0].max_num || 0) + 1;
    res.json({ consecutivo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generar PDF/Word
router.get('/:id/docx', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM actas WHERE id = ?',
      args: [req.params.id]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Acta no encontrada' });
    }

    const acta = result.rows[0];
    const buffer = await generateActaDocx(acta);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Acta_${acta.numero_consecutivo}.docx`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Guardar acta
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    const fields = [
      'numero_consecutivo', 'fecha', 'lugar', 'tipo_reunion', 'hora_inicio', 
      'hora_fin', 'estudiante_nombre', 'estudiante_id', 'grado', 'docente', 
      'area', 'participantes', 'agenda', 'desarrollo', 'compromisos', 
      'proxima_reunion', 'tipo_falta', 'tipo_situacion', 'accion_reparadora', 
      'articulos_manual', 'narracion_original'
    ];
    
    const placeholders = fields.map(() => '?').join(', ');
    const args = fields.map(f => data[f] !== undefined ? data[f] : null);
    
    const insertResult = await db.execute({
      sql: `INSERT INTO actas (${fields.join(', ')}) VALUES (${placeholders})`,
      args
    });
    
    const actaId = insertResult.lastInsertRowid;
    
    // Guardar seguimiento si hay estudiante
    if (data.estudiante_id) {
      await db.execute({
        sql: `INSERT INTO seguimiento (estudiante_id, acta_id, fecha, observacion) VALUES (?, ?, ?, ?)`,
        args: [data.estudiante_id, actaId, data.fecha, `Acta ${data.numero_consecutivo}: ${data.tipo_falta}`]
      });
    }
    
    const finalActa = await db.execute({
      sql: 'SELECT * FROM actas WHERE id = ?',
      args: [actaId]
    });
    
    // Intentar sincronizar con App Yeye
    syncActaToAppYeye(finalActa.rows[0]).catch(e => console.error("Sync error:", e));
    
    res.json(finalActa.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
