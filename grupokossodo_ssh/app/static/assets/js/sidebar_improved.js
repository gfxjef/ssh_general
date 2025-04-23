// Sidebar functionality with improved animation
class Sidebar {
    constructor() {
        this.init();
        this.activeMenus = new Set(); // Mantener registro de menús abiertos
    }
    
    init() {
        // Establecer estado inicial de los submenús (ocultos)
        this.hideAllSubmenus();
        // Configurar interactividad de los submenús
        this.setupSubmenuToggle();
        // Detectamos clics fuera del menú para cerrar submenús abiertos
        this.setupOutsideClickHandler();
    }
    
    // Método para ocultar todos los submenús al inicio
    hideAllSubmenus() {
        const submenus = document.querySelectorAll('.submenu');
        submenus.forEach(submenu => {
            submenu.style.maxHeight = '0';
            submenu.style.opacity = '0';
            submenu.style.visibility = 'hidden';
            
            // Asegurarse de que el elemento padre no tenga la clase active
            const parentLi = submenu.closest('.has-submenu');
            if (parentLi) {
                parentLi.classList.remove('active');
            }
        });
    }
    
    // Cierra todos los submenús excepto los que están en la ruta del elemento activo
    closeOtherSubmenus(currentItem) {
        const currentPath = this.getMenuPath(currentItem);
        
        // Obtenemos todos los submenús activos
        document.querySelectorAll('.has-submenu.active').forEach(activeItem => {
            // Si el elemento activo no está en la ruta del elemento actual, lo cerramos
            if (!currentPath.includes(activeItem)) {
                const submenu = activeItem.querySelector('.submenu');
                activeItem.classList.remove('active');
                if (submenu) {
                    submenu.style.maxHeight = '0';
                    submenu.style.opacity = '0';
                    submenu.style.visibility = 'hidden';
                }
            }
        });
    }
    
    // Obtiene la ruta de elementos padres de un elemento de menú
    getMenuPath(element) {
        const path = [];
        let current = element;
        
        while (current && !current.classList.contains('sidebar-nav')) {
            if (current.classList.contains('has-submenu')) {
                path.push(current);
            }
            current = current.parentElement;
        }
        
        return path;
    }
    
    // Configura un event listener para cerrar menús cuando se hace clic fuera del sidebar
    setupOutsideClickHandler() {
        document.addEventListener('click', (event) => {
            // Si el clic no es dentro del sidebar, cerramos todos los submenús
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && !sidebar.contains(event.target)) {
                this.hideAllSubmenus();
            }
        });
    }
    
    // Calcula la altura real de un submenu incluyendo todos sus elementos
    getFullSubmenuHeight(submenu) {
        // Primero, hacemos visible el submenu temporalmente para calcular su altura real
        const originalMaxHeight = submenu.style.maxHeight;
        const originalVisibility = submenu.style.visibility;
        const originalOpacity = submenu.style.opacity;
        
        submenu.style.maxHeight = 'none';
        submenu.style.visibility = 'hidden';
        submenu.style.opacity = '0';
        
        const height = submenu.scrollHeight;
        
        // Restauramos los valores originales
        submenu.style.maxHeight = originalMaxHeight;
        submenu.style.visibility = originalVisibility;
        submenu.style.opacity = originalOpacity;
        
        return height;
    }
    
    // Abre un submenu y asegura que todos sus ancestros también estén abiertos
    openSubmenu(parentLi) {
        // Marcamos el elemento como activo
        parentLi.classList.add('active');
        
        // Encontramos el submenu asociado
        const submenu = parentLi.querySelector('.submenu');
        if (!submenu) return;
        
        // Calculamos la altura real del submenu
        const height = this.getFullSubmenuHeight(submenu);
        
        // Aplicamos la animación
        submenu.style.maxHeight = `${height}px`;
        submenu.style.opacity = '1';
        submenu.style.visibility = 'visible';
        
        // Aseguramos que todos los elementos padres también están abiertos
        let parent = parentLi.parentElement;
        while (parent) {
            const parentMenu = parent.closest('.has-submenu');
            if (parentMenu) {
                parentMenu.classList.add('active');
                const parentSubmenu = parentMenu.querySelector('.submenu');
                if (parentSubmenu) {
                    // Actualizar también la altura máxima del submenu padre
                    parentSubmenu.style.maxHeight = `${this.getFullSubmenuHeight(parentSubmenu)}px`;
                    parentSubmenu.style.opacity = '1';
                    parentSubmenu.style.visibility = 'visible';
                }
                parent = parentMenu.parentElement;
            } else {
                break;
            }
        }
    }
    
    // Cierra un submenu y sus hijos
    closeSubmenu(parentLi) {
        // Eliminamos la clase active
        parentLi.classList.remove('active');
        
        // Encontramos el submenu asociado
        const submenu = parentLi.querySelector('.submenu');
        if (!submenu) return;
        
        // Cerramos este submenu
        submenu.style.maxHeight = '0';
        submenu.style.opacity = '0';
        submenu.style.visibility = 'hidden';
        
        // Cerramos también todos los submenús hijos
        const childSubmenus = submenu.querySelectorAll('.has-submenu');
        childSubmenus.forEach(childLi => {
            this.closeSubmenu(childLi);
        });
    }
    
    setupSubmenuToggle() {
        console.log("Configurando toggles del submenú mejorados...");
        
        // Seleccionar todos los elementos que tienen submenús
        const submenuItems = document.querySelectorAll('.has-submenu > .nav-item');
        
        // Agregar event listeners a cada uno
        submenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenir navegación si es un enlace
                
                // Obtenemos el elemento li padre
                const parentLi = item.parentElement;
                
                // Si ya está activo, lo cerramos
                if (parentLi.classList.contains('active')) {
                    this.closeSubmenu(parentLi);
                } else {
                    // Cerramos otros submenús del mismo nivel antes de abrir este
                    this.closeOtherSubmenus(parentLi);
                    
                    // Abrimos el submenú actual
                    this.openSubmenu(parentLi);
                }
                
                console.log("Toggle aplicado a:", item.querySelector('.nav-text')?.textContent);
            });
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en una página con sidebar
    if (document.querySelector('.sidebar')) {
        window.sidebarInstance = new Sidebar();
    }
});
