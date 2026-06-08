// js/guard.js
async function protectPage() {
  // Verificamos si el cliente existe antes de usarlo
  if (!window.supabaseClient) {
     console.error("El cliente de Supabase no está listo.");
     return;
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
  }
}

protectPage();