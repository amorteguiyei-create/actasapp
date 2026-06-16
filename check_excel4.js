const xlsx = require('xlsx');
try {
  const wb = xlsx.readFile('Listado ciudadanos CEES 2026 II.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log(data.slice(0, 15));
} catch (err) {
  console.error("Error:", err);
}
