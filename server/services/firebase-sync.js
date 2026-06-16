const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let isInitialized = false;
let db = null;

try {
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
    db = getFirestore();
    isInitialized = true;
    console.log("🔥 Firebase Admin conectado correctamente con App Yeye.");
  } else {
    console.log("⚠️ Archivo firebase-key.json no encontrado. La sincronización automática está deshabilitada.");
  }
} catch (error) {
  console.error("Error al inicializar Firebase Admin:", error);
}

async function syncActaToAppYeye(acta) {
  if (!isInitialized) {
    console.log("No se sincroniza porque Firebase Admin no está inicializado.");
    return false;
  }
  
  const estudianteId = acta.estudiante_id;
  if (!estudianteId) {
    console.log("No se pudo sincronizar: El acta no tiene un ID de estudiante asociado.");
    return false;
  }

  try {
    const desc = `[ACTA ${acta.numero_consecutivo}] Falta reportada: ${acta.tipo_situacion || 'No especificado'}\\nMotivo: ${acta.tipo_falta || 'No especificado'}`;
    
    const record = {
      tipo: "Falta",
      fecha: acta.fecha || new Date().toISOString().split('T')[0],
      descripcion: desc,
      timestamp: FieldValue.serverTimestamp(),
      estado: "Pendiente",
      acta_origen: acta.numero_consecutivo,
      detalles: {
        acciones_reparadoras: acta.accion_reparadora,
        narracion: acta.narracion_original
      }
    };

    const historyRef = db.collection('ciudadano').doc(String(estudianteId)).collection('historial').doc();
    
    await historyRef.set(record);
    console.log(`✅ Falta sincronizada exitosamente para el estudiante ${estudianteId} (Pendiente de aprobación)`);
    return true;
  } catch (error) {
    console.error("Error sincronizando acta con App Yeye:", error);
    return false;
  }
}

module.exports = { syncActaToAppYeye, isInitialized };
