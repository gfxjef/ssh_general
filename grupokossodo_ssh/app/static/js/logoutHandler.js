/**
 * Script para manejar la funcionalidad de cierre de sesión
 * tanto en el header como en el sidebar
 */
document.addEventListener('DOMContentLoaded', function() {
    // Función general para manejar el cierre de sesión
    function handleLogout() {
        // Limpiar datos de sesión
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userInfo');
        
        // Redirigir al login usando AppConfig si está disponible
        window.location.href = typeof AppConfig !== 'undefined' 
            ? AppConfig.getFullPath('/api/login')
            : '/api/login';
            
        console.log('Sesión cerrada');
    }
    
    // Observador de mutaciones para detectar cuando se añade el botón de logout al DOM
    const observer = new MutationObserver(function(mutations) {
        // Verificar si el botón de logout del sidebar existe ahora
        const sidebarLogoutBtn = document.getElementById('logoutBtn');
        if (sidebarLogoutBtn && !sidebarLogoutBtn.hasLogoutListener) {
            console.log('Botón de logout del sidebar detectado, añadiendo listener');
            sidebarLogoutBtn.addEventListener('click', handleLogout);
            sidebarLogoutBtn.hasLogoutListener = true;
        }
    });
    
    // Iniciar la observación del documento
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // También verificar inmediatamente si el botón ya existe
    const sidebarLogoutBtn = document.getElementById('logoutBtn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', handleLogout);
        sidebarLogoutBtn.hasLogoutListener = true;
        console.log('Botón de logout en sidebar configurado');
    }
});
