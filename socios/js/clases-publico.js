// js/clases-publico.js
const diasPrefix = ["lunes", "martes", "miercoles", "jueves", "viernes"];
const diasFull   = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const horariosFijos = [
  { inicio: "1:00",  clave: "1300" },
  { inicio: "2:30",  clave: "1430" },
  { inicio: "4:00",  clave: "1600" },
  { inicio: "5:30",  clave: "1730" },
  { inicio: "7:00",  clave: "1900" },
  { inicio: "8:30",  clave: "2030" }
];

async function cargarHorarioPublico() {
  // Limpiamos primero para que no se vea el texto estático
  diasPrefix.forEach(prefix => {
    horariosFijos.forEach(h => {
      const celda = document.getElementById(`${prefix}_${h.clave}`);
      if (celda) celda.innerHTML = '';
    });
  });

  const { data: clases, error } = await supabaseClient
    .from('clases_publicas')
    .select('*');

  if (error) {
    console.error("Error al cargar horario público:", error);
    return;
  }

  clases.forEach(clase => {
    const idx = diasFull.findIndex(d => 
      d.toLowerCase().replace('é','e') === clase.dia.toLowerCase().replace('é','e')
    );
    if (idx === -1) return;

    const h = horariosFijos.find(hh => hh.inicio === clase.hora_inicio);
    if (!h) return;

    const id = `${diasPrefix[idx]}_${h.clave}`;
    const celda = document.getElementById(id);
    if (!celda) return;

    let html = `<strong>${clase.nombre_clase}</strong>`;
    if (clase.sede)  html += `<br><small>${clase.sede}</small>`;
    if (clase.notas) html += `<br><small>${clase.notas}</small>`;

    celda.innerHTML = html;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.supabaseClient) {
    cargarHorarioPublico();
  } else {
    console.error("supabaseClient no encontrado - revisa orden de scripts");
  }
});