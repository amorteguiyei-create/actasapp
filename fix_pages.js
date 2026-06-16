const fs = require('fs');

const text = fs.readFileSync('manual_text.txt', 'utf8');
const pages = text.split(/----------------Page \(\d+\) Break----------------/);

let allCorrectLines = [];

for (const page of pages) {
  // Split page into lines
  let lines = page.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Is this page reversed? Let's check the numbers.
  let numMatchCount = 0;
  let reversedCount = 0;
  
  let lastNum = null;
  for (const line of lines) {
    const match = line.match(/^(\d+)\./);
    if (match) {
      const num = parseInt(match[1]);
      if (lastNum !== null) {
        if (num < lastNum) reversedCount++;
      }
      lastNum = num;
      numMatchCount++;
    }
  }
  
  // If we have numbers and they mostly go down, reverse the page!
  if (numMatchCount > 2 && reversedCount > numMatchCount / 2) {
    lines = lines.reverse();
  }
  
  allCorrectLines.push(...lines);
}

fs.writeFileSync('manual_text_corrected.txt', allCorrectLines.join('\n'));
console.log("Corrected text written to manual_text_corrected.txt");
