require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDB } = require('./db/database');
const actasRoutes = require('./routes/actas');
const estudiantesRoutes = require('./routes/estudiantes');
const geminiRoutes = require('./routes/gemini');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Inicializar DB (async en libsql)
initDB().then(() => {
  console.log('Base de datos inicializada correctamente');
}).catch(err => {
  console.error('Error inicializando base de datos:', err);
});

// Rutas API
app.use('/api/actas', actasRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/gemini', geminiRoutes);

// Error Handler global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Ha ocurrido un error en el servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor Actas App corriendo en puerto ${PORT}`);
});
