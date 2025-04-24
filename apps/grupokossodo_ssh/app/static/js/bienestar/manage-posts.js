// Script para la página de administración de posts
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let allPosts = [];
    let filteredPosts = [];
    let currentPage = 1;
    const postsPerPage = 10;
    let deletePostId = null;
    let visibilityPostId = null;

    // Referencias DOM
    const tableBody = document.getElementById('posts-table-body');
    const adminSearch = document.getElementById('admin-search');
    const statusFilter = document.getElementById('status-filter');
    const visibilityFilter = document.getElementById('visibility-filter');
    const adminSort = document.getElementById('admin-sort');
    const pageNumbers = document.getElementById('admin-page-numbers');
    const prevPageBtn = document.getElementById('admin-prev-page');
    const nextPageBtn = document.getElementById('admin-next-page');
    
    // Modales
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const deleteModalClose = deleteModal.querySelector('.close');
    
    const visibilityModal = document.getElementById('visibility-modal');
    const saveVisibilityBtn = document.getElementById('save-visibility');
    const cancelVisibilityBtn = document.getElementById('cancel-visibility');
    const visibilityModalClose = visibilityModal.querySelector('.close');
    const visibilityRadios = document.querySelectorAll('input[name="visibility"]');
    const sedeSelect = document.getElementById('sede-select');
    const grupoSelect = document.getElementById('grupo-select');
    
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
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2 mb-0">Cargando posts...</p>
                    </td>
                </tr>
            `;
              // Obtener datos del servidor
            const response = await fetch(AppConfig.getFullPath('/api/posts'));
            
            if (!response.ok) {
                throw new Error('Error al cargar los posts');
            }
            
            const data = await response.json();
            allPosts = data.posts || [];
            
            // Aplicar filtros iniciales
            filterAndRenderPosts();
            
        } catch (error) {
            console.error('Error:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="alert alert-danger" role="alert">
                            Error al cargar los posts. Por favor, intente nuevamente.
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    

    
    // Configurar listeners de eventos
    function setupEventListeners() {
        // Filtro de búsqueda
        if (adminSearch) {
            adminSearch.addEventListener('input', function() {
                currentPage = 1;
                filterAndRenderPosts();
            });
        }
        
        // Filtro de estado
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                currentPage = 1;
                filterAndRenderPosts();
            });
        }
        
        // Filtro de visibilidad
        if (visibilityFilter) {
            visibilityFilter.addEventListener('change', function() {
                currentPage = 1;
                filterAndRenderPosts();
            });
        }
        
        // Ordenamiento
        if (adminSort) {
            adminSort.addEventListener('change', function() {
                filterAndRenderPosts();
            });
        }
        
        // Paginación
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderPosts();
                    updatePagination();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPosts();
                    updatePagination();
                }
            });
        }
        
        // Modal de eliminación
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        }
        
        if (deleteModalClose) {
            deleteModalClose.addEventListener('click', closeDeleteModal);
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', confirmDelete);
        }
        
        // Modal de visibilidad
        if (cancelVisibilityBtn) {
            cancelVisibilityBtn.addEventListener('click', closeVisibilityModal);
        }
        
        if (visibilityModalClose) {
            visibilityModalClose.addEventListener('click', closeVisibilityModal);
        }
        
        if (saveVisibilityBtn) {
            saveVisibilityBtn.addEventListener('click', saveVisibility);
        }
        
        // Cambiar opciones de visibilidad según selección
        visibilityRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const value = this.value;
                
                if (value === 'sede') {
                    sedeSelect.classList.remove('hidden');
                    grupoSelect.classList.add('hidden');
                } else if (value === 'grupo') {
                    sedeSelect.classList.add('hidden');
                    grupoSelect.classList.remove('hidden');
                } else {
                    sedeSelect.classList.add('hidden');
                    grupoSelect.classList.add('hidden');
                }
            });
        });
    }
    
    // Filtrar y renderizar posts
    function filterAndRenderPosts() {
        const searchTerm = adminSearch ? adminSearch.value.toLowerCase() : '';
        const statusVal = statusFilter ? statusFilter.value : '';
        const visibilityVal = visibilityFilter ? visibilityFilter.value : '';
        const sortVal = adminSort ? adminSort.value : 'newest';
        
        // Aplicar filtros
        filteredPosts = allPosts.filter(post => {
            // Filtrar por término de búsqueda
            const matchesSearch = !searchTerm || 
                post.title.toLowerCase().includes(searchTerm) || 
                (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm));
            
            // Filtrar por estado
            const matchesStatus = !statusVal || post.status === statusVal;
            
            // Filtrar por visibilidad
            const matchesVisibility = !visibilityVal || post.visibility === visibilityVal;
            
            return matchesSearch && matchesStatus && matchesVisibility;
        });
        
        // Ordenar posts
        switch(sortVal) {
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
        
        renderPosts();
        updatePagination();
    }
    
    // Renderizar los posts en la tabla
    function renderPosts() {
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length);
        
        if (filteredPosts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="text-muted">No se encontraron posts que coincidan con los criterios de búsqueda.</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        for (let i = startIndex; i < endIndex; i++) {
            const post = filteredPosts[i];
            
            // Formatear fecha
            const created = new Date(post.created);
            const formattedDate = created.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // Traducir estado y visibilidad
            const statusMap = {
                'published': 'Publicado',
                'draft': 'Borrador'
            };
            
            const visibilityMap = {
                'public': 'Público',
                'sede': 'Por sede',
                'grupo': 'Por grupo'
            };
            
            const statusDisplay = statusMap[post.status] || post.status;
            const visibilityDisplay = visibilityMap[post.visibility] || post.visibility;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="title-cell">
                    <a href="${AppConfig.getFullPath('/bienestar/post-detail')}?id=${post.id}" class="text-decoration-none">
                        ${post.title}
                    </a>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge ${post.status}">
                        ${statusDisplay}
                    </span>
                </td>
                <td>${visibilityDisplay}</td>
                <td class="text-end">
                    <div>
                        <button class="action-btn edit-btn" title="Editar" data-id="${post.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn status-btn" title="Cambiar estado" data-id="${post.id}" data-status="${post.status}">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="action-btn visibility-btn" title="Cambiar visibilidad" data-id="${post.id}" data-visibility="${post.visibility}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Eliminar" data-id="${post.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Agregar eventos a los botones de acciones
            tableBody.appendChild(row);
        }
        
        // Añadir eventos después de renderizar
        addActionButtonsEvents();
    }
    
    // Actualizar paginación
    function updatePagination() {
        if (!pageNumbers || !prevPageBtn || !nextPageBtn) return;
        
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        
        // Habilitar/deshabilitar botones de navegación
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        // Generar números de página
        pageNumbers.innerHTML = '';
        
        // Determinar qué páginas mostrar (máx 5)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4 && totalPages > 5) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageNumber = document.createElement('div');
            pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            
            pageNumber.addEventListener('click', function() {
                if (i !== currentPage) {
                    currentPage = i;
                    renderPosts();
                    updatePagination();
                }
            });
            
            pageNumbers.appendChild(pageNumber);
        }
    }
    
    // Añadir eventos a los botones de acción de cada fila
    function addActionButtonsEvents() {
        // Botones de editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.getAttribute('data-id');
                window.location.href = AppConfig.getFullPath(`/bienestar/post-editor?id=${postId}`);
            });
        });
        
        // Botones de eliminar
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.getAttribute('data-id');
                openDeleteModal(postId);
            });
        });
        
        // Botones de cambiar estado
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.getAttribute('data-id');
                const currentStatus = this.getAttribute('data-status');
                const newStatus = currentStatus === 'published' ? 'draft' : 'published';
                updatePostStatus(postId, newStatus);
            });
        });
        
        // Botones de cambiar visibilidad
        document.querySelectorAll('.visibility-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const postId = this.getAttribute('data-id');
                const currentVisibility = this.getAttribute('data-visibility');
                openVisibilityModal(postId, currentVisibility);
            });
        });
    }
    
    // Abrir modal de eliminación
    function openDeleteModal(postId) {
        deletePostId = postId;
        deleteModal.style.display = 'block';
    }
    
    // Cerrar modal de eliminación
    function closeDeleteModal() {
        deletePostId = null;
        deleteModal.style.display = 'none';
    }
    
    // Confirmar eliminación de post
    async function confirmDelete() {
        if (!deletePostId) return;
        
        try {
            const response = await fetch(`${AppConfig.getFullPath('/api/posts/delete')}/${deletePostId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar el post');
            }
            
            // Cerrar modal y recargar posts
            closeDeleteModal();
            loadPosts();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el post. Por favor, intente nuevamente.');
        }
    }
    
    // Abrir modal de visibilidad
    function openVisibilityModal(postId, currentVisibility) {
        visibilityPostId = postId;
        
        // Seleccionar la opción actual
        document.querySelectorAll('input[name="visibility"]').forEach(radio => {
            radio.checked = radio.value === currentVisibility;
        });
        
        // Mostrar/ocultar selectores según visibilidad actual
        if (currentVisibility === 'sede') {
            sedeSelect.classList.remove('hidden');
            grupoSelect.classList.add('hidden');
        } else if (currentVisibility === 'grupo') {
            sedeSelect.classList.add('hidden');
            grupoSelect.classList.remove('hidden');
        } else {
            sedeSelect.classList.add('hidden');
            grupoSelect.classList.add('hidden');
        }
        
        // Mostrar modal
        visibilityModal.style.display = 'block';
    }
    
    // Cerrar modal de visibilidad
    function closeVisibilityModal() {
        visibilityPostId = null;
        visibilityModal.style.display = 'none';
    }
    
    // Guardar cambios de visibilidad
    async function saveVisibility() {
        if (!visibilityPostId) return;
        
        const selectedVisibility = document.querySelector('input[name="visibility"]:checked').value;
        let targetGroup = null;
        
        if (selectedVisibility === 'sede') {
            targetGroup = document.getElementById('sede-option').value;
        } else if (selectedVisibility === 'grupo') {
            targetGroup = document.getElementById('grupo-option').value;
        }
        
        try {
            // Buscar el post actual para modificar solo la visibilidad
            const post = allPosts.find(p => p.id === visibilityPostId);
            
            if (!post) {
                throw new Error('Post no encontrado');
            }
            
            // Preparar datos de actualización
            post.visibility = selectedVisibility;
            if (targetGroup) {
                post.targetGroup = targetGroup;
            } else {
                delete post.targetGroup;
            }
            
            // Enviar actualización al servidor
            const response = await fetch(`${AppConfig.getFullPath('/api/posts/save')}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(post),
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar la visibilidad');
            }
            
            // Cerrar modal y recargar posts
            closeVisibilityModal();
            loadPosts();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar la visibilidad. Por favor, intente nuevamente.');
        }
    }
    
    // Actualizar estado de un post
    async function updatePostStatus(postId, newStatus) {
        try {
            const response = await fetch(`${AppConfig.getFullPath('/api/posts/update-status')}/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar el estado');
            }
            
            // Recargar posts
            loadPosts();
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar el estado. Por favor, intente nuevamente.');
        }
    }
});