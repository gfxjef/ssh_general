document.addEventListener('DOMContentLoaded', async () => { // Hacer la función async
    const sidebarContainer = document.getElementById('sidebarContainer');
    let searchInstance = null;

    try {
        // 1. Esperar a que el header se cargue PRIMERO
        await loadHeader(); // Llama y espera a que la promesa de loadHeader se resuelva

        // 2. Ahora que el header está cargado, inicializar Search
        if (typeof Search !== 'undefined') {
            searchInstance = new Search(); // Ahora #searchInput y #searchResults existen
        } else {
            console.error("Search class not defined.");
        }

        // 3. Cargar el contenido del Sidebar (y su JS si es necesario)
        if (sidebarContainer) {
            if (typeof Sidebar === 'undefined') {                const script = document.createElement('script');
                script.src = AppConfig.getFullPath('/static/assets/js/sidebar_improved.js');
                script.onload = () => loadSidebarContent(searchInstance); // Pasar searchInstance
                script.onerror = () => console.error("Failed to load sidebar.js");
                document.head.appendChild(script);
            } else {
                loadSidebarContent(searchInstance); // Pasar searchInstance
            }
        }

    } catch (headerError) {
        console.error("Failed to initialize page due to header loading error:", headerError);
        // Mostrar un error general si el header falla
        if (sidebarContainer) sidebarContainer.innerHTML = '<p>Error initializing page components.</p>';
    }
});

// Función para cargar el contenido del sidebar y luego indexar para búsqueda
function loadSidebarContent(searchInstance) { // Recibe searchInstance
    const sidebarContainer = document.getElementById('sidebarContainer'); // Obtener de nuevo por si acaso
    
    if (!sidebarContainer) {
        console.error("No se encontró el contenedor del sidebar (#sidebarContainer)");
        return;
    }

    console.log("Intentando cargar el sidebar...");
    
    // Primero cargar e inicializar el sistema de permisos si no está ya cargado
    const loadPermissionsSystem = async () => {
        if (typeof menuAccessManager === 'undefined') {
            // Cargar el script de gestión de permisos
            console.log("Cargando sistema de permisos...");
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = AppConfig.getFullPath('/static/assets/js/permissions/menuAccess.js');
                script.onload = () => {
                    console.log("Sistema de permisos cargado exitosamente");
                    resolve();
                };
                script.onerror = (err) => {
                    console.error("Error al cargar sistema de permisos:", err);
                    reject(err);
                };
                document.head.appendChild(script);
            });
        }
        console.log("Sistema de permisos ya está cargado");
        return Promise.resolve();
    };
    
    // URL donde se encuentra el HTML del sidebar
    const sidebarUrl = '/static/assets/components/sidebar/sidebar.html';
    console.log("Preparando para cargar sidebar desde:", sidebarUrl);
    
    // Cargar el sistema de permisos y luego el contenido del sidebar
    loadPermissionsSystem()
        .then(() => {
            console.log("Realizando fetch del sidebar:", AppConfig.getFullPath(sidebarUrl));
            return fetch(AppConfig.getFullPath(sidebarUrl));
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to load sidebar HTML: ' + response.status);
            console.log("Respuesta sidebar recibida correctamente:", response.status);
            return response.text();
        })        .then(async html => {
            console.log("Contenido HTML del sidebar recibido, longitud:", html.length);
            console.log("Primeras 100 caracteres del HTML:", html.substring(0, 100));
            
            // Insertar el HTML en el contenedor
            sidebarContainer.innerHTML = html;
            console.log("HTML insertado en el contenedor del sidebar");
            
            // Inicializar el gestor de acceso a menús
            if (window.menuAccessManager) {
                console.log("Iniciando menuAccessManager...");
                await menuAccessManager.initialize();
                
                // Obtener el rol del usuario de sessionStorage
                const userDataString = sessionStorage.getItem('userData');
                console.log("Datos de usuario en sessionStorage:", userDataString ? "Encontrados" : "No encontrados");
                
                if (userDataString) {
                    try {
                        const userData = JSON.parse(userDataString);
                        console.log("Datos de usuario parseados:", userData);
                        
                        const userRole = userData.cargo || null;
                        console.log("Rol del usuario:", userRole);
                        
                        if (userRole) {
                            menuAccessManager.setUserRole(userRole);
                            // Aplicar permisos al menú según el rol
                            console.log("Aplicando permisos al menú...");
                            menuAccessManager.applyMenuPermissions();
                        } else {
                            console.warn('El usuario no tiene un rol definido (cargo)');
                        }
                    } catch (e) {
                        console.error('Error al procesar datos de usuario:', e);
                    }
                } else {
                    console.warn('No hay datos de usuario en sessionStorage');
                }
            } else {
                console.error("menuAccessManager no está disponible");
            }

            // Inicializar la funcionalidad del Sidebar (clase Sidebar)
            if (typeof Sidebar !== 'undefined') {
                new Sidebar();
            } else {
                console.error("Sidebar class is not defined even after attempting load.");
            }

            // Pedir a la instancia de Search que cargue los menús
            if (searchInstance && typeof searchInstance.loadMenuItems === 'function') {
                // No necesita setTimeout si estamos seguros que el DOM está listo
                searchInstance.loadMenuItems();
            } else {
                 console.error("Search instance or loadMenuItems method not available.");
            }

            // Fix all URLs in the sidebar to include base path
            const sidebarLinks = sidebarContainer.querySelectorAll('a.nav-item');
            sidebarLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/') && !href.startsWith('/grupokossodo_ssh') && !href.startsWith('/static/')) {
                    link.setAttribute('href', AppConfig.getFullPath(href));
                }
            });

            console.log("Updated sidebar links with correct base path");
        })
        .catch(error => {
            console.error('Error loading sidebar content:', error);
            sidebarContainer.innerHTML = '<p>Error loading sidebar</p>';
        });
}

    // al final de loadSidebar.js, justo antes de cerrar el addEventListener('DOMContentLoaded', ...)
    const toggleBtn = document.querySelector('#menu-toggle-btn');
    if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        document.getElementById('sidebarContainer').classList.toggle('show');
    });
    }
