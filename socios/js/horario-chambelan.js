// js/horario-admin.js — versión limpia
 
const horariosFijos = [
  { clave: "1300", inicio: "1:00",  fin: "2:30"  },
  { clave: "1430", inicio: "2:30",  fin: "4:00"  },
  { clave: "1600", inicio: "4:00",  fin: "5:30"  },
  { clave: "1730", inicio: "5:30",  fin: "7:00"  },
  { clave: "1900", inicio: "7:00",  fin: "8:30"  },
  { clave: "2030", inicio: "8:30",  fin: "9:30"  }
];
 
const dias     = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const diasLower = dias.map(d => d.toLowerCase().replace('é', 'e'));
 
let eventoActual   = null;   // id del evento en edición (null = nuevo)
let tablaActual    = null;   // 'horarios' | 'clases_publicas'
let pestañaActiva  = 'chambelanes';
let rolUsuario     = null;   // se llena al cargar
 
// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar sesión y obtener rol
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
 
  const { data: perfil } = await supabaseClient
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single();
 
  if (!perfil) { window.location.href = 'login.html'; return; }
 
  rolUsuario = perfil.rol.trim().toLowerCase();
 
  // Solo admin y super_chambelan pueden estar aquí
  if (rolUsuario !== 'admin' && rolUsuario !== 'super_chambelan') {
    window.location.href = 'mi-horario.html';
    return;
  }
 
  // Si es admin, mostrar pestaña de registro de chambelanes
  if (rolUsuario === 'admin') {
    document.getElementById('tab-registro')?.classList.remove('d-none');
  }
 
  await cargarListaChambelanes();
  await cargarGridChambelanes();
  await cargarGridClases();
 
  // Escuchar cambio de pestaña Bootstrap
  document.querySelectorAll('#adminTabs .nav-link').forEach(tab => {
    tab.addEventListener('shown.bs.tab', e => {
      pestañaActiva = e.target.id.replace('-tab', '');   // 'chambelanes' | 'clases' | 'registro'
      ajustarModalSegunPestana();
    });
  });
});
 
// ─────────────────────────────────────────────────────────
// CARGAR LISTA DE CHAMBELANES (para el select del modal)
// ─────────────────────────────────────────────────────────
async function cargarListaChambelanes() {
  const select = document.getElementById('modalChambelan');
  if (!select) return;
 
  select.innerHTML = '<option value="">-- Sin asignar --</option>';
 
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('email, nombre')
    .eq('rol', 'chambelan')
    .order('nombre');
 
  if (error) { console.error('Error cargando chambelanes:', error); return; }
 
  data.forEach(c => {
    const opt = document.createElement('option');
    opt.value       = c.email;
    opt.textContent = c.nombre || c.email;
    select.appendChild(opt);
  });
}
 
// ─────────────────────────────────────────────────────────
// GRID — CHAMBELANES
// ─────────────────────────────────────────────────────────
async function cargarGridChambelanes() {
  const container = document.getElementById('grid-chambelanes');
  if (!container) return;
 
  container.innerHTML = '<p class="text-center text-muted">Cargando...</p>';
 
  const { data: eventos, error } = await supabaseClient
    .from('horarios')
    .select('id, dia, hora_inicio, quinceanera, sede, notas, chambelan_email');
 
  if (error) {
    container.innerHTML = '<p class="text-danger text-center">Error al cargar eventos</p>';
    return;
  }
 
  container.innerHTML = `<div class="horario">${buildGrid(eventos, 'horarios')}</div>`;
}
 
// ─────────────────────────────────────────────────────────
// GRID — CLASES PÚBLICAS
// ─────────────────────────────────────────────────────────
async function cargarGridClases() {
  const container = document.getElementById('grid-clases');
  if (!container) return;
 
  container.innerHTML = '<p class="text-center text-muted">Cargando...</p>';
 
  const { data: clases, error } = await supabaseClient
    .from('clases_publicas')
    .select('id, dia, hora_inicio, nombre_clase, sede, notas');
 
  if (error) {
    container.innerHTML = '<p class="text-danger text-center">Error al cargar clases</p>';
    return;
  }
 
  container.innerHTML = `<div class="horario">${buildGrid(clases, 'clases_publicas')}</div>`;
}
 
// ─────────────────────────────────────────────────────────
// HELPER — construye el HTML del grid según tabla
// ─────────────────────────────────────────────────────────
function buildGrid(registros, tabla) {
  const esChambelanes = tabla === 'horarios';
 
  let html = `<div class="celda"></div>`;
  dias.forEach(d => html += `<div class="dia">${d}</div>`);
 
  horariosFijos.forEach(h => {
    html += `<div class="hora">${h.inicio} - ${h.fin}</div>`;
 
    diasLower.forEach((diaLower, idx) => {
      const ev = registros.find(r =>
        r.dia.toLowerCase().replace('é','e') === diaLower &&
        r.hora_inicio === h.inicio
      );
 
      let contenido = '';
      if (ev) {
        if (esChambelanes) {
          contenido = `
            <strong>${ev.quinceanera || ''}</strong><br>
            <small>${ev.sede || ''}</small><br>
            <small class="text-muted">${ev.chambelan_email || 'Sin asignar'}</small>
            <br>
            <button class="btn btn-sm btn-outline-danger mt-1 btn-borrar"
                    onclick="event.stopPropagation(); borrarEvento('${ev.id}','horarios')">
              🗑
            </button>`;
        } else {
          contenido = `
            <strong>${ev.nombre_clase || ''}</strong><br>
            <small>${ev.sede || ''}</small><br>
            <small>${ev.notas || ''}</small>
            <br>
            <button class="btn btn-sm btn-outline-danger mt-1 btn-borrar"
                    onclick="event.stopPropagation(); borrarEvento('${ev.id}','clases_publicas')">
              🗑
            </button>`;
        }
      }
 
      html += `
        <div class="celda ${ev ? 'has-event' : ''}"
             onclick="abrirEdicion('${ev ? ev.id : null}', '${tabla}')">
          ${contenido}
        </div>`;
    });
  });
 
  return html;
}
 
// ─────────────────────────────────────────────────────────
// ABRIR MODAL — NUEVO
// ─────────────────────────────────────────────────────────
function abrirModalNuevo() {
  eventoActual = null;
  tablaActual  = pestañaActiva === 'chambelanes' ? 'horarios' : 'clases_publicas';
  document.getElementById('modalTitle').textContent = 'Nuevo evento';
  limpiarModal();
  ajustarModalSegunPestana();
  new bootstrap.Modal(document.getElementById('eventoModal')).show();
}
 
// ─────────────────────────────────────────────────────────
// ABRIR MODAL — EDITAR  (llamado desde onclick de celda)
// ─────────────────────────────────────────────────────────
async function abrirEdicion(id, tabla) {
  // Celda vacía → nuevo
  if (!id || id === 'null') {
    tablaActual = tabla;
    pestañaActiva = tabla === 'horarios' ? 'chambelanes' : 'clases';
    abrirModalNuevo();
    return;
  }
 
  tablaActual   = tabla;
  pestañaActiva = tabla === 'horarios' ? 'chambelanes' : 'clases';
  eventoActual  = id;
 
  const { data, error } = await supabaseClient
    .from(tabla)
    .select('*')
    .eq('id', id)
    .single();
 
  if (error || !data) { alert('No se pudo cargar el evento'); return; }
 
  // Rellenar campos comunes
  document.getElementById('modalDia').value   = data.dia        || 'Lunes';
  document.getElementById('modalHora').value  = data.hora_inicio || '1:00';
  document.getElementById('modalSede').value  = data.sede       || '';
  document.getElementById('modalNotas').value = data.notas      || '';
 
  // Campos específicos
  if (tabla === 'horarios') {
    document.getElementById('modalQuinceanera').value = data.quinceanera    || '';
    document.getElementById('modalChambelan').value   = data.chambelan_email || '';
  } else {
    document.getElementById('modalNombreClase').value = data.nombre_clase || '';
  }
 
  document.getElementById('modalTitle').textContent = 'Editar evento';
  ajustarModalSegunPestana();
  new bootstrap.Modal(document.getElementById('eventoModal')).show();
}
 
// ─────────────────────────────────────────────────────────
// GUARDAR (crear o actualizar)
// ─────────────────────────────────────────────────────────
async function guardarEvento() {
  const dia         = document.getElementById('modalDia').value;
  const hora_inicio = document.getElementById('modalHora').value;
  const sede        = document.getElementById('modalSede').value.trim()  || null;
  const notas       = document.getElementById('modalNotas').value.trim() || null;
 
  let datos = { dia, hora_inicio, sede, notas };
 
  if (tablaActual === 'horarios') {
    datos.quinceanera     = document.getElementById('modalQuinceanera').value.trim();
    datos.chambelan_email = document.getElementById('modalChambelan').value || null;
    if (!datos.quinceanera) { alert('El nombre de la quinceañera es obligatorio'); return; }
  } else {
    datos.nombre_clase = document.getElementById('modalNombreClase').value.trim();
    if (!datos.nombre_clase) { alert('El nombre de la clase es obligatorio'); return; }
  }
 
  const res = eventoActual
    ? await supabaseClient.from(tablaActual).update(datos).eq('id', eventoActual)
    : await supabaseClient.from(tablaActual).insert(datos);
 
  if (res.error) { console.error(res.error); alert('Error al guardar. Revisa consola.'); return; }
 
  // Cerrar modal y recargar grid correspondiente
  bootstrap.Modal.getInstance(document.getElementById('eventoModal'))?.hide();
  eventoActual = null;
 
  if (tablaActual === 'horarios') cargarGridChambelanes();
  else cargarGridClases();
}
 
// ─────────────────────────────────────────────────────────
// BORRAR EVENTO
// ─────────────────────────────────────────────────────────
async function borrarEvento(id, tabla) {
  if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
 
  const { error } = await supabaseClient.from(tabla).delete().eq('id', id);
 
  if (error) { console.error(error); alert('Error al eliminar'); return; }
 
  if (tabla === 'horarios') cargarGridChambelanes();
  else cargarGridClases();
}
 
// ─────────────────────────────────────────────────────────
// HELPERS — MODAL
// ─────────────────────────────────────────────────────────
function ajustarModalSegunPestana() {
  const esCham = tablaActual === 'horarios';
  document.getElementById('grupoChambelanes')?.classList.toggle('d-none', !esCham);
  document.getElementById('grupoChambelanes2')?.classList.toggle('d-none', !esCham);
  document.getElementById('grupoClases')?.classList.toggle('d-none',  esCham);
}
 
function limpiarModal() {
  ['modalDia','modalHora','modalSede','modalNotas',
   'modalQuinceanera','modalNombreClase'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'modalDia' ? 'Lunes' : id === 'modalHora' ? '1:00' : '';
  });
  const sel = document.getElementById('modalChambelan');
  if (sel) sel.value = '';
}
 
// ─────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = '../../index.html';
}
 