async function loadHeader() {
    const headerContainer = document.getElementById('headerContainer');
    if (!headerContainer) {
        console.error('Header container not found');
        return Promise.reject('Header container not found');
    }
    try {
        const response = await fetch(AppConfig.getFullPath('/static/assets/components/header/header.html'));
        if (!response.ok) {
            throw new Error('Failed to load header HTML: ' + response.status);
        }
        const html = await response.text();
        headerContainer.innerHTML = html;
        console.log('Header loaded successfully.');

        // --- Cargar datos de usuario en el Header ---
        const userNameSpan = document.getElementById('userName');
        const userRoleSpan = document.getElementById('userRole');
        const userData = JSON.parse(sessionStorage.getItem('userData'));

        if (userData) {
            console.log('Datos de usuario:', userData);
            if (userNameSpan) {
                userNameSpan.textContent = userData.nombre || 'Usuario';
            }
            if (userRoleSpan) {
                userRoleSpan.textContent = userData.cargo || 'Rol Desconocido';
            }
        } else {
             // Manejar caso donde no hay datos de usuario
             if (userNameSpan) userNameSpan.textContent = 'Invitado';
             if (userRoleSpan) userRoleSpan.textContent = 'Sin sesión';
        }

        // Configurar abrir/cerrar resultados de búsqueda al escribir
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', function() {
                if (this.value.length > 0) {
                    searchResults.classList.add('visible');
                } else {
                    searchResults.classList.remove('visible');
                }
            });
            
            // Cerrar resultados cuando se hace clic fuera
            document.addEventListener('click', function(e) {
                if (e.target !== searchInput && !searchResults.contains(e.target)) {
                    searchResults.classList.remove('visible');
                }
            });
        }

        // Configurar el icono de búsqueda
        setupSearchIcon();

        return Promise.resolve();
    } catch (error) {
        console.error('Error loading header:', error);
        headerContainer.innerHTML = '<p>Error loading header</p>';
        return Promise.reject(error);
    }
}

// Añadir esta función después de cargar el header

function setupSearchIcon() {
    const searchToggle = document.getElementById('masthead-search-toggle');
    const searchIndicator = document.querySelector('.masthead-search-indicator');
    
    if (searchToggle && searchIndicator) {
        searchToggle.addEventListener('change', function() {
            if (this.checked) {
                // Cambia a icono X
                searchIndicator.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="search-icon-svg">
                        <circle cx="12" cy="12" r="11.5" fill="#3498db" />
                        <g fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
                            <line x1="8" y1="8" x2="16" y2="16"></line>
                            <line x1="16" y1="8" x2="8" y2="16"></line>
                        </g>
                    </svg>
                `;
            } else {
                // Vuelve al icono de búsqueda
                searchIndicator.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" class="search-icon-svg" style="overflow: visible;">
                        <circle cx="12" cy="12" r="14" fill="#3498db" />
                        <g transform="translate(1 1)" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </g>
                    </svg>
                `;
            }
        });
    }
}