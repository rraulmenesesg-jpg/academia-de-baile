// js/horario-chambelan.js

const horariosFijos = [
  { clave: "1300", inicio: "1:00",  fin: "2:30"  },
  { clave: "1430", inicio: "2:30",  fin: "4:00"  },
  { clave: "1600", inicio: "4:00",  fin: "5:30"  },
  { clave: "1730", inicio: "5:30",  fin: "7:00"  },
  { clave: "1900", inicio: "7:00",  fin: "8:30"  },
  { clave: "2030", inicio: "8:30",  fin: "9:30"  }
];

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Flag para evitar que se ejecute más de una vez
let cargando = false;

async function cargarMiHorario() {
  if (cargando) return;   // ← evita el loop
  cargando = true;

  const container = document.getElementById('horario-container');
  if (!container) return;

  container.innerHTML = '<p class="text-center text-muted">Cargando tu horario...</p>';

  // Obtener sesión actual
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    window.location.href = 'login.html';
    return;
  }

  // Obtener perfil del usuario
  const { data: perfil, error: perfilError } = await supabaseClient
    .from('usuarios')
    .select('email, nombre, rol')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil) {
    container.innerHTML = '<p class="text-danger text-center">No se pudo cargar tu perfil.</p>';
    return;
  }

  // Mostrar nombre en el badge
  const badge = document.getElementById('nombre-badge');
  if (badge) badge.textContent = (perfil.nombre || perfil.email) + ' · ' + perfil.rol;

  // Si es admin o super_chambelan redirigir al panel admin
  const rol = perfil.rol.trim().toLowerCase();
  if (rol === 'admin' || rol === 'super_chambelan') {
    window.location.href = 'admin-horarios.html';
    return;
  }

  // Traer solo los eventos asignados a este chambelán
  const { data: eventos, error: eventosError } = await supabaseClient
    .from('horarios')
    .select('dia, hora_inicio, quinceanera, sede, notas')
    .eq('chambelan_email', perfil.email);

  if (eventosError) {
    container.innerHTML = '<p class="text-danger text-center">Error al cargar el horario.</p>';
    return;
  }

  // Construir el grid
  let html = '<div class="horario">';

  // Esquina vacía + encabezados de días
  html += '<div class="celda"></div>';
  dias.forEach(dia => html += `<div class="dia">${dia}</div>`);

  // Filas de horarios
  horariosFijos.forEach(h => {
    html += `<div class="hora">${h.inicio} - ${h.fin}</div>`;

    dias.forEach(dia => {
      const evento = eventos?.find(ev =>
        ev.dia.toLowerCase().replace('é','e') === dia.toLowerCase().replace('é','e') &&
        ev.hora_inicio === h.inicio
      );

      let contenido = '';
      if (evento) {
        contenido = `
          <strong>${evento.quinceanera || ''}</strong><br>
          ${evento.sede  ? `<small>${evento.sede}</small><br>`  : ''}
          ${evento.notas ? `<small>${evento.notas}</small>` : ''}
        `;
      }

      html += `<div class="celda ${evento ? 'has-event' : ''}">${contenido}</div>`;
    });
  });

  html += '</div>';

  // Si no tiene eventos asignados, mostrar mensaje amigable
  if (!eventos || eventos.length === 0) {
    html += '<p class="text-center text-muted mt-3">No tienes eventos asignados aún.</p>';
  }

  container.innerHTML = html;
}

// Un solo listener, sin duplicados
document.addEventListener('DOMContentLoaded', cargarMiHorario);