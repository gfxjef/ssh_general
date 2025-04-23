document.addEventListener('DOMContentLoaded', function() {
    // Obtener información del usuario desde sessionStorage
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    const userName = document.getElementById('user-name');
    const userDetails = document.getElementById('user-details');
    const btnLogout = document.getElementById('btn-logout');
    
    // Mostrar el nombre del usuario
    if (userInfo && userInfo.nombre) {
        userName.textContent = userInfo.nombre;
        
        // Mostrar detalles del usuario
        let detailsHTML = `
            <div class="user-card">
                <h3>Información del Usuario</h3>
                <p><strong>Nombre:</strong> ${userInfo.nombre}</p>
                <p><strong>Correo:</strong> ${userInfo.correo || 'No disponible'}</p>
                <p><strong>Cargo:</strong> ${userInfo.cargo || 'No disponible'}</p>
                <p><strong>Grupo:</strong> ${userInfo.grupo || 'No disponible'}</p>
            </div>
        `;
        userDetails.innerHTML = detailsHTML;    } else {
        // Si no hay información de usuario, redirigir al login
        window.location.href = AppConfig.getFullPath('/');
    }
    
    // Manejar el cierre de sesión
    btnLogout.addEventListener('click', function() {
        // Limpiar datos de sesión
        sessionStorage.removeItem('userInfo');        // Redirigir al login
        window.location.href = AppConfig.getFullPath('/');
    });
});
