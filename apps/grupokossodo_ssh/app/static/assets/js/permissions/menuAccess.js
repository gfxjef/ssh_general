class MenuAccessManager {
    constructor() {
        this.permissions = {};
        this.buttonPermissions = {}; // Nuevo objeto para permisos de botones
        this.userRole = null;
        this.menuPaths = {};
    }
    
    async initialize() {
        try {
            // Permisos jerárquicos usando notación de ruta (menús)
            this.permissions = {
                // Menús principales
                'Marketing': ['admin', 'gerente', 'vendedor', 'almacen','asesor','marketing'],
                'Ventas': ['admin', 'gerente','marketing'],
                'Bienestar de Talento': ['admin', 'gerente','rrhh','atencion'],
                'Seguimiento de Pedidos': ['admin', 'gerente', 'vendedor', 'almacen'],
                
                // Submenús de Marketing
                'Marketing/Inventario': ['admin', 'gerente', 'almacen','marketing'],
                'Marketing/Merchandising': ['admin', 'gerente', 'vendedor', 'almacen','asesor','marketing'],
                'Marketing/Catalogos': ['admin', 'gerente', 'vendedor', 'asesor', 'marketing'],
                
                // Submenús específicos de Marketing/Merchandising
                'Marketing/Merchandising/Solicitud de Merchandising': ['admin', 'gerente', 'vendedor','asesor','marketing'],
                'Marketing/Merchandising/Confirmación Solicitudes': ['admin', 'gerente', 'almacen','marketing'],
                'Marketing/Merchandising/Historial Confirmaciones': ['admin', 'gerente','marketing'],
                
                // Submenús específicos de Marketing/Catalogos
                'Marketing/Catalogos/Total': ['admin', 'gerente', 'vendedor', 'asesor', 'marketing'],
                
                // Submenús de Ventas
                'Ventas/Encuestas': ['admin', 'gerente','atencion'],
                'Ventas/Encuestas/Registro Calificaciones': ['admin', 'gerente','atencion','marketing'],
                
                // Submenús de Bienestar
                'Bienestar de Talento/Posts': ['admin', 'gerente', 'rrhh'],
                'Bienestar de Talento/Administrar post\'s': ['admin', 'rrhh']
            };
            
            // Permisos para botones específicos
            this.buttonPermissions = {
                'delete-pdf': ['admin', 'rrhh'],
                'update-pdf': ['admin'],
                // Agregar más botones según sea necesario
            };
            
            // Indexar la estructura del menú después de cargar la página
            this.indexMenuStructure();
        } catch (error) {
            console.error('Error al inicializar permisos:', error);
        }
    }
    
    // Método para indexar la estructura completa del menú
    indexMenuStructure() {
        this.menuPaths = {};
        const topLevelItems = document.querySelectorAll('.menu-level-1 > li');
        
        topLevelItems.forEach(topItem => {
            const topText = topItem.querySelector('.nav-text')?.textContent.trim();
            if (!topText) return;
            
            // Registrar ítem de nivel superior
            this.menuPaths[topItem.id || this.generateItemId(topItem)] = topText;
            
            // Procesar los submenús recursivamente
            this.processSubmenus(topItem, topText);
        });
        
        console.log('Estructura de menú indexada:', this.menuPaths);
    }
    
    // Procesar submenús recursivamente
    processSubmenus(parentItem, parentPath) {
        const submenus = parentItem.querySelectorAll(':scope > ul.submenu > li');
        
        submenus.forEach(submenuItem => {
            const itemText = submenuItem.querySelector(':scope > .nav-item > .nav-text')?.textContent.trim();
            if (!itemText) return;
            
            // Construir la ruta completa
            const fullPath = `${parentPath}/${itemText}`;
            
            // Registrar este ítem con su ruta completa
            const itemId = submenuItem.id || this.generateItemId(submenuItem);
            this.menuPaths[itemId] = fullPath;
            
            // Procesar recursivamente si tiene más submenús
            if (submenuItem.classList.contains('has-submenu')) {
                this.processSubmenus(submenuItem, fullPath);
            }
        });
    }
    
    // Generar ID único para elementos del menú
    generateItemId(element) {
        const id = `menu-item-${Math.random().toString(36).substring(2, 11)}`;
        element.id = id;
        return id;
    }
    
    // Obtener la ruta completa para un elemento de menú
    getMenuPathForElement(element) {
        // Construir la ruta del menú subiendo por el DOM
        let path = [];
        let current = element;
        
        // Subir en la jerarquía hasta encontrar el elemento de nivel superior
        while (current && !current.parentElement?.classList.contains('menu-level-1')) {
            // Solo considerar elementos que son ítems de menú
            if (current.classList.contains('has-submenu') || 
               (current.parentElement?.classList.contains('submenu') && !current.classList.contains('submenu'))) {
                const text = current.querySelector(':scope > .nav-item > .nav-text')?.textContent.trim();
                if (text) path.unshift(text);
            }
            current = current.parentElement;
        }
        
        // Añadir el elemento de nivel superior si existe
        if (current) {
            const text = current.querySelector(':scope > .nav-item > .nav-text')?.textContent.trim();
            if (text) path.unshift(text);
        }
        
        return path.join('/');
    }
    
    setUserRole(role) {
        this.userRole = role;
        console.log('Rol de usuario establecido:', role);
    }
    
    // Verificar si un usuario tiene acceso a un menú/submenú específico
    hasAccess(menuPath) {
        if (!this.userRole) return false;
        
        // Admin siempre tiene acceso completo
        if (this.userRole.toLowerCase() === 'admin') return true;
        
        // Verificar permisos para esta ruta específica
        const allowedRoles = this.permissions[menuPath] || [];
        if (allowedRoles.includes(this.userRole.toLowerCase())) {
            return true;
        }
        
        // Si no hay permisos específicos, comprobar si hay permisos heredados 
        // (comprobar cada nivel superior de la jerarquía)
        const pathParts = menuPath.split('/');
        
        // Eliminar el último componente y comprobar el nivel superior
        while (pathParts.length > 1) {
            pathParts.pop();
            const parentPath = pathParts.join('/');
            const parentRoles = this.permissions[parentPath] || [];
            
            // Si el rol tiene acceso explícito al nivel superior
            if (parentRoles.includes(this.userRole.toLowerCase())) {
                // Y NO tiene denegación explícita al nivel actual
                if (!this.permissions[menuPath] || 
                    this.permissions[menuPath].length === 0) {
                    return true;
                }
            }
        }
        
        // Sin acceso
        return false;
    }
    
    // Método para verificar acceso a un botón específico
    hasButtonAccess(buttonId) {
        if (!this.userRole) return false;
        
        // Admin siempre tiene acceso completo
        if (this.userRole.toLowerCase() === 'admin') return true;
        
        // Verificar permisos para este botón específico
        const allowedRoles = this.buttonPermissions[buttonId] || [];
        return allowedRoles.includes(this.userRole.toLowerCase());
    }
    
    // Aplicar permisos a todos los botones marcados en la página
    applyButtonPermissions() {
        // Buscar todos los botones con el atributo data-permission-id
        const permissionButtons = document.querySelectorAll('[data-permission-id]');
        
        console.log(`Aplicando permisos a ${permissionButtons.length} botones`);
        
        permissionButtons.forEach(button => {
            const buttonId = button.getAttribute('data-permission-id');
            if (buttonId) {
                const hasAccess = this.hasButtonAccess(buttonId);
                
                if (hasAccess) {
                    // CAMBIO CLAVE: Ahora AÑADIMOS la clase si tiene acceso
                    button.classList.add('permission-granted');
                } else {
                    // Botones sin acceso permanecen ocultos (CSS por defecto)
                    console.log(`Botón ${buttonId} permanece oculto para el rol ${this.userRole}`);
                }
            }
        });
    }
    
    // Aplicar permisos a todos los niveles del menú
    applyMenuPermissions() {
        // Primero procesar elementos de nivel superior
        const topLevelItems = document.querySelectorAll('.menu-level-1 > li');
        
        topLevelItems.forEach(item => {
            const menuText = item.querySelector('.nav-text')?.textContent.trim();
            if (!menuText) return;
            
            if (!this.hasAccess(menuText)) {
                // No tiene acceso al menú principal
                item.style.display = 'none';
                console.log(`Menú oculto: ${menuText} (rol: ${this.userRole})`);
            } else {
                // Tiene acceso al menú principal
                item.style.display = '';
                console.log(`Menú visible: ${menuText} (rol: ${this.userRole})`);
                
                // Procesar submenús recursivamente
                this.processMenuItemPermissions(item, menuText);
            }
        });
        
        // Además, aplicar permisos a los botones
        this.applyButtonPermissions();
    }
    
    // Procesar permisos de un elemento de menú y sus hijos recursivamente
    processMenuItemPermissions(menuItem, parentPath) {
        // Obtener todos los submenús directos
        const submenus = menuItem.querySelectorAll(':scope > ul.submenu > li');
        
        submenus.forEach(submenuItem => {
            const itemText = submenuItem.querySelector(':scope > .nav-item > .nav-text')?.textContent.trim();
            if (!itemText) return;
            
            // Construir la ruta completa para este ítem
            const fullPath = `${parentPath}/${itemText}`;
            
            if (!this.hasAccess(fullPath)) {
                // No tiene acceso a este submenú
                submenuItem.style.display = 'none';
                console.log(`Submenú oculto: ${fullPath} (rol: ${this.userRole})`);
            } else {
                // Tiene acceso a este submenú
                submenuItem.style.display = '';
                console.log(`Submenú visible: ${fullPath} (rol: ${this.userRole})`);
                
                // Procesar recursivamente si tiene más submenús
                if (submenuItem.classList.contains('has-submenu')) {
                    this.processMenuItemPermissions(submenuItem, fullPath);
                }
            }
        });
    }
}

// Crear instancia global
window.menuAccessManager = new MenuAccessManager();