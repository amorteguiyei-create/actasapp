// Inicializar módulos
const recorder = new VoiceRecorder();
const studentSearch = new StudentSearch();

// Elementos DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const btnMic = document.getElementById('btn-mic');
const micIcon = document.getElementById('mic-icon');
const micStatus = document.getElementById('mic-status');
const txtNarracion = document.getElementById('txt-narracion');
const btnAnalizar = document.getElementById('btn-analizar');
const panelResultado = document.getElementById('panel-resultado');
const panelActa = document.getElementById('panel-acta');
const toastContainer = document.getElementById('toast-container');
const loadingOverlay = document.getElementById('loading-overlay');

// Gestión de Tabs
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
    
    if (target === 'tab-historial') loadHistorial();
  });
});

let currentTranscript = '';

// Grabación de Voz
btnMic.addEventListener('click', () => {
  recorder.toggle();
});

recorder.onResult = (text, isInterim) => {
  currentTranscript = text;
  if (isInterim) {
    micStatus.textContent = 'Escuchando...';
  } else {
    micStatus.textContent = 'Audio capturado. Listo para analizar.';
  }
};

recorder.onStateChange = (isRecording) => {
  btnMic.classList.toggle('recording', isRecording);
  micIcon.textContent = isRecording ? 'stop' : 'mic';
  micStatus.textContent = isRecording ? '🔴 Grabando... Presiona para detener' : 'Presiona para grabar';
};

// Análisis con IA (Gemini)
btnAnalizar.addEventListener('click', async () => {
  const narracion = currentTranscript.trim() || txtNarracion.value.trim();
  if (!narracion) {
    showToast('Por favor, narra o escribe la situación primero.', 'warning');
    return;
  }
  
  showLoading(true);
  try {
    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narracion })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al analizar');
    }
    
    const analysis = await response.json();
    displayAnalysis(analysis);
    prefillActaForm(analysis);
    showToast('Análisis completado exitosamente', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
});

function displayAnalysis(data) {
  panelResultado.classList.remove('hidden');
  panelResultado.classList.add('fade-in-up');
  
  const tipoBadge = document.getElementById('resultado-tipo');
  const tipoClass = data.tipo_situacion?.includes('III') ? 'badge-tipo-iii' : 
                    data.tipo_situacion?.includes('II') ? 'badge-tipo-ii' : 'badge-tipo-i';
  tipoBadge.className = 'badge ' + tipoClass;
  tipoBadge.textContent = data.tipo_situacion || 'No clasificado';
  
  setText('resultado-estudiante', data.estudiante_nombre);
  setText('resultado-sancion', data.sancion_sugerida);
  setText('resultado-protocolo', data.protocolo);
  document.getElementById('resultado-articulos').innerHTML = formatText(data.articulos_manual);

  // Helper to render checkboxes for arrays
  const renderCheckboxOptions = (id, name, options, datasetKey) => {
    const container = document.getElementById(id);
    if (!container) return;
    
    if (Array.isArray(options) && options.length > 0) {
      container.innerHTML = options.map((opt, i) => `
        <div style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; font-weight: normal;">
          <input type="checkbox" name="${name}" id="${name}_${i}" value="${opt.replace(/"/g, '&quot;')}" ${i===0?'checked':''}>
          <label for="${name}_${i}" style="cursor:pointer; margin:0; line-height:1.4; color: var(--text-primary); text-transform: none; font-size: 0.95rem;">${opt}</label>
        </div>
      `).join('');
      
      const updateDataset = () => {
        const checked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        // Use a bulleted list format for multiple selections
        panelActa.dataset[datasetKey] = checked.map(item => `- ${item}`).join('\\n');
      };
      
      updateDataset();
      
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', updateDataset);
      });
    } else {
      const text = Array.isArray(options) ? options.join(', ') : (options || 'No especificado');
      container.innerHTML = `<p>${text}</p>`;
      panelActa.dataset[datasetKey] = text;
    }
  };

  renderCheckboxOptions('resultado-falta', 'checkbox_falta', data.tipo_falta, 'tipoFalta');
  renderCheckboxOptions('resultado-acciones', 'checkbox_reparadora', data.accion_reparadora, 'accionReparadora');
  
  panelResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatText(text) {
  if (!text) return 'No especificado';
  return text.split('\\n').map(line => `<p>${line}</p>`).join('');
}

async function prefillActaForm(data) {
  panelActa.classList.remove('hidden');
  panelActa.classList.add('fade-in-up');
  
  try {
    const res = await fetch('/api/actas/consecutivo');
    const { consecutivo } = await res.json();
    document.getElementById('acta-consecutivo').value = consecutivo;
  } catch(e) {}
  
  const today = new Date();
  document.getElementById('acta-fecha').value = data.fecha || today.toISOString().split('T')[0];
  document.getElementById('acta-lugar').value = data.lugar || 'Ciudad Educadora Espíritu Santo';
  document.getElementById('acta-hora-inicio').value = data.hora || today.toTimeString().slice(0,5);
  document.getElementById('acta-tipo-reunion').value = 'Seguimiento Convivencia';
  document.getElementById('acta-estudiante').value = data.estudiante_nombre || '';
  document.getElementById('acta-grado').value = data.grado || '';
  document.getElementById('acta-docente').value = '';
  document.getElementById('acta-area').value = '';
  document.getElementById('acta-participantes').value = data.participantes || '';
  document.getElementById('acta-agenda').value = data.agenda || '';
  document.getElementById('acta-desarrollo').value = data.desarrollo || '';
  document.getElementById('acta-compromisos').value = data.compromisos || '';
  
  panelActa.dataset.tipoSituacion = data.tipo_situacion || '';
  panelActa.dataset.articulosManual = data.articulos_manual || '';
  panelActa.dataset.narracionOriginal = currentTranscript.trim() || txtNarracion.value.trim();
  
  if (data.estudiante_nombre) {
    selectedStudents = [{ nombre: data.estudiante_nombre, grado: data.grado || '', id: data.estudiante_id || null }];
    renderStudentTags();
    updateGrados();
  }
}

// Guardar Acta
document.getElementById('btn-guardar')?.addEventListener('click', async () => {
  const actaData = getActaFormData();
  if (!actaData.desarrollo) {
    showToast('El desarrollo de la reunión es obligatorio', 'warning');
    return;
  }
  
  showLoading(true);
  try {
    const res = await fetch('/api/actas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actaData)
    });
    
    if (!res.ok) throw new Error('Error al guardar el acta');
    const saved = await res.json();
    showToast(`Acta No. ${saved.numero_consecutivo} guardada exitosamente`, 'success');
    
    document.getElementById('acta-consecutivo').value = saved.numero_consecutivo;
    panelActa.dataset.actaId = saved.id;
  } catch(err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
});

// Descargar Word
document.getElementById('btn-descargar')?.addEventListener('click', async () => {
  const actaId = panelActa.dataset.actaId;
  if (actaId) {
    downloadWord(actaId);
    return;
  }
  
  // Guardar primero si no se ha guardado
  const actaData = getActaFormData();
  showLoading(true);
  try {
    const res = await fetch('/api/actas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actaData)
    });
    if (!res.ok) throw new Error('Error al guardar');
    const saved = await res.json();
    panelActa.dataset.actaId = saved.id;
    document.getElementById('acta-consecutivo').value = saved.numero_consecutivo;
    downloadWord(saved.id);
  } catch(err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
});

function downloadWord(actaId) {
  const consecutivo = document.getElementById('acta-consecutivo').value || actaId;
  const url = `/api/actas/${actaId}/docx`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `Acta_${consecutivo}.docx`;
  a.click();
  showToast('Documento Word descargando...', 'success');
}

// Limpiar Formulario
document.getElementById('btn-limpiar')?.addEventListener('click', () => {
  txtNarracion.value = '';
  currentTranscript = '';
  selectedStudents = [];
  renderStudentTags();
  micStatus.textContent = 'Presiona para grabar';
  panelResultado.classList.add('hidden');
  panelActa.classList.add('hidden');
  panelActa.querySelectorAll('input, textarea').forEach(el => {
    if (el.type !== 'button') el.value = '';
  });
  delete panelActa.dataset.actaId;
  showToast('Formulario limpiado', 'info');
});

// Funciones Auxiliares
function getActaFormData() {
  const nombreFinal = selectedStudents.length > 0 ? selectedStudents.map(s => s.nombre).join(', ') : document.getElementById('acta-estudiante').value;
  const idFinal = selectedStudents.length > 0 ? selectedStudents[0].id : null;
  
  return {
    numero_consecutivo: parseInt(document.getElementById('acta-consecutivo').value) || 0,
    fecha: document.getElementById('acta-fecha').value,
    lugar: document.getElementById('acta-lugar').value,
    tipo_reunion: document.getElementById('acta-tipo-reunion').value,
    hora_inicio: document.getElementById('acta-hora-inicio').value,
    hora_fin: document.getElementById('acta-hora-fin').value,
    estudiante_nombre: nombreFinal,
    estudiante_id: idFinal,
    grado: document.getElementById('acta-grado').value,
    docente: document.getElementById('acta-docente').value,
    area: document.getElementById('acta-area').value,
    participantes: document.getElementById('acta-participantes').value,
    agenda: document.getElementById('acta-agenda').value,
    desarrollo: document.getElementById('acta-desarrollo').value,
    compromisos: document.getElementById('acta-compromisos').value,
    proxima_reunion: document.getElementById('acta-proxima').value,
    tipo_falta: panelActa.dataset.tipoFalta,
    tipo_situacion: panelActa.dataset.tipoSituacion,
    accion_reparadora: panelActa.dataset.accionReparadora,
    articulos_manual: panelActa.dataset.articulosManual,
    narracion_original: panelActa.dataset.narracionOriginal
  };
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || 'No especificado';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  toast.innerHTML = `<span class="material-icons-round">${icons[type]}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showLoading(show) {
  loadingOverlay.classList.toggle('hidden', !show);
}

// Cargar Historial
async function loadHistorial() {
  try {
    const res = await fetch('/api/actas');
    const actas = await res.json();
    const tbody = document.getElementById('historial-tbody');
    if (!actas.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay actas registradas</td></tr>';
      return;
    }
    
    tbody.innerHTML = actas.map(acta => {
      const tipoClass = acta.tipo_situacion?.includes('III') ? 'badge-tipo-iii' : 
                        acta.tipo_situacion?.includes('II') ? 'badge-tipo-ii' : 'badge-tipo-i';
      return `
        <tr>
          <td><strong>${acta.numero_consecutivo}</strong></td>
          <td>${acta.fecha || ''}</td>
          <td>${acta.estudiante_nombre || ''}</td>
          <td>${acta.grado || ''}</td>
          <td><span class="badge ${tipoClass}">${acta.tipo_falta || ''}</span></td>
          <td><span class="badge ${tipoClass}">${acta.tipo_situacion || ''}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="downloadWord(${acta.id})">Word</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch(err) {
    console.error('Error cargando historial:', err);
  }
}

// Autocompletado de Estudiantes en Formulario
const actaEstudianteInput = document.getElementById('acta-estudiante');
let selectedStudents = [];

function renderStudentTags() {
  const container = document.getElementById('estudiantes-tags');
  if (!container) return;
  container.innerHTML = selectedStudents.map((s, i) => `
    <span class="student-tag">
      ${s.nombre} <span class="material-icons-round remove-tag" data-index="${i}">close</span>
    </span>
  `).join('');
  
  container.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.dataset.index;
      selectedStudents.splice(idx, 1);
      renderStudentTags();
      updateGrados();
    });
  });
}

function updateGrados() {
  const grados = [...new Set(selectedStudents.map(s => s.grado).filter(Boolean))].join(', ');
  document.getElementById('acta-grado').value = grados;
}

if (actaEstudianteInput) {
  const autocompleteList = document.createElement('div');
  autocompleteList.className = 'autocomplete-list hidden';
  actaEstudianteInput.parentElement.style.position = 'relative';
  actaEstudianteInput.parentElement.appendChild(autocompleteList);
  
  actaEstudianteInput.addEventListener('input', (e) => {
    studentSearch.debounceSearch(e.target.value, (results) => {
      if (!results.length) {
        autocompleteList.classList.add('hidden');
        return;
      }
      autocompleteList.classList.remove('hidden');
      autocompleteList.innerHTML = results.slice(0, 6).map(s => `
        <div class="autocomplete-item" data-id="${s.id}" data-nombre="${s.nombre}" data-grupo="${s.grupo_nombre}">
          <strong>${s.nombre}</strong> <small>${s.grupo_nombre || ''}</small>
        </div>
      `).join('');
      
      autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          // Add to selected array
          selectedStudents.push({ 
            id: item.dataset.id, 
            nombre: item.dataset.nombre, 
            grado: item.dataset.grupo 
          });
          renderStudentTags();
          updateGrados();
          
          actaEstudianteInput.value = '';
          autocompleteList.classList.add('hidden');
        });
      });
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!actaEstudianteInput.contains(e.target) && !autocompleteList.contains(e.target)) {
      autocompleteList.classList.add('hidden');
    }
  });
}

// Lógica del Buscador Tradicional (Manual de Convivencia)
const manualSearchInput = document.getElementById('manual-search-input');
const manualFilterTipo = document.getElementById('manual-filter-tipo');
const manualFilterCodigo = document.getElementById('manual-filter-codigo');
const manualResultsContainer = document.getElementById('manual-results-container');
const manualCountShown = document.getElementById('manual-count-shown');
const manualResultsCount = document.getElementById('manual-results-count');

function renderManualRules() {
  if (!manualSearchInput) return;
  const q = manualSearchInput.value.toLowerCase();
  const t = manualFilterTipo.value;
  const c = manualFilterCodigo.value.toLowerCase();
  
  const filtered = manualRules.filter(rule => {
    const matchQ = rule.descripcion.toLowerCase().includes(q) || rule.articulo.toLowerCase().includes(q);
    const matchT = t === 'Todos los tipos' || rule.tipo === t;
    const matchC = !c || rule.codigo.includes(c);
    return matchQ && matchT && matchC;
  });
  
  manualCountShown.textContent = filtered.length;
  manualResultsCount.textContent = filtered.length;
  
  if (filtered.length === 0) {
    manualResultsContainer.innerHTML = '<p class="text-muted mt-4">No se encontraron resultados para tu búsqueda.</p>';
    return;
  }
  
  manualResultsContainer.innerHTML = filtered.map(rule => {
    const cssClass = rule.tipo === 'TIPO I' ? 'tipo-i' : rule.tipo === 'TIPO II' ? 'tipo-ii' : 'tipo-iii';
    return `
      <div class="rule-card-title">Faltas ${rule.tipo}</div>
      <div class="rule-card">
        <div class="rule-card-header ${cssClass}">
          <span>${rule.articulo}</span>
          <span>${rule.tipo}</span>
          <span>Código: ${rule.codigo}</span>
        </div>
        <div class="rule-card-body">
          ${rule.descripcion}
        </div>
        <div class="rule-card-footer">
          <button class="btn-copy" onclick="copyToClipboard('${rule.descripcion.replace(/'/g, "\\'")}')">
            <span class="material-icons-round">content_copy</span> Copiar referencia
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Referencia copiada al portapapeles', 'success');
  }).catch(() => {
    showToast('No se pudo copiar', 'error');
  });
}

if (manualSearchInput) {
  manualSearchInput.addEventListener('input', renderManualRules);
  manualFilterTipo.addEventListener('change', renderManualRules);
  manualFilterCodigo.addEventListener('input', renderManualRules);
  // Inicializar
  setTimeout(renderManualRules, 100);
}
