// js/horario-admin.js - Versión corregida y estable

const horariosFijos = [
  { clave: "1300", inicio: "1:00", fin: "2:30" },
  { clave: "1430", inicio: "2:30", fin: "4:00" },
  { clave: "1600", inicio: "4:00", fin: "5:30" },
  { clave: "1730", inicio: "5:30", fin: "7:00" },
  { clave: "1900", inicio: "7:00", fin: "8:30" },
  { clave: "2030", inicio: "8:30", fin: "9:30" }
];

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const diasLower = dias.map(d => d.toLowerCase().replace('é', 'e'));

let eventoActual = null;
let pestañaActiva = 'chambelanes';

// ────────────────────────────────────────────────
// Cargar todo al iniciar
// ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await cargarListaChambelanes();
  cargarGridChambelanes();
  cargarGridClases();

  // Escuchar cambio de pestaña
  document.querySelectorAll('#adminTabs .nav-link').forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
      pestañaActiva = e.target.id.split('-')[0];
      ajustarModalSegunPestana();
    });
  });
});

// ────────────────────────────────────────────────
// Cargar lista de chambelanes (select)
// ────────────────────────────────────────────────
async function cargarListaChambelanes() {
  const select = document.getElementById('modalChambelan');
  if (!select) return;

  select.innerHTML = '<option value="">-- Sin asignar --</option>';

  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('email, nombre')
    .eq('rol', 'chambelan')
    .order('nombre');

  if (error) {
    console.error('Error cargando chambelanes:', error);
    return;
  }

  data.forEach(c => {
    const option = document.createElement('option');
    option.value = c.email;
    option.textContent = c.nombre || c.email;
    select.appendChild(option);
  });
}

// ────────────────────────────────────────────────
// Grid de Chambelanes (ya funciona)
// ────────────────────────────────────────────────
async function cargarGridChambelanes() {
  const container = document.getElementById('grid-chambelanes');
  if (!container) return;

  container.innerHTML = '';

  const { data: eventos, error } = await supabaseClient
    .from('horarios')
    .select('id, dia, hora_inicio, quinceanera, sede, notas, chambelan_email');

  if (error) {
    container.innerHTML = '<p class="text-danger text-center">Error al cargar eventos privados</p>';
    return;
  }

  let html = `<div class="celda"></div>`;
  dias.forEach(d => html += `<div class="dia">${d}</div>`);

  horariosFijos.forEach(h => {
    html += `<div class="hora">${h.inicio} - ${h.fin}</div>`;

    diasLower.forEach((diaLower, idx) => {
      const dia = dias[idx];
      const idCelda = `${diaLower}_${h.clave}`;

      const ev = eventos.find(e => 
        e.dia.toLowerCase().replace('é','e') === diaLower &&
        e.hora_inicio === h.inicio
      );

      let contenido = ev ? `
        <strong>${ev.quinceanera}</strong><br>
        <small>${ev.sede || ''}</small><br>
        <small>${ev.notas || ''}</small><br>
        <small class="text-muted">${ev.chambelan_email || 'Sin chambelán'}</small>
      ` : '';

      html += `
        <div class="celda ${ev ? 'has-event' : ''}" 
             id="${idCelda}"
             onclick="editarEvento('${ev ? ev.id : null}', 'horarios')">
          ${contenido}
        </div>`;
    });
  });

  container.innerHTML = `<div class="horario">${html}</div>`;
}

// ────────────────────────────────────────────────
// Grid de Clases Públicas (CORREGIDO)
// ────────────────────────────────────────────────
async function cargarGridClases() {
  const container = document.getElementById('grid-clases');
  if (!container) return;

  container.innerHTML = '<p class="text-center text-muted">Cargando clases...</p>';

  try {
    const { data: clases, error } = await supabaseClient
      .from('clases_publicas')
      .select('id, dia, hora_inicio, nombre_clase, sede, notas');

    if (error) throw error;

    let html = `<div class="celda"></div>`;
    dias.forEach(d => html += `<div class="dia">${d}</div>`);

    horariosFijos.forEach(h => {
      html += `<div class="hora">${h.inicio} - ${h.fin}</div>`;

      diasLower.forEach((diaLower, idx) => {
        const dia = dias[idx];
        const idCelda = `${diaLower}_${h.clave}`;

        const cl = clases.find(c => 
          c.dia.toLowerCase().replace('é','e') === diaLower &&
          c.hora_inicio === h.inicio
        );

        let contenido = cl ? `
          <strong>${cl.nombre_clase}</strong><br>
          <small>${cl.sede || ''}</small><br>
          <small>${cl.notas || ''}</small>
        ` : '';

        // Al hacer clic, forzamos pestaña activa = 'clases' y llamamos editarEvento
        html += `
          <div class="celda ${cl ? 'has-event' : ''}" 
               id="${idCelda}"
               onclick="pestañaActiva = 'clases'; editarEvento('${cl ? cl.id : null}', 'clases_publicas')">
            ${contenido}
          </div>`;
      });
    });

    container.innerHTML = `<div class="horario">${html}</div>`;
  } catch (err) {
    console.error('Error cargando clases públicas:', err);
    container.innerHTML = '<p class="text-danger text-center">Error al cargar las clases públicas</p>';
  }
}

// ────────────────────────────────────────────────
// Modal (Nuevo / Editar)
// ────────────────────────────────────────────────
function abrirModalNuevo() {
  eventoActual = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Evento';

  // Limpiar TODO
  limpiarModal();

  // Usar la pestaña que está activa en ese momento
  ajustarModalSegunPestana();

  const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
  modal.show();
}

async function editarEvento(id, tabla) {
  // Forzamos la pestaña correcta según la tabla
  if (tabla === 'clases_publicas') {
    pestañaActiva = 'clases';
    // Activamos la pestaña clases si no está activa
    const clasesTab = document.getElementById('clases-tab');
    if (clasesTab) {
      const bsTab = new bootstrap.Tab(clasesTab);
      bsTab.show();
    }
  } else {
    pestañaActiva = 'chambelanes';
    const chambelanesTab = document.getElementById('chambelanes-tab');
    if (chambelanesTab) {
      const bsTab = new bootstrap.Tab(chambelanesTab);
      bsTab.show();
    }
  }

  // Esperamos un pequeño delay para que la pestaña se active (Bootstrap necesita tiempo)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Si no hay ID → nuevo
  if (!id || id === 'null' || id === null) {
    return abrirModalNuevo();
  }

  eventoActual = id;

  const tableName = tabla === 'horarios' ? 'horarios' : 'clases_publicas';

  const { data, error } = await supabaseClient
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error al cargar evento:', error);
    alert('No se pudo cargar el evento');
    return;
  }

  // Campos comunes
  document.getElementById('modalDia').value = data.dia || 'Lunes';
  document.getElementById('modalHora').value = data.hora_inicio || '1:00';
  document.getElementById('modalSede').value = data.sede || '';
  document.getElementById('modalNotas').value = data.notas || '';

  // Campos específicos
  if (tabla === 'horarios') {
    document.getElementById('modalQuinceanera').value = data.quinceanera || '';
    document.getElementById('modalChambelan').value = data.chambelan_email || '';
  } else {
    document.getElementById('modalNombreClase').value = data.nombre_clase || '';
  }

  document.getElementById('modalTitle').textContent = 'Editar Evento';
  ajustarModalSegunPestana();

  // Forzamos que el modal se muestre después del cambio de pestaña
  const modal = new bootstrap.Modal(document.getElementById('eventoModal'), {
    backdrop: 'static',  // Evita cerrar al clic fuera
    keyboard: true
  });
  modal.show();
}

function ajustarModalSegunPestana() {
  const esChambelanes = pestañaActiva === 'chambelanes';
  
  // Ocultar/mostrar grupos
  document.getElementById('grupoChambelanes').classList.toggle('d-none', !esChambelanes);
  document.getElementById('grupoChambelanes2').classList.toggle('d-none', !esChambelanes);
  document.getElementById('grupoClases').classList.toggle('d-none', esChambelanes);

  // Opcional: limpiar campos que no se usan para evitar datos residuales
  if (!esChambelanes) {
    document.getElementById('modalQuinceanera').value = '';
    document.getElementById('modalChambelan').value = '';
  } else {
    document.getElementById('modalNombreClase').value = '';
  }
}

function limpiarModal() {
  document.getElementById('modalDia').value = 'Lunes';
  document.getElementById('modalHora').value = '1:00';
  document.getElementById('modalQuinceanera').value = '';
  document.getElementById('modalNombreClase').value = '';
  document.getElementById('modalSede').value = '';
  document.getElementById('modalNotas').value = '';
  document.getElementById('modalChambelan').value = '';
}

// ────────────────────────────────────────────────
// Guardar (crear o actualizar)
// ────────────────────────────────────────────────
async function guardarEvento() {
  const dia = document.getElementById('modalDia').value;
  const hora_inicio = document.getElementById('modalHora').value;
  const sede = document.getElementById('modalSede').value.trim() || null;
  const notas = document.getElementById('modalNotas').value.trim() || null;

  let datos = { dia, hora_inicio, sede, notas };
  let tabla = pestañaActiva === 'chambelanes' ? 'horarios' : 'clases_publicas';

  if (pestañaActiva === 'chambelanes') {
    datos.quinceanera = document.getElementById('modalQuinceanera').value.trim();
    datos.chambelan_email = document.getElementById('modalChambelan').value || null;
    if (!datos.quinceanera) return alert('El nombre de la quinceañera es obligatorio');
  } else {
    datos.nombre_clase = document.getElementById('modalNombreClase').value.trim();
    if (!datos.nombre_clase) return alert('El nombre de la clase es obligatorio');
  }

  const res = eventoActual 
    ? await supabaseClient.from(tabla).update(datos).eq('id', eventoActual)
    : await supabaseClient.from(tabla).insert(datos);

  if (res.error) {
    console.error(res.error);
    alert('Error al guardar. Revisa consola.');
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('eventoModal')).hide();
  eventoActual = null;

  if (pestañaActiva === 'chambelanes') cargarGridChambelanes();
  else cargarGridClases();
}

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = '../../index.html';
}
async function editarEvento(id, tabla) {
  if (!id || id === 'null' || id === null) {
    return abrirModalNuevo();
  }

  eventoActual = id;

  const tableName = tabla === 'horarios' ? 'horarios' : 'clases_publicas';

  const { data, error } = await supabaseClient
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error al cargar evento:', error);
    alert('No se pudo cargar el evento');
    return;
  }

  // Campos comunes
  document.getElementById('modalDia').value = data.dia || 'Lunes';
  document.getElementById('modalHora').value = data.hora_inicio || '1:00';
  document.getElementById('modalSede').value = data.sede || '';
  document.getElementById('modalNotas').value = data.notas || '';

  // Campos específicos según tabla
  if (tabla === 'horarios') {
    document.getElementById('modalQuinceanera').value = data.quinceanera || '';
    document.getElementById('modalChambelan').value = data.chambelan_email || '';
  } else {
    document.getElementById('modalNombreClase').value = data.nombre_clase || '';
  }

  document.getElementById('modalTitle').textContent = 'Editar Evento';
  ajustarModalSegunPestana();
  new bootstrap.Modal(document.getElementById('eventoModal')).show();
}

function abrirModalNuevo() {
  eventoActual = null;
  document.getElementById('modalTitle').textContent = 'Nuevo Evento';

  // Limpiar TODO
  limpiarModal();

  // Aseguramos que el modal use la pestaña actual
  ajustarModalSegunPestana();

  const modal = new bootstrap.Modal(document.getElementById('eventoModal'), {
    backdrop: 'static',
    keyboard: true
  });
  modal.show();
}