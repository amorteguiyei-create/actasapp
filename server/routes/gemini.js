const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { getManualContext } = require('../services/manual-rules');
const { db } = require('../db/database');

router.post('/analyze', async (req, res) => {
  try {
    const { narracion } = req.body;
    
    if (!narracion) {
      return res.status(400).json({ error: 'La narración es requerida' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      return res.status(500).json({ error: 'La API Key de Gemini no está configurada.' });
    }

    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        estudiante_nombre: { type: SchemaType.STRING },
        grado: { type: SchemaType.STRING },
        fecha: { type: SchemaType.STRING },
        hora: { type: SchemaType.STRING },
        lugar: { type: SchemaType.STRING },
        tipo_situacion: { type: SchemaType.STRING },
        tipo_falta: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "2 a 4 opciones específicas de posibles faltas incluyendo el número de numeral (ej. ['Numeral 2 - Falta Grave: Evasión', 'Numeral 1 - Falta Leve: Retraso'])"
        },
        articulos_manual: { type: SchemaType.STRING },
        desarrollo: { type: SchemaType.STRING },
        agenda: { type: SchemaType.STRING },
        compromisos: { type: SchemaType.STRING },
        accion_reparadora: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "2 a 4 opciones de acciones pedagógicas o restaurativas"
        },
        protocolo: { type: SchemaType.STRING },
        sancion_sugerida: { type: SchemaType.STRING },
        participantes: { type: SchemaType.STRING }
      },
      required: ["tipo_situacion", "tipo_falta", "accion_reparadora"]
    };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      generationConfig: { 
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const prompt = `
      ${getManualContext()}
      
      NARRACIÓN DEL DOCENTE:
      "${narracion}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON safely
    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing Gemini response:', responseText);
      return res.status(500).json({ error: 'Error procesando la respuesta de la IA' });
    }

    // Attempt to match student name with DB
    if (parsedData.estudiante_nombre) {
      try {
        const query = `SELECT id, grupo_id FROM estudiantes WHERE nombre LIKE ? LIMIT 1`;
        const matchResult = await db.execute({
          sql: query,
          args: [`%${parsedData.estudiante_nombre}%`]
        });
        
        if (matchResult.rows.length > 0) {
          parsedData.estudiante_id = matchResult.rows[0].id;
          
          if (!parsedData.grado) {
            const grupoResult = await db.execute({
              sql: 'SELECT nombre FROM grupos WHERE id = ?',
              args: [matchResult.rows[0].grupo_id]
            });
            if (grupoResult.rows.length > 0) {
              parsedData.grado = grupoResult.rows[0].nombre;
            }
          }
        }
      } catch (err) {
        console.error('Error buscando estudiante:', err);
      }
    }

    res.json(parsedData);
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Error comunicándose con Google Gemini AI' });
  }
});

module.exports = router;
