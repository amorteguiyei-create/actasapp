const fs = require('fs');
const text = fs.readFileSync('manual_text.txt', 'utf8');
const lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (/CONSTITUYEN/i.test(lines[i]) && /FALTAS/i.test(lines[i])) {
    console.log(`Line ${i}: '${lines[i].trim()}'`);
  }
}
