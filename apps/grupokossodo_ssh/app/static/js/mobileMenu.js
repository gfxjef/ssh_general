document.addEventListener('DOMContentLoaded', function() {
    // Crear botón toggle para sidebar en móviles
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
    document.body.appendChild(toggleBtn);
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    // Referencia al sidebar
    const sidebar = document.getElementById('sidebarContainer');
    
    // Función para mostrar/ocultar sidebar
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
        document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
    });
    
    // Cerrar sidebar al hacer clic en overlay
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    });
    
    // Ajustar visibilidad del botón en resize
    window.addEventListener('resize', function() {
        toggleBtn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
});