    const horariosFijos = [
      { clave: "1300",  inicio: "1:00",  fin: "2:30" },
      { clave: "1430",  inicio: "2:30",  fin: "4:00" },
      { clave: "1600",  inicio: "4:00",  fin: "5:30" },
      { clave: "1730",  inicio: "5:30",  fin: "7:00" },
      { clave: "1900",  inicio: "7:00",  fin: "8:30" },
      { clave: "2030",  inicio: "8:30",  fin: "9:30" }
    ];

    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    async function cargarMiHorario() {
      const container = document.getElementById('horario-container');
      container.innerHTML = '<p style="text-align:center;">Cargando tu horario...</p>';

      // Obtener usuario actual
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Obtener email del usuario
      const { data: perfil } = await supabaseClient
        .from('usuarios')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!perfil) return;

      // Traer SOLO los eventos de este chambelán
      const { data: eventos } = await supabaseClient
        .from('horarios')
        .select('dia, hora_inicio, quinceanera, sede, notas')
        .eq('chambelan_email', perfil.email);

      // Construir el grid
      let html = `<div class="horario">`;

      // Esquina vacía + encabezados de días
      html += `<div class="celda"></div>`;
      dias.forEach(dia => {
        html += `<div class="dia">${dia}</div>`;
      });

      // Filas de horarios
      horariosFijos.forEach(h => {
        html += `<div class="hora">${h.inicio} - ${h.fin}</div>`;

        dias.forEach(dia => {
          const idCelda = `${dia.toLowerCase().replace('é','e')}_${h.clave}`;

          // Buscar si hay evento en este día y hora
          const evento = eventos.find(ev => 
            ev.dia.toLowerCase() === dia.toLowerCase().replace('é','e') &&
            ev.hora_inicio === h.inicio
          );

          let contenido = '';
          if (evento) {
            contenido = `
              <strong>${evento.quinceanera}</strong><br>
              ${evento.sede ? `<small>${evento.sede}</small><br>` : ''}
              ${evento.notas ? `<small>${evento.notas}</small>` : ''}
            `;
          }

          html += `<div class="celda ${evento ? 'has-event' : ''}" id="${idCelda}">${contenido}</div>`;
        });
      });

      html += `</div>`;
      container.innerHTML = html;
    }

        async function logout() {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    }
    // Cargar al iniciar
    document.addEventListener('DOMContentLoaded', cargarMiHorario);