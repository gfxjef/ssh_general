// Sidebar functionality
class Sidebar {
    constructor() {
        this.init();
    }
    
    init() {
        // Establecer estado inicial de los submenús (ocultos)
        this.hideAllSubmenus();
        // Configurar interactividad de los submenús
        this.setupSubmenuToggle();
    }
    
    // Método nuevo para ocultar todos los submenús al inicio
    hideAllSubmenus() {
        const submenus = document.querySelectorAll('.submenu');
        submenus.forEach(submenu => {
            submenu.style.maxHeight = '0';
            submenu.style.opacity = '0'; // Opcional: añadir opacidad
            submenu.style.visibility = 'hidden'; // Opcional: mejorar accesibilidad
        });
    }
    
    setupSubmenuToggle() {
        console.log("Configurando toggles del submenú...");
        
        // Seleccionar todos los elementos que tienen submenús
        const submenuItems = document.querySelectorAll('.has-submenu > .nav-item');
        
        // Agregar event listeners a cada uno
        submenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenir navegación si es un enlace
                
                // Toggle la clase active en el elemento li padre
                const parentLi = item.parentElement;
                parentLi.classList.toggle('active');
                
                // Encontrar el submenu asociado
                const submenu = parentLi.querySelector('.submenu');
                
                // Si está activo, mostrar el submenu
                if (parentLi.classList.contains('active')) {
                    submenu.style.maxHeight = submenu.scrollHeight + 'px';
                    submenu.style.opacity = '1'; // Opcional: añadir opacidad
                    submenu.style.visibility = 'visible'; // Opcional: mejorar accesibilidad
                } else {
                    submenu.style.maxHeight = '0';
                    submenu.style.opacity = '0'; // Opcional: añadir opacidad
                    submenu.style.visibility = 'hidden'; // Opcional: mejorar accesibilidad
                }
                
                console.log("Toggle aplicado a:", item.querySelector('.nav-text')?.textContent);
            });
        });
    }
}
