const xlsx = require('xlsx');
try {
  const wb = xlsx.readFile('Listado ciudadanos CEES 2026 II.xlsx');
  console.log("Sheet names:", wb.SheetNames);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws);
    console.log(`Sheet: ${sheetName}, rows: ${data.length}, first row:`, data[0]);
  }
} catch (err) {
  console.error("Error:", err);
}
