const fs = require('fs');
let content = fs.readFileSync('public/js/manual_data.js', 'utf8');

// We will use regex to find the descripcion string and truncate it.
// We can parse it by eval() since it's just a JS array.
const match = content.match(/const manualRules = (\[[\s\S]*?\]);/);
if (match) {
  let rules = eval(match[1]);
  
  for (let rule of rules) {
    let text = rule.descripcion;
    // Special cleanups
    text = text.replace(/ Articulo \d+ FALTAS TIPO.*$/, '');
    text = text.replace(/ \d+ Articulo \d+ FALTAS TIPO.*$/, '');
    text = text.replace(/ Corresponden a este tipo las situaciones.*$/, '');
    text = text.replace(/ Parágrafo 1:.*$/, '');
    text = text.replace(/ No imponer correcciones.*$/, '');
    text = text.replace(/ La imposición de los correctivos.*$/, '');
    text = text.replace(/ Los órganos competentes.*$/, '');
    text = text.replace(/ Se tendrán en cuenta las circunstancias.*$/, '');
    text = text.replace(/ Razones o motivos que lo llevan.*$/, '');
    text = text.replace(/ Realizar el reporte en el Sistema.*$/, '');
    text = text.replace(/ Realizar seguimiento por parte del.*$/, '');
    text = text.replace(/ Reunir al Consejo Directivo.*$/, '');
    text = text.replace(/ Procedimiento:.*$/, '');
    text = text.replace(/ \d{2,3}$/, ''); // trailing page numbers like 55, 56, 74
    text = text.replace(/ CIRCUNSTANCIAS ATENUANTES.*/, '');
    text = text.replace(/ CIRCUNSTANCIAS AGRAVANTES.*/, '');
    text = text.replace(/ NOTA ACLARATORIA.*/, '');
    text = text.replace(/ RUTA COLIBRI.*/, '');
    text = text.replace(/ RUTA MARIPOSA.*/, '');
    text = text.replace(/ RUTA HALCÓN.*/, '');
    text = text.replace(/ RUTA ABEJA.*/, '');
    text = text.replace(/ RUTA ALBATROS.*/, '');
    text = text.replace(/ Dialogo entre el Consejero.*/, '');
    text = text.replace(/ Dialogo entre el ciudadano.*/, '');
    text = text.replace(/ Dialogo entre el coordinador.*/, '');
    text = text.replace(/ Brindar atención inmediata.*/, '');
    text = text.replace(/ Llamados de atención.*/, '');
    text = text.replace(/ Prestar servicio comunitario.*/, '');
    text = text.replace(/ Cancelar la matrícula.*/, '');
    text = text.replace(/ Notificación a director.*/, '');
    text = text.replace(/ Establecer acuerdos.*/, '');
    text = text.replace(/ Escuchar al ciudadano.*/, '');
    text = text.replace(/ Informar y citar.*/, '');
    text = text.replace(/ Realización de trabajos.*/, '');
    text = text.replace(/ Asistir los sábados.*/, '');
    text = text.replace(/ Seguimiento por parte del.*/, '');
    text = text.replace(/ Al llegar a tres.*/, '');
    text = text.replace(/ Información a los ciudadanos.*/, '');
    text = text.replace(/ Informar a los ciudadanos.*/, '');
    text = text.replace(/ Citar a los padres.*/, '');
    text = text.replace(/ Poner en conocimiento.*/, '');
    text = text.replace(/ Realización de tareas.*/, '');
    text = text.replace(/ Suspensión del derecho.*/, '');
    text = text.replace(/ Seguimiento a los acuerdos.*/, '');
    text = text.replace(/ Si se incumple.*/, '');
    text = text.replace(/ Determinar con la familia.*/, '');
    text = text.replace(/ Citar a los integrantes.*/, '');
    text = text.replace(/ Desarrollo de cursos.*/, '');
    text = text.replace(/ El Comité Escolar.*/, '');
    text = text.replace(/ Adoptar medidas propias.*/, '');
    text = text.replace(/ El Comité de Convivencia.*/, '');
    text = text.replace(/ Cancelación del cupo.*/, '');
    text = text.replace(/ LAS FALTAS TIPO.*/, '');
    text = text.replace(/ Cambio de grupo.*/, '');
    text = text.replace(/ establecido en el presente manual.*/, '');
    
    // Also cut if we see a stray page number at the end, like ' 56'
    text = text.replace(/ \d{2,3} ?$/, '');

    rule.descripcion = text.trim();
  }

  let jsContent = `const manualRules = [\n`;
  let idCounter = 1;

  for (const type of ['TIPO I', 'TIPO II', 'TIPO III']) {
    jsContent += `  // ${type}\n`;
    for (const rule of rules.filter(r => r.tipo === type)) {
      const cleanText = rule.descripcion.replace(/"/g, '\\"');
      jsContent += `  { id: ${idCounter++}, articulo: '${rule.articulo}', tipo: '${type}', codigo: '${rule.codigo}', descripcion: "${cleanText}" },\n`;
    }
    jsContent += `\n`;
  }

  jsContent += `];\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = manualRules;\n}\n`;

  fs.writeFileSync('public/js/manual_data.js', jsContent);
  console.log('Cleanup complete!');
}
