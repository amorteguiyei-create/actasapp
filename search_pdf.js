const fs = require('fs');
const text = fs.readFileSync('manual_text.txt', 'utf8');

const lines = text.split('\n');
const results = [];

for (let i = 0; i < lines.length; i++) {
  if (/faltas tipo/i.test(lines[i])) {
    results.push(`--- MATCH at line ${i} ---`);
    for (let j = 0; j < 5; j++) {
      if (lines[i+j]) results.push(lines[i+j].trim());
    }
  }
}

fs.writeFileSync('manual_search.txt', results.join('\n'));
console.log('Search complete. Wrote', results.length, 'lines.');
