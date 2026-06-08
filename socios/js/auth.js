// js/auth.js

async function login(email, password) {
  const btnLogin = document.querySelector('.login-btn');
  if (btnLogin) { btnLogin.disabled = true; btnLogin.textContent = 'Entrando...'; }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Error en login:', error.message);
    mostrarError('Usuario o contraseña incorrectos');
    if (btnLogin) { btnLogin.disabled = false; btnLogin.textContent = 'Entrar'; }
    return;
  }

  // Obtener rol del usuario
  const { data: perfil, error: errorPerfil } = await supabaseClient
    .from('usuarios')
    .select('rol')
    .eq('id', data.user.id)
    .single();

  if (errorPerfil || !perfil?.rol) {
    console.error('No se encontró perfil:', errorPerfil);
    mostrarError('No se encontró tu perfil. Contacta al administrador.');
    if (btnLogin) { btnLogin.disabled = false; btnLogin.textContent = 'Entrar'; }
    return;
  }

  const rol = perfil.rol.trim().toLowerCase();
  console.log('Login exitoso. Rol:', rol);

  // Redirigir según rol
  if (rol === 'admin' || rol === 'super_chambelan') {
    window.location.href = 'admin-horarios.html';
  } else if (rol === 'chambelan') {
    window.location.href = 'mi-horario.html';
  } else {
    mostrarError('Rol no reconocido: ' + rol);
    if (btnLogin) { btnLogin.disabled = false; btnLogin.textContent = 'Entrar'; }
  }
}

function mostrarError(msg) {
  let el = document.getElementById('login-error');
  if (!el) {
    el = document.createElement('p');
    el.id = 'login-error';
    el.style.cssText = 'color:#e74c3c;font-size:0.9rem;margin-top:12px;text-align:center;';
    document.querySelector('.login-card')?.appendChild(el);
  }
  el.textContent = msg;
}

// Logout global — disponible en todas las páginas que incluyan auth.js
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = '../../index.html';
}