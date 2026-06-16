const xlsx = require('xlsx');
try {
  const wb = xlsx.readFile('Listado ciudadanos CEES 2026 II.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);
  
  let currentGroup = Object.keys(data[0])[0]; // e.g. "INFANTS A"
  console.log("Initial group:", currentGroup);
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // Check if this row is a header for a new group
    // The previous row might be empty or this row might have keys that are different
    if (row['__EMPTY'] === 'Código' || Object.values(row).includes('Código')) {
      const groupName = Object.keys(row).find(k => !k.startsWith('__EMPTY'));
      if (groupName && groupName !== currentGroup) {
        currentGroup = groupName;
        console.log("Found new group:", currentGroup);
      }
    } else if (typeof row['__EMPTY'] === 'number') {
      // It's a student
      // console.log(currentGroup, row['__EMPTY_1']);
    }
  }
} catch (err) {
  console.error("Error:", err);
}
