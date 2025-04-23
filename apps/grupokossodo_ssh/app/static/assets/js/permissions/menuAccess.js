// Gestor de acceso a menús basado en roles de usuario
class MenuAccessManager {
    constructor() {
        this.permissions = {};
        this.userRole = null;
    }
    
    // Inicializar cargando los permisos
    async initialize() {
        try {
            // Simular carga de permisos (aquí podrías hacer un fetch a una API)
            this.permissions = {
                // Por defecto, todos pueden ver Marketing
                'Marketing': ['admin', 'gerente', 'vendedor', 'almacen'],
                
                // Sólo admin y gerente pueden ver Inventario
                'Inventario': ['admin', 'gerente', 'almacen'],
                
                // Sólo admin y vendedores pueden ver Ventas
                'Ventas': ['admin', 'gerente', 'vendedor'],
                
                // Bienestar de Talento solo para admin y gerente
                'Bienestar de Talento': ['admin', 'gerente'],
                
                // Seguimiento para todos
                'Seguimiento de Pedidos': ['admin', 'gerente', 'vendedor', 'almacen']
            };
            
            console.log('Permisos de menú cargados');
            return Promise.resolve();
        } catch (error) {
            console.error('Error al cargar permisos:', error);
            return Promise.reject(error);
        }
    }
    
    // Establecer el rol del usuario actual
    setUserRole(role) {
        this.userRole = role;
        console.log('Rol de usuario establecido:', role);
    }
    
    // Verificar si un usuario tiene acceso a una sección
    hasAccess(sectionName) {
        if (!this.userRole) return false;
        
        // Si el usuario es admin, tiene acceso a todo
        if (this.userRole.toLowerCase() === 'admin') return true;
        
        // Verificar en la lista de permisos
        const allowedRoles = this.permissions[sectionName] || [];
        return allowedRoles.includes(this.userRole.toLowerCase());
    }
    
    // Aplicar permisos al menú (ocultar elementos no permitidos)
    applyMenuPermissions() {
        // Seleccionar todos los ítems de menú de primer nivel
        const topLevelItems = document.querySelectorAll('.menu-level-1 > li');

        topLevelItems.forEach(item => {
            const menuText = item.querySelector('.nav-text')?.textContent.trim();

            if (menuText) {
                if (!this.hasAccess(menuText)) {
                    // No tiene acceso, ocultar el elemento
                    console.log(`Elemento de menú oculto: ${menuText} (rol: ${this.userRole})`);
                } else {
                    // Tiene acceso, mostrar el elemento
                    item.style.display = '';
                    console.log(`Elemento de menú visible: ${menuText} (rol: ${this.userRole})`);
                }
            }
        });
    }
}

// Crear instancia global
window.menuAccessManager = new MenuAccessManager();
