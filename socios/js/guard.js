// js/guard.js
async function protectPage() {
  if (!window.supabaseClient) {
    console.error("supabaseClient no está listo");
    return;
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const rolesRequeridos = document.body.dataset.requiresRol;
  if (!rolesRequeridos) return;

  const { data: perfil, error } = await window.supabaseClient
    .from('usuarios')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil) {
    console.error("Guard: no se pudo leer perfil", error);
    return;
  }

  const rol = perfil.rol.trim().toLowerCase();
  const permitidos = rolesRequeridos.split(',').map(r => r.trim());

  if (!permitidos.includes(rol)) {
    window.location.href = rol === 'chambelan' ? 'mi-horario.html' : 'login.html';
  }
}

// Esperar a que el DOM esté listo antes de correr
document.addEventListener('DOMContentLoaded', protectPage);