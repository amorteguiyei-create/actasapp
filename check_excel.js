const xlsx = require('xlsx');
try {
  const wb = xlsx.readFile('Listado ciudadanos CEES 2026 II.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch (err) {
  console.error("Error:", err);
}
