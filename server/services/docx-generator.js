const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, WidthType, BorderStyle, AlignmentType, HeadingLevel, Header, Footer } = require('docx');
const fs = require('fs');
const path = require('path');

async function generateActaDocx(acta) {
  const assetsDir = path.join(__dirname, '..', '..', 'public', 'assets');
  let logo1, logo2, logo3;
  
  try { logo1 = fs.readFileSync(path.join(assetsDir, 'image1.png')); } catch (e) { console.error('Falta image1.png'); }
  try { logo2 = fs.readFileSync(path.join(assetsDir, 'image2.png')); } catch (e) { console.error('Falta image2.png'); }
  try { logo3 = fs.readFileSync(path.join(assetsDir, 'image3.png')); } catch (e) { console.error('Falta image3.png'); }

  const makeCell = (text, width, options = {}) => {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: options.bold, size: 20, font: "Arial" })],
          alignment: options.align || AlignmentType.LEFT
        })
      ],
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  };

  const doc = new Document({
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [
            new Table({
              width: { size: 9000, type: WidthType.DXA },
              columnWidths: [1800, 5400, 1800],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: logo1 ? [new ImageRun({ data: logo1, transformation: { width: 100, height: 100 } })] : [],
                          alignment: AlignmentType.CENTER
                        })
                      ]
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "PLANEACIÓN, DIRECCIÓN Y CONTROL DE LA ESTRATEGIA", bold: true, font: "Arial", size: 18 })], alignment: AlignmentType.CENTER }),
                        new Paragraph({ children: [new TextRun({ text: "ACTA DE REUNIÓN", bold: true, font: "Arial", size: 24 })], alignment: AlignmentType.CENTER })
                      ]
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "CÓDIGO: DE-F-001", size: 16, font: "Arial" })] }),
                        new Paragraph({ children: [new TextRun({ text: "VERSIÓN: 02", size: 16, font: "Arial" })] }),
                        new Paragraph({ children: [new TextRun({ text: `FECHA: ${acta.fecha || ''}`, size: 16, font: "Arial" })] })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: logo3 ? [new ImageRun({ data: logo3, transformation: { width: 500, height: 70 } })] : [],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children: [
        new Paragraph({ text: "", spacing: { after: 200 } }),
        
        // Tabla Info Reunión
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [2250, 2250, 3150, 1350],
          rows: [
            new TableRow({
              children: [
                makeCell(`Fecha: ${acta.fecha || ''}`, 25, { bold: true }),
                makeCell(`Lugar: ${acta.lugar || ''}`, 25, { bold: true }),
                makeCell(`Tipo de Reunión: ${acta.tipo_reunion || ''}`, 35, { bold: true }),
                makeCell(`Acta No: ${acta.numero_consecutivo || ''}`, 15, { bold: true })
              ]
            }),
            new TableRow({
              children: [
                makeCell(`Hora Inicio: ${acta.hora_inicio || ''}`, 25, { bold: true }),
                makeCell(`Hora Finalización: ${acta.hora_fin || ''}`, 25, { bold: true }),
                makeCell("", 35),
                makeCell("", 15)
              ]
            })
          ]
        }),
        
        new Paragraph({ text: "", spacing: { after: 200 } }),

        // Tabla Info Estudiante
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [3600, 1350, 2250, 1800],
          rows: [
            new TableRow({
              children: [
                makeCell(`ESTUDIANTE: ${acta.estudiante_nombre || ''}`, 40, { bold: true }),
                makeCell(`GRADO: ${acta.grado || ''}`, 15, { bold: true }),
                makeCell(`DOCENTE: ${acta.docente || ''}`, 25, { bold: true }),
                makeCell(`ÁREA: ${acta.area || ''}`, 20, { bold: true })
              ]
            })
          ]
        }),

        new Paragraph({ text: "", spacing: { after: 200 } }),

        new Paragraph({ children: [new TextRun({ text: "PARTICIPANTES:", bold: true, font: "Arial", size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: acta.participantes || '', font: "Arial", size: 20 })], spacing: { after: 200 } }),

        new Paragraph({ children: [new TextRun({ text: "AGENDA", bold: true, font: "Arial", size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: acta.agenda || '', font: "Arial", size: 20 })], spacing: { after: 200 } }),

        new Paragraph({ children: [new TextRun({ text: "DESARROLLO DE LA REUNIÓN", bold: true, font: "Arial", size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: acta.desarrollo || '', font: "Arial", size: 20 })], spacing: { after: 200 } }),

        new Paragraph({ children: [new TextRun({ text: "COMPROMISOS", bold: true, font: "Arial", size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: acta.compromisos || '', font: "Arial", size: 20 })], spacing: { after: 200 } }),

        new Paragraph({ children: [new TextRun({ text: "Próxima Reunión:", bold: true, font: "Arial", size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: acta.proxima_reunion || 'N/A', font: "Arial", size: 20 })], spacing: { after: 400 } }),

        new Paragraph({ children: [new TextRun({ text: "Firmas (Si aplica)", bold: true, font: "Arial", size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: "Favor firmar encima de la línea continua y escribir el nombre sobre la línea punteada.", font: "Arial", size: 16 })], spacing: { after: 400 } }),
        
        // Firmas
        new Paragraph({ text: "_________________________       _________________________       _________________________" }),
        new Paragraph({ text: ".........................       .........................       ........................." }),
        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Paragraph({ text: "_________________________       _________________________       _________________________" }),
        new Paragraph({ text: ".........................       .........................       ........................." })
      ]
    }]
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateActaDocx };
