const { db } = require('./database');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function seed() {
  console.log('Iniciando proceso de seeding con la nueva base de datos de estudiantes...');

  try {
    // 1. Limpiar base de datos
    console.log('Limpiando tablas de estudiantes y grupos...');
    await db.execute('DELETE FROM estudiantes');
    await db.execute('DELETE FROM grupos');
    
    // Resetear secuencias si es SQLite
    try {
      await db.execute("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'estudiantes'");
      await db.execute("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'grupos'");
    } catch(e) {
      // Ignorar si no existe sqlite_sequence
    }

    // 2. Leer archivo Excel
    const filePath = path.join(__dirname, '../../Listado ciudadanos CEES 2026 II.xlsx');
    console.log('Leyendo archivo:', filePath);
    
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

    let currentGroup = null;
    let currentGroupId = null;
    let studentsCount = 0;
    let groupsCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      if (row.length === 1 && typeof row[0] === 'string') {
        const nextRow = data[i + 1] || [];
        if (nextRow[1] === 'Código' && nextRow[2] === 'Ciudadano') {
          currentGroup = row[0].trim();
          const res = await db.execute({
            sql: 'INSERT INTO grupos (nombre) VALUES (?) RETURNING id',
            args: [currentGroup]
          });
          currentGroupId = res.rows[0].id;
          groupsCount++;
          console.log(`Encontrado grupo: ${currentGroup}`);
        }
        continue;
      }

      const idStr = String(row[0] || '').trim();
      const codigo = String(row[1] || '').trim();
      const nombre = String(row[2] || '').trim();

      if (currentGroupId && /^\d+$/.test(idStr) && codigo && nombre && nombre !== 'Ciudadano') {
        await db.execute({
          sql: 'INSERT INTO estudiantes (nombre, codigo, grupo_id) VALUES (?, ?, ?)',
          args: [nombre, codigo, currentGroupId]
        });
        studentsCount++;
      }
    }

    console.log('\n=====================================');
    console.log('¡Seeding completado con éxito!');
    console.log(`Grupos insertados: ${groupsCount}`);
    console.log(`Estudiantes insertados: ${studentsCount}`);
    console.log('=====================================\n');

  } catch (error) {
    console.error('Error durante el seeding:', error);
  }
}

seed();
