const { db } = require('../db/database');
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
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 }); // Lee como array de arrays

    let currentGroup = null;
    let currentGroupId = null;
    let studentsCount = 0;
    let groupsCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Buscar encabezados de grupo, ej. ['INFANTS A', 'Código', 'Ciudadano']
      if (row[1] === 'Código' && row[2] === 'Ciudadano') {
        const groupName = String(row[0] || '').trim();
        if (groupName && groupName !== '#') {
          currentGroup = groupName;
          
          // Insertar grupo
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

      // Buscar estudiantes: la primera columna debe ser un número (índice), la segunda el código, la tercera el nombre
      const idStr = String(row[0] || '').trim();
      const codigo = String(row[1] || '').trim();
      const nombre = String(row[2] || '').trim();

      // Si tenemos un grupo actual, un código numérico y un nombre
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
