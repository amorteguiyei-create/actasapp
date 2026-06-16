const PDFParser = require("pdf2json");
const fs = require('fs');

const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync("manual_text.txt", pdfParser.getRawTextContent());
    console.log("PDF Extracted to manual_text.txt!");
});
pdfParser.loadPDF("Manual de convivencia 2025 SEM (1).pdf");
