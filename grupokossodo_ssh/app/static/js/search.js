class Search {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.menuItems = [];
        
        // Inicializar solo si los elementos existen
        if (this.searchInput && this.searchResults) {
            this.initialize();
        } else {
            console.error('Search elements not found in DOM');
        }
    }
    
    initialize() {
        // Configurar event listeners para el input de búsqueda
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.searchInput.addEventListener('focus', () => {
            if (this.searchResults.children.length > 0) {
                this.searchResults.style.display = 'block';
            }
        });
        
        // Cerrar resultados cuando se hace clic fuera
        document.addEventListener('click', (e) => {
            if (e.target !== this.searchInput && e.target !== this.searchResults) {
                this.searchResults.style.display = 'none';
            }
        });
    }
    
    // Método para cargar elementos del menú para la búsqueda
    loadMenuItems() {
        // Seleccionar todos los enlaces del menú
        const menuLinks = document.querySelectorAll('.sidebar-nav a.nav-item');
        
        this.menuItems = Array.from(menuLinks).map(link => {
            // Obtener el texto del menú
            const text = link.querySelector('.nav-text')?.textContent || '';
            // Crear un objeto con información relevante
            return {
                text: text.trim(),
                url: link.getAttribute('href') || '#',
                element: link,
                parent: this.getMenuParents(link)
            };
        }).filter(item => item.text && item.url !== '#'); // Filtrar elementos vacíos y sin URL
        
        console.log('Menú items cargados para búsqueda:', this.menuItems.length);
    }
    
    // Método auxiliar para obtener la jerarquía de padres de un elemento de menú
    getMenuParents(element) {
        const parents = [];
        let current = element.closest('li');
        
        while (current) {
            const parentMenu = current.closest('ul.submenu');
            if (!parentMenu) break;
            
            const parentLi = parentMenu.closest('li');
            if (!parentLi) break;
            
            const parentText = parentLi.querySelector(':scope > a > .nav-text')?.textContent;
            if (parentText) {
                parents.unshift(parentText.trim());
            }
            
            current = parentLi;
        }
        
        return parents;
    }
    
    // Manejar el evento de input en la búsqueda
    handleSearchInput(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            this.searchResults.innerHTML = '';
            this.searchResults.style.display = 'none';
            return;
        }
        
        // Buscar coincidencias
        const matches = this.findMatches(query);
        this.displayResults(matches);
    }
    
    // Encontrar coincidencias en los elementos del menú
    findMatches(query) {
        if (!query || !this.menuItems.length) return [];
        
        return this.menuItems.filter(item => {
            // Buscar en el texto del menú
            if (item.text.toLowerCase().includes(query)) return true;
            
            // Buscar en los padres del menú
            if (item.parent.some(parent => parent.toLowerCase().includes(query))) return true;
            
            return false;
        }).slice(0, 8); // Limitar a 8 resultados
    }
    
    // Mostrar los resultados en el DOM
    displayResults(results) {
        this.searchResults.innerHTML = '';
        
        if (!results.length) {
            this.searchResults.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
            this.searchResults.style.display = 'block';
            return;
        }
        
        results.forEach(item => {
            const resultItem = document.createElement('a');
            resultItem.href = item.url;
            resultItem.className = 'search-result-item';
            
            // Crear breadcrumb para la jerarquía
            let breadcrumb = '';
            if (item.parent.length) {
                breadcrumb = `<span class="result-path">${item.parent.join(' > ')}</span>`;
            }
            
            resultItem.innerHTML = `
                ${breadcrumb}
                <span class="result-text">${item.text}</span>
            `;
            
            resultItem.addEventListener('click', () => {
                this.searchResults.style.display = 'none';
            });
            
            this.searchResults.appendChild(resultItem);
        });
        
        this.searchResults.style.display = 'block';
    }
}
