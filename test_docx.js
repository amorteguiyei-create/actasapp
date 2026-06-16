const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Table({
        width: { size: 10000, type: WidthType.DXA },
        columnWidths: [2000, 8000],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Col 1")]
              }),
              new TableCell({
                children: [new Paragraph("Col 2")]
              })
            ]
          })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('test3.docx', buffer);
  console.log('Saved test3.docx');
});
