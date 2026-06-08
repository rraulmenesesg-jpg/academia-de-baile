// Configuración
const SB_URL = "https://qevsqoxkvasmrrebkyed.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldnNxb3hrdmFzbXJyZWJreWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDAzNTksImV4cCI6MjA4NjYxNjM1OX0.Rpso982xWv6Pc8lkWNrKCf_HFvcWJBv_ZtDa0T9Pi8U";

// Creamos el cliente. 
// 'supabase' (en minúsculas) es lo que viene de la librería externa.
// 'client' es como llamaremos a nuestra conexión.
window.supabaseClient = supabase.createClient(SB_URL, SB_KEY);
// Función para el login
console.log("Conexión BD correctamente.");