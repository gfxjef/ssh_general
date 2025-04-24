// loadHeader.js

/**
 * Carga dinámicamente el HTML del header,
 * inicializa búsqueda, datos de usuario y el toggle del sidebar.
 */
async function loadHeader() {
  const headerContainer = document.getElementById('headerContainer');
  if (!headerContainer) {
    console.error('Header container not found');
    return Promise.reject('Header container not found');
  }

  try {
    // 1) Traer el fragmento HTML del header
    const response = await fetch(AppConfig.getFullPath(
      '/static/assets/components/header/header.html'
    ));
    if (!response.ok) {
      throw new Error('Failed to load header HTML: ' + response.status);
    }
    const html = await response.text();

    // 2) Inyectarlo en el DOM
    headerContainer.innerHTML = html;
    console.log('Header loaded successfully.');

    // 3) Rellenar datos de usuario
    const userNameSpan = document.getElementById('userName');
    const userRoleSpan = document.getElementById('userRole');
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (userData) {
      if (userNameSpan) userNameSpan.textContent = userData.nombre || 'Usuario';
      if (userRoleSpan) userRoleSpan.textContent = userData.cargo  || 'Rol Desconocido';
    } else {
      if (userNameSpan) userNameSpan.textContent = 'Invitado';
      if (userRoleSpan) userRoleSpan.textContent = 'Sin sesión';
    }

    // 4) Inicializar buscador
    const searchInput   = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    if (searchInput && searchResults) {
      searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
          searchResults.classList.add('visible');
        } else {
          searchResults.classList.remove('visible');
        }
      });
      document.addEventListener('click', (e) => {
        if (e.target !== searchInput && !searchResults.contains(e.target)) {
          searchResults.classList.remove('visible');
        }
      });
    }

    // 5) Configurar icono de búsqueda (lupa ↔︎ X)
    setupSearchIcon();

    // 6) Toggle hamburguesa ↔ sidebar
    const menuBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebarContainer');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
      });
    }

    return Promise.resolve();
  } catch (error) {
    console.error('Error loading header:', error);
    headerContainer.innerHTML = '<p>Error loading header</p>';
    return Promise.reject(error);
  }
}

/**
 * Cambia el SVG de búsqueda entre lupa y aspa (X).
 */
function setupSearchIcon() {
  const searchToggle    = document.getElementById('masthead-search-toggle');
  const searchIndicator = document.querySelector('.masthead-search-indicator');

  if (!searchToggle || !searchIndicator) return;

  searchToggle.addEventListener('change', function() {
    if (this.checked) {
      // Mostrar aspa (X)
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
      // Volver a lupa
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

// Exporta la función si usas módulos (opcional)
// export { loadHeader };
