const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('Manual de convivencia 2025 SEM (1).pdf');

pdf(dataBuffer).then(function(data) {
  fs.writeFileSync('manual_text.txt', data.text);
  console.log('PDF text extracted to manual_text.txt');
}).catch(console.error);
