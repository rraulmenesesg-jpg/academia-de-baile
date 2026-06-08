async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Error en login:', error.message);
    alert('Usuario o contraseña incorrectos');
    return;
  }

  console.log('Login exitoso. Usuario ID:', data.user.id);


  if (!window.supabaseClient) {
    console.error('ERROR GRAVE: supabaseClient NO está definido');
    alert('Error interno: cliente Supabase no cargado. Revisa orden de scripts.');
    return;
  }

  console.log('Clave API usada (anon key):', window.supabaseClient.supabaseKey ? 'SÍ' : 'NO');
  // Obtener el rol del usuario
  const { data: perfil, error: errorPerfil } = await supabaseClient
    .from('usuarios')
    .select('rol')
    .eq('id', data.user.id)
    .single();

  console.log('Perfil encontrado:', perfil);
  console.log('Error en consulta de perfil:', errorPerfil);

  if (errorPerfil || !perfil || !perfil.rol) {
    console.error('No se encontró perfil o rol inválido');
    alert('Error al cargar tu rol. Contacta al administrador. (Revisa consola)');
    return;
  }

  const rol = perfil.rol.trim().toLowerCase(); // ← trim y lowercase para evitar errores tontos

  console.log('Rol detectado:', rol);

  // Redirigir según rol
  if (rol === 'admin' || rol === 'super_chambelan') {
    console.log('Redirigiendo a admin-horarios.html');
    window.location.href = 'admin-horarios.html';
  } else if (rol === 'chambelan') {
    console.log('Redirigiendo a mi-horario.html');
    window.location.href = 'mi-horario.html';
  } else {
    alert('Rol no reconocido: ' + rol);
  }
}