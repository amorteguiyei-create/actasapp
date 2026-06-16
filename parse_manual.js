const fs = require('fs');

const text = fs.readFileSync('manual_text_corrected.txt', 'utf8');
const lines = text.split('\n').map(l => l.trim());

let currentType = null;
const faults = {
  'TIPO I': [],
  'TIPO II': [],
  'TIPO III': []
};

const numeralRegex = /^(\d+)\.\s+(.*)$/;
let currentNumeral = null;
let currentText = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;

  if (line.includes('DE LAS FALTAS TIPO I')) currentType = null;
  
  if (line.includes('CONSTITUYEN FALTAS   TIPO I:')) {
    currentType = 'TIPO I';
    continue;
  }
  if (line.includes('CONSTITUYEN FALTAS   TIPO II:')) {
    if (currentNumeral && currentType) faults[currentType].push({ num: parseInt(currentNumeral), text: currentText.trim() });
    currentType = 'TIPO II';
    currentNumeral = null;
    currentText = '';
    continue;
  }
  if (line.includes('CONSTITUYEN FALTAS    TIPO III:')) {
    if (currentNumeral && currentType) faults[currentType].push({ num: parseInt(currentNumeral), text: currentText.trim() });
    currentType = 'TIPO III';
    currentNumeral = null;
    currentText = '';
    continue;
  }

  if (currentType) {
    const match = line.match(numeralRegex);
    if (match) {
      if (currentNumeral) {
        faults[currentType].push({ num: parseInt(currentNumeral), text: currentText.trim() });
      }
      currentNumeral = match[1];
      currentText = match[2];
    } else if (currentNumeral) {
      if (!line.startsWith('Manual de Convivencia')) {
        currentText += ' ' + line;
      }
    }
  }
}

if (currentNumeral && currentType) {
  faults[currentType].push({ num: parseInt(currentNumeral), text: currentText.trim() });
}

// Sort just in case
for (const type of ['TIPO I', 'TIPO II', 'TIPO III']) {
  faults[type].sort((a, b) => a.num - b.num);
  
  // Deduplicate and fix continuation lines being picked up accidentally if needed
  // We expect num to be sequential: 1, 2, 3...
  const unique = [];
  let expected = 1;
  for (const item of faults[type]) {
    if (item.num === expected) {
      unique.push(item);
      expected++;
    } else if (item.num === expected - 1) {
      // Dupe or continuation
      unique[unique.length - 1].text += ' ' + item.text;
    }
  }
  faults[type] = unique;
}


console.log("TIPO I count:", faults['TIPO I'].length);
console.log("TIPO II count:", faults['TIPO II'].length);
console.log("TIPO III count:", faults['TIPO III'].length);

let jsContent = `const manualRules = [\n`;
let idCounter = 1;

for (const type of ['TIPO I', 'TIPO II', 'TIPO III']) {
  jsContent += `  // ${type}\n`;
  for (const fault of faults[type]) {
    const cleanText = fault.text.replace(/"/g, '\\"').replace(/\s+/g, ' ');
    jsContent += `  { id: ${idCounter++}, articulo: 'Numeral ${fault.num}', tipo: '${type}', codigo: '${fault.num}', descripcion: "${cleanText}" },\n`;
  }
  jsContent += `\n`;
}

jsContent += `];\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = manualRules;\n}\n`;

fs.writeFileSync('public/js/manual_data.js', jsContent);
console.log("Generated public/js/manual_data.js");
