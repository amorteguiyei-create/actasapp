const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'actas.db');

// Usamos el cliente local de libsql (compatible con SQLite)
const db = createClient({
  url: `file:${dbPath}`,
});

async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS grupos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT,
      nombre TEXT NOT NULL,
      grupo_id INTEGER,
      FOREIGN KEY (grupo_id) REFERENCES grupos(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS actas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_consecutivo INTEGER NOT NULL UNIQUE,
      fecha TEXT NOT NULL,
      lugar TEXT DEFAULT 'Ciudad Educadora Espíritu Santo',
      tipo_reunion TEXT DEFAULT 'Seguimiento Convivencia',
      hora_inicio TEXT,
      hora_fin TEXT,
      estudiante_nombre TEXT,
      estudiante_id INTEGER,
      grado TEXT,
      docente TEXT,
      area TEXT,
      participantes TEXT,
      agenda TEXT,
      desarrollo TEXT,
      compromisos TEXT,
      proxima_reunion TEXT,
      tipo_falta TEXT,
      tipo_situacion TEXT,
      accion_reparadora TEXT,
      articulos_manual TEXT,
      narracion_original TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS seguimiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      acta_id INTEGER,
      fecha TEXT NOT NULL,
      observacion TEXT,
      estado TEXT DEFAULT 'pendiente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
      FOREIGN KEY (acta_id) REFERENCES actas(id)
    )
  `);
}

module.exports = { db, initDB };
