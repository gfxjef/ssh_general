// Script para el editor de posts
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let editorInstance = null;
    let currentPostId = null;
    let isEditMode = false;
    let imageBase64 = null;
    
    // Referencias DOM
    const postForm = document.getElementById('postForm');
    const postTitle = document.getElementById('postTitle');
    const postCategory = document.getElementById('postCategory');
    const postTags = document.getElementById('postTags');
    const postExcerpt = document.getElementById('postExcerpt');
    const postContent = document.getElementById('postContent');
    const postStatus = document.getElementById('postStatus');
    const postVisibility = document.getElementById('postVisibility');
    const featuredImage = document.getElementById('featuredImage');
    const removeImageBtn = document.getElementById('removeImage');
    const imagePreview = document.getElementById('imagePreview');
    const formTitle = document.getElementById('form-title');
    
    // Selectores adicionales
    const sedeOptions = document.getElementById('sedeOptions');
    const grupoOptions = document.getElementById('grupoOptions');
    const postSede = document.getElementById('postSede');
    const postGrupo = document.getElementById('postGrupo');
    
    // Botones
    const btnSave = document.getElementById('btnSave');
    const btnSaveDraft = document.getElementById('btnSaveDraft');
    const btnPublish = document.getElementById('btnPublish');
    const btnCancel = document.getElementById('btnCancel');
    const btnPreview = document.getElementById('btnPreview');
    
    // Obtener ID del post desde campo oculto
    const postIdField = document.getElementById('postId');
    if (postIdField && postIdField.value) {
        currentPostId = postIdField.value;
        isEditMode = true;
    }
    
    // Inicialización
    init();
    
    // Función de inicialización
    function init() {
        initSummernote();
        initSelect2();
        setupEventListeners();
        
        if (isEditMode) {
            loadPostData(currentPostId);
            if (formTitle) formTitle.textContent = 'Editar Post';
        }
    }
    
    // Inicializar el editor Summernote
    function initSummernote() {
        if (!postContent) return;
        
        editorInstance = $(postContent).summernote({
            height: 300,
            minHeight: 200,
            maxHeight: 500,
            focus: false,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'italic', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'video']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ],
            callbacks: {
                onImageUpload: function(files) {
                    // Process each file
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        
                        // Check file size (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                            alert('La imagen es demasiado grande. Máximo 2MB.');
                            continue;
                        }
                        
                        // Check file type
                        if (!file.type.match('image.*')) {
                            alert('El archivo debe ser una imagen.');
                            continue;
                        }
                        
                        // Read file and convert to base64
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const imgBase64 = e.target.result;
                            // Insert the image in the editor
                            $(postContent).summernote('editor.insertImage', imgBase64);
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        });
    }
    
    // Inicializar el selector de etiquetas (Select2)
    function initSelect2() {
        if (!postTags) return;
        
        $(postTags).select2({
            tags: true,
            tokenSeparators: [','],
            placeholder: 'Seleccionar o crear etiquetas',
            allowClear: true
        });
    }
    
    // Configurar listeners de eventos
    function setupEventListeners() {
        // Envío del formulario
        if (postForm) {
            postForm.addEventListener('submit', function(e) {
                e.preventDefault();
                savePost();
            });
        }
        
        // Botón de guardar como borrador
        if (btnSaveDraft) {
            btnSaveDraft.addEventListener('click', function() {
                if (postStatus) postStatus.value = 'draft';
                savePost();
            });
        }
        
        // Botón de publicar
        if (btnPublish) {
            btnPublish.addEventListener('click', function() {
                if (postStatus) postStatus.value = 'published';
                savePost();
            });
        }
        
        // Botón de cancelar
        if (btnCancel) {
            btnCancel.addEventListener('click', function() {                if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
                    window.location.href = AppConfig.getFullPath('/bienestar/manage-posts');
                }
            });
        }
        
        // Botón de vista previa
        if (btnPreview) {
            btnPreview.addEventListener('click', showPreview);
        }
        
        // Manejo de imágenes
        if (featuredImage) {
            featuredImage.addEventListener('change', handleImageUpload);
        }
        
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', removeImage);
        }
        
        // Cambio de visibilidad
        if (postVisibility) {
            postVisibility.addEventListener('change', function() {
                updateVisibilityOptions(this.value);
            });
        }
    }
    
    // Cargar datos del post para edición
    async function loadPostData(postId) {
        try {
            // Mostrar estado de carga
            document.body.classList.add('loading');
            
            // Cargar datos del post
            const response = await fetch(`${AppConfig.getFullPath('/api/posts')}/${postId}`);
            
            if (!response.ok) {
                throw new Error('No se pudo cargar el post');
            }
            
            const post = await response.json();
            
            // Llenar el formulario con los datos del post
            if (postTitle) postTitle.value = post.title || '';
            if (postCategory) postCategory.value = post.category || '';
            if (postExcerpt) postExcerpt.value = post.excerpt || '';
            if (postStatus) postStatus.value = post.status || 'draft';
            if (postVisibility) {
                postVisibility.value = post.visibility || 'public';
                updateVisibilityOptions(post.visibility);
            }
            
            // Llenar el editor de contenido
            if (editorInstance) {
                $(postContent).summernote('code', post.content || '');
            }
            
            // Llenar etiquetas con Select2
            if (postTags && post.tags && Array.isArray(post.tags)) {
                // Crear opciones para cada etiqueta si no existen
                post.tags.forEach(tag => {
                    if (!$(postTags).find(`option[value="${tag}"]`).length) {
                        $(postTags).append(new Option(tag, tag, false, true));
                    }
                });
                
                // Seleccionar las etiquetas
                $(postTags).val(post.tags);
                $(postTags).trigger('change');
            }
            
            // Mostrar imagen destacada si existe
            if (post.cover_image && imagePreview) {
                imagePreview.classList.remove('d-none');
                imagePreview.querySelector('img').src = post.cover_image;
                imageBase64 = post.cover_image;
            }
            
            // Llenar opciones específicas para sede/grupo
            if (post.targetGroup) {
                if (post.visibility === 'sede' && postSede) {
                    postSede.value = post.targetGroup;
                } else if (post.visibility === 'grupo' && postGrupo) {
                    postGrupo.value = post.targetGroup;
                }
            }
            
        } catch (error) {
            console.error('Error al cargar datos del post:', error);
            alert('Error al cargar los datos del post para edición. Por favor, intente nuevamente.');
        } finally {
            // Quitar estado de carga
            document.body.classList.remove('loading');
        }
    }
    
    // Actualizar opciones de visibilidad
    function updateVisibilityOptions(visibilityValue) {
        if (!sedeOptions || !grupoOptions) return;
        
        if (visibilityValue === 'sede') {
            sedeOptions.classList.remove('d-none');
            grupoOptions.classList.add('d-none');
        } else if (visibilityValue === 'grupo') {
            sedeOptions.classList.add('d-none');
            grupoOptions.classList.remove('d-none');
        } else {
            sedeOptions.classList.add('d-none');
            grupoOptions.classList.add('d-none');
        }
    }
    
    // Manejar carga de imagen
    function handleImageUpload(e) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Verificar que sea una imagen
        if (!file.type.match('image.*')) {
            alert('Por favor, seleccione un archivo de imagen válido.');
            return;
        }
        
        // Verificar tamaño máximo (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo es demasiado grande. Por favor, seleccione una imagen de menos de 2MB.');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(loadEvent) {
            imageBase64 = loadEvent.target.result;
            
            // Mostrar vista previa
            if (imagePreview) {
                imagePreview.classList.remove('d-none');
                imagePreview.querySelector('img').src = imageBase64;
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    // Eliminar imagen
    function removeImage() {
        imageBase64 = null;
        
        if (featuredImage) {
            featuredImage.value = '';
        }
        
        if (imagePreview) {
            imagePreview.classList.add('d-none');
            imagePreview.querySelector('img').src = '';
        }
    }
    
    // Mostrar vista previa
    function showPreview() {
        if (!postTitle || !postContent) return;
        
        const previewTitle = postTitle.value || 'Sin título';
        const previewContent = $(postContent).summernote('code') || '';
        
        // Encontrar o crear el modal para la vista previa
        let previewModal = document.getElementById('previewModal');
        
        if (!previewModal) {
            previewModal = document.createElement('div');
            previewModal.id = 'previewModal';
            previewModal.className = 'modal fade';
            previewModal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Vista Previa del Post</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="previewContent"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(previewModal);
        }
        
        // Configurar contenido de la vista previa
        const previewContainer = document.getElementById('previewContent');
        
        if (previewContainer) {
            previewContainer.innerHTML = `
                <h1 class="mb-4">${previewTitle}</h1>
                <div class="post-content">
                    ${previewContent}
                </div>
            `;
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(previewModal);
        modal.show();
    }
    
    // Guardar el post
    async function savePost() {
        try {
            // Validar campos requeridos
            if (!postTitle.value.trim()) {
                alert('Por favor, ingrese un título para el post.');
                postTitle.focus();
                return;
            }
            
            if (!postCategory.value) {
                alert('Por favor, seleccione una categoría para el post.');
                postCategory.focus();
                return;
            }
            
            const editorContent = $(postContent).summernote('code');
            if (!editorContent || editorContent === '<p><br></p>') {
                alert('Por favor, ingrese contenido para el post.');
                $(postContent).summernote('focus');
                return;
            }
            
            // Mostrar estado de carga
            document.body.classList.add('loading');
            btnSave.disabled = true;
            if (btnSaveDraft) btnSaveDraft.disabled = true;
            if (btnPublish) btnPublish.disabled = true;
            
            // Obtener etiquetas
            const selectedTags = $(postTags).val() || [];
            
            // Obtener opciones adicionales según visibilidad
            let targetGroup = null;
            if (postVisibility.value === 'sede' && postSede) {
                targetGroup = postSede.value;
            } else if (postVisibility.value === 'grupo' && postGrupo) {
                targetGroup = postGrupo.value;
            }
            
            // Preparar datos del post
            const postData = {
                id: currentPostId,
                title: postTitle.value.trim(),
                content: editorContent,
                excerpt: postExcerpt.value.trim(),
                category: postCategory.value,
                tags: selectedTags,
                status: postStatus.value,
                visibility: postVisibility.value,
                coverImage: imageBase64,
                targetGroup: targetGroup
            };
              // Enviar datos al servidor
            const response = await fetch(AppConfig.getFullPath('/api/posts/save'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar el post');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Redirigir según el estado del post
                if (postStatus.value === 'published') {
                    alert('¡Post publicado exitosamente!');
                    window.location.href = `/posts/post-detail?id=${data.post.id}`;
                } else {                    alert('¡Post guardado como borrador exitosamente!');
                    window.location.href = AppConfig.getFullPath('/bienestar/manage-posts');
                }
            } else {
                throw new Error(data.error || 'Error al guardar el post');
            }
            
        } catch (error) {
            console.error('Error al guardar el post:', error);
            alert('Error al guardar el post. Por favor, intente nuevamente.');
        } finally {
            // Quitar estado de carga
            document.body.classList.remove('loading');
            btnSave.disabled = false;
            if (btnSaveDraft) btnSaveDraft.disabled = false;
            if (btnPublish) btnPublish.disabled = false;
        }
    }
});