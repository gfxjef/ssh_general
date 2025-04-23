// Script para la página de visualización de posts
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let allPosts = [];
    let filteredPosts = [];
    let currentPage = 1;
    const postsPerPage = 6;
    
    // Referencias DOM
    const postsContainer = document.getElementById('posts-container');
    const loadMoreBtn = document.getElementById('load-more');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const tagFilter = document.getElementById('tag-filter');
    const sortOptions = document.getElementById('sort-options');
    const activeFiltersContainer = document.getElementById('active-filters');
    const emptyState = document.getElementById('empty-state');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Filtros activos
    let activeFilters = {
        search: '',
        category: '',
        tag: '',
        sort: 'newest'
    };
    
    // Inicializar
    init();
    
    // Función de inicialización
    function init() {
        loadPosts();
        setupEventListeners();
    }
    
    // Cargar datos de posts
    async function loadPosts() {
        try {
            // Estado de carga
            postsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando posts...</p>
                </div>
            `;
              // Obtener datos del servidor
             const response = await fetch(AppConfig.getFullPath('/api/posts/published'));
            
            if (!response.ok) {
                throw new Error('Error al cargar los posts');
            }
            
            const data = await response.json();
            allPosts = data.posts || [];
            
            // Aplicar filtros iniciales
            filterAndRenderPosts();
            
        } catch (error) {
            console.error('Error:', error);
            postsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger" role="alert">
                        Error al cargar los posts. Por favor, intente nuevamente.
                    </div>
                </div>
            `;
        }
    }
    
    // Configurar listeners de eventos
    function setupEventListeners() {
        // Evento de búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.trim();
                activeFilters.search = searchTerm;
                resetPagination();
                filterAndRenderPosts();
                updateActiveFiltersUI();
            });
        }
        
        // Evento de filtro por categoría
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                activeFilters.category = this.value;
                resetPagination();
                filterAndRenderPosts();
                updateActiveFiltersUI();
            });
        }
        
        // Evento de filtro por etiqueta
        if (tagFilter) {
            tagFilter.addEventListener('change', function() {
                activeFilters.tag = this.value;
                resetPagination();
                filterAndRenderPosts();
                updateActiveFiltersUI();
            });
        }
        
        // Evento de ordenamiento
        if (sortOptions) {
            sortOptions.addEventListener('change', function() {
                activeFilters.sort = this.value;
                resetPagination();
                filterAndRenderPosts();
                updateActiveFiltersUI();
            });
        }
        
        // Evento de cargar más
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
                currentPage++;
                renderPosts();
                updatePaginationControls();
            });
        }
        
        // Evento de limpiar filtros
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
        }
    }
    
    // Actualizar UI de filtros activos
    function updateActiveFiltersUI() {
        if (!activeFiltersContainer) return;
        
        const filtersHTML = [];
        let hasActiveFilters = false;
        
        // Verificar si hay filtros activos
        if (activeFilters.search) {
            filtersHTML.push(`
                <div class="badge bg-light text-dark p-2">
                    Búsqueda: ${activeFilters.search}
                    <button type="button" class="btn-close btn-close-sm filter-remove" data-filter="search" aria-label="Quitar filtro"></button>
                </div>
            `);
            hasActiveFilters = true;
        }
        
        if (activeFilters.category) {
            const categoryText = categoryFilter.options[categoryFilter.selectedIndex].text;
            filtersHTML.push(`
                <div class="badge bg-light text-dark p-2">
                    Categoría: ${categoryText}
                    <button type="button" class="btn-close btn-close-sm filter-remove" data-filter="category" aria-label="Quitar filtro"></button>
                </div>
            `);
            hasActiveFilters = true;
        }
        
        if (activeFilters.tag) {
            const tagText = tagFilter.options[tagFilter.selectedIndex].text;
            filtersHTML.push(`
                <div class="badge bg-light text-dark p-2">
                    Etiqueta: ${tagText}
                    <button type="button" class="btn-close btn-close-sm filter-remove" data-filter="tag" aria-label="Quitar filtro"></button>
                </div>
            `);
            hasActiveFilters = true;
        }
        
        // Actualizar UI
        if (hasActiveFilters) {
            activeFiltersContainer.querySelector('.d-flex').innerHTML = filtersHTML.join('');
            activeFiltersContainer.style.display = 'block';
            
            // Agregar eventos a los botones de eliminar filtro
            document.querySelectorAll('.filter-remove').forEach(btn => {
                btn.addEventListener('click', function() {
                    const filterType = this.getAttribute('data-filter');
                    activeFilters[filterType] = '';
                    
                    // Actualizar UI de los selectores
                    if (filterType === 'category' && categoryFilter) {
                        categoryFilter.value = '';
                    } else if (filterType === 'tag' && tagFilter) {
                        tagFilter.value = '';
                    } else if (filterType === 'search' && searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Recargar posts
                    resetPagination();
                    filterAndRenderPosts();
                    // Actualizar UI de filtros activos
                    updateActiveFiltersUI();
                });
            });
        } else {
            // Ocultar contenedor si no hay filtros
            activeFiltersContainer.style.display = 'none';
        }
    }
    
    // Actualizar controles de paginación
    function updatePaginationControls() {
        if (!loadMoreBtn) return;
        
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        const hasMorePages = currentPage < totalPages;
        
        // Mostrar u ocultar botón según hay más páginas
        loadMoreBtn.style.display = hasMorePages ? 'block' : 'none';
    }
    
    // Filtrar y renderizar posts
    function filterAndRenderPosts() {
        // Aplicar filtros
        filteredPosts = allPosts.filter(post => {
            let matchesSearch = true;
            let matchesCategory = true;
            let matchesTag = true;
            
            // Filtrar por término de búsqueda
            if (activeFilters.search) {
                const searchTerm = activeFilters.search.toLowerCase();
                matchesSearch = 
                    post.title.toLowerCase().includes(searchTerm) || 
                    (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
                    (post.content && post.content.toLowerCase().includes(searchTerm));
            }
            
            // Filtrar por categoría
            if (activeFilters.category) {
                matchesCategory = post.category === activeFilters.category;
            }
            
            // Filtrar por etiqueta
            if (activeFilters.tag && post.tags) {
                matchesTag = post.tags.includes(activeFilters.tag);
            }
            
            return matchesSearch && matchesCategory && matchesTag;
        });
        
        // Ordenar posts
        sortPosts();
        
        // Renderizar posts
        renderPosts(true);
        
        // Actualizar controles de paginación
        updatePaginationControls();
        
        // Mostrar u ocultar estado vacío
        if (filteredPosts.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
    }
    
    // Ordenar posts según el criterio seleccionado
    function sortPosts() {
        switch(activeFilters.sort) {
            case 'newest':
                filteredPosts.sort((a, b) => new Date(b.created) - new Date(a.created));
                break;
            case 'oldest':
                filteredPosts.sort((a, b) => new Date(a.created) - new Date(b.created));
                break;
            case 'title':
                filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
    }
    
    // Renderizar posts
    function renderPosts(reset = false) {
        if (!postsContainer) return;
        
        // Si es un reseteo, limpiar el contenedor
        if (reset) {
            postsContainer.innerHTML = '';
        }
        
        // Calcular rango de posts a mostrar
        const startIndex = reset ? 0 : (currentPage - 1) * postsPerPage;
        const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length);
        const postsToRender = filteredPosts.slice(startIndex, endIndex);
        
        // Si no hay posts que mostrar y es un reseteo
        if (postsToRender.length === 0 && reset) {
            postsContainer.innerHTML = '';
            return;
        }
        
        // Crear HTML para cada post
        postsToRender.forEach(post => {
            const postHTML = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card post-card h-100">
                        ${post.cover_image ? `
                            <img src="${post.cover_image}" class="card-img-top" alt="${post.title}">
                        ` : ''}
                        <div class="card-body">
                            <div class="post-category mb-2 text-primary fw-bold">
                                ${getCategoryName(post.category)}
                            </div>
                            <h5 class="post-title">
                                <a href="${AppConfig.getFullPath('/bienestar/post-detail')}?id=${post.id}" class="text-decoration-none text-dark">
                                    ${post.title}
                                </a>
                            </h5>
                            <p class="post-excerpt">${post.excerpt || ''}</p>
                        </div>
                        <div class="card-footer bg-white border-0">
                            <div class="post-meta d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="far fa-calendar me-1"></i>
                                    ${formatDate(post.created)}
                                </small>
                                ${post.tags && post.tags.length ? `
                                    <div class="post-tags">
                                        ${renderTags(post.tags)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const postElement = document.createRange().createContextualFragment(postHTML);
            postsContainer.appendChild(postElement);
        });
    }
    
    // Obtener nombre de categoría a partir de su valor
    function getCategoryName(categoryValue) {
        if (!categoryValue) return 'Sin categoría';
        
        // Mapa de valores a nombres de categorías
        const categories = {
            'salud-mental': 'Salud Mental',
            'bienestar-fisico': 'Bienestar Físico',
            'desarrollo-profesional': 'Desarrollo Profesional',
            'clima-laboral': 'Clima Laboral',
            'reconocimientos': 'Reconocimientos'
        };
        
        return categories[categoryValue] || categoryValue;
    }
    
    // Renderizar etiquetas de un post
    function renderTags(tags) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return '';
        }
        
        // Limitar a máximo 2 etiquetas en la vista de tarjeta
        return tags.slice(0, 2).map(tag => `
            <span class="badge bg-light text-dark me-1">${tag}</span>
        `).join('');
    }
    
    // Limpiar todos los filtros
    function clearFilters() {
        // Resetear filtros
        activeFilters = {
            search: '',
            category: '',
            tag: '',
            sort: 'newest'
        };
        
        // Resetear controles
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (tagFilter) tagFilter.value = '';
        if (sortOptions) sortOptions.value = 'newest';
        
        // Actualizar UI
        resetPagination();
        filterAndRenderPosts();
        updateActiveFiltersUI();
    }
    
    // Resetear paginación
    function resetPagination() {
        currentPage = 1;
    }
});