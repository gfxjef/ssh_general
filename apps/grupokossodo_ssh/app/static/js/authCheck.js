// Verificación de autenticación
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe información del usuario en sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
    
    // Si no hay datos de usuario, redirigir al login
    if (!userData) {
        console.log('No se encontró información de usuario. Redirigiendo al login...');
        
        // Usar AppConfig si está disponible, o detectar el basePath dinámicamente
        if (typeof AppConfig !== 'undefined') {
            window.location.href = AppConfig.getFullPath('/api/login');
        } else {
            const basePath = window.location.pathname.split('/')[1] === 'grupokossodo_ssh' ? '/grupokossodo_ssh' : '';
            window.location.href = basePath + '/api/login';
        }
        return;
    }
    
    console.log('Usuario autenticado:', userData.nombre);
});