// Script para la página de detalle de post
document.addEventListener('DOMContentLoaded', function() {
    // Obtener ID del post desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    // Referencias DOM
    const postDetailContainer = document.getElementById('post-detail-container');
    const postTemplate = document.getElementById('post-template');
    const errorTemplate = document.getElementById('error-template');
    const loadingContainer = document.querySelector('.loading');
    const relatedPostsContainer = document.getElementById('related-posts');
    const relatedPostsContentContainer = document.getElementById('related-posts-container');
    
    // Cargar el post
    if (postId) {
        loadPost(postId);
    } else {
        showError();
    }
    
    // Función para cargar los datos del post
    async function loadPost(id) {
        try {
            // Mostrar estado de carga
            if (loadingContainer) {
                loadingContainer.style.display = 'block';
            }
            
            // Cargar datos del post
            const response = await fetch(`${AppConfig.getFullPath('/api')}/posts/${id}`);            
            if (!response.ok) {
                throw new Error('No se pudo cargar el post');
            }
            
            const post = await response.json();
            
            // Verificar que tengamos datos válidos
            if (!post || !post.title) {
                throw new Error('Datos del post inválidos');
            }
            
            // Renderizar post
            renderPost(post);
            
            // Cargar posts relacionados
            loadRelatedPosts(post);
            
            // Configurar botones de compartir
            setupShareButtons(post);
            
        } catch (error) {
            console.error('Error al cargar el post:', error);
            showError();
        } finally {
            // Ocultar estado de carga
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
        }
    }
    
    // Función para renderizar el post
    function renderPost(post) {
        if (!postTemplate || !postDetailContainer) return;
        
        // Debug - check what's coming from the API
        console.log("Post data:", post);
        console.log("Cover image exists:", !!post.coverImage);
        
        // Clonar template del post
        const postContent = postTemplate.cloneNode(true);
        postContent.id = '';
        postContent.style.display = 'block';

        // Debug - verify DOM structure
        console.log("Template structure:", postContent.innerHTML);
        const featuredImageContainer = postContent.querySelector('.post-featured-image-container');
        console.log("Featured image container found:", !!featuredImageContainer);
        
        // Formatear fecha
        const date = new Date(post.created);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Llenar datos del post
        postContent.querySelector('.post-title').textContent = post.title;
        postContent.querySelector('.post-category').textContent = getCategoryName(post.category);
        postContent.querySelector('.post-date span').textContent = formattedDate;
        postContent.querySelector('.post-author span').textContent = post.author || 'Equipo de Bienestar';
        postContent.querySelector('.post-content').innerHTML = post.content || '';
        
        // Handle featured image container first (now before the header)
        if (featuredImageContainer) {
            console.log("Container found, checking for image");
            if (post.coverImage) {
                console.log("Cover image found:", post.coverImage);
                const featuredImg = document.createElement('img');
                featuredImg.src = post.coverImage;
                featuredImg.alt = post.title;
                featuredImg.className = 'post-featured-image-main';
                
                featuredImageContainer.innerHTML = ''; // Clear container first
                featuredImageContainer.appendChild(featuredImg);
                featuredImageContainer.style.display = 'block';
            } else {
                featuredImageContainer.style.display = 'none';
            }
        }
        
        // Renderizar etiquetas
        if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
            const tagsContainer = postContent.querySelector('.post-tags');
            
                post.tags.forEach(tag => {
                    const tagElement = document.createElement('a');
                    tagElement.href = AppConfig.getFullPath(`/bienestar/view-posts`) + `?tag=${tag}`;
                    tagElement.className = 'tag';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
        }
        
        // Reemplazar el contenedor de carga con el contenido del post
        postDetailContainer.innerHTML = '';
        postDetailContainer.appendChild(postContent);
    }
    
    // Cargar posts relacionados
    async function loadRelatedPosts(currentPost) {
        try {
            if (!relatedPostsContainer || !relatedPostsContentContainer) return;
            
            // Cargar todos los posts publicados
            const response = await fetch(AppConfig.getFullPath('/api/posts/published'));
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar los posts relacionados');
            }
            
            const data = await response.json();
            let posts = data.posts || [];
            
            // Filtrar el post actual
            posts = posts.filter(post => post.id !== currentPost.id);
            
            // Filtrar posts por categoría o etiquetas similares
            let relatedPosts = posts.filter(post => {
                // Mismo categoría
                if (post.category === currentPost.category) {
                    return true;
                }
                
                // Compartir al menos una etiqueta
                if (post.tags && currentPost.tags && Array.isArray(post.tags) && Array.isArray(currentPost.tags)) {
                    return post.tags.some(tag => currentPost.tags.includes(tag));
                }
                
                return false;
            });
            
            // Limitar a máximo 3 posts
            relatedPosts = relatedPosts.slice(0, 3);
            
            // Si no hay posts relacionados, no mostrar la sección
            if (relatedPosts.length === 0) {
                relatedPostsContainer.style.display = 'none';
                return;
            }
            
            // Renderizar posts relacionados
            relatedPostsContentContainer.innerHTML = '';
            
            relatedPosts.forEach(post => {
                // Formatear fecha
                const date = new Date(post.created);
                const formattedDate = date.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                
                // Crear elemento de post relacionado
                const postElement = document.createElement('div');
                postElement.className = 'col';
                
                postElement.innerHTML = `
                    <div class="related-card">
                        ${post.coverImage ? 
                            `<img src="${post.coverImage}" class="related-img" alt="${post.title}">` :
                            '<div class="related-img bg-light"></div>'
                        }
                        <div class="card-body p-3">
                            <h5 class="related-title">
                                <a href="/posts/post-detail?id=${post.id}" class="text-decoration-none text-dark">
                                    ${post.title}
                                </a>
                            </h5>
                            <p class="related-date mb-2">${formattedDate}</p>
                            <p class="card-text small">${post.excerpt || ''}</p>
                        </div>
                    </div>
                `;
                
                relatedPostsContentContainer.appendChild(postElement);
            });
            
            // Mostrar sección de posts relacionados
            relatedPostsContainer.style.display = 'block';
            
            // Configurar navegación (posts anterior y siguiente)
            setupNavigation(currentPost, posts);
            
        } catch (error) {
            console.error('Error al cargar posts relacionados:', error);
            relatedPostsContainer.style.display = 'none';
        }
    }
    
    // Configurar navegación entre posts
    function setupNavigation(currentPost, allPosts) {
        const prevLink = document.querySelector('.nav-link.prev-post');
        const nextLink = document.querySelector('.nav-link.next-post');
        
        if (!prevLink || !nextLink || !allPosts || !Array.isArray(allPosts) || allPosts.length === 0) {
            return;
        }
        
        // Ordenar posts por fecha de creación
        allPosts.sort((a, b) => new Date(a.created) - new Date(b.created));
        
        // Encontrar índice del post actual
        const currentIndex = allPosts.findIndex(post => post.id === currentPost.id);
        
        if (currentIndex === -1) {
            return;
        }
        
        // Configurar enlace a post anterior si existe
        if (currentIndex > 0) {
            const prevPost = allPosts[currentIndex - 1];
            prevLink.href = `/posts/post-detail?id=${prevPost.id}`;
            prevLink.style.display = 'inline-block';
        }
        
        // Configurar enlace a post siguiente si existe
        if (currentIndex < allPosts.length - 1) {
            const nextPost = allPosts[currentIndex + 1];
            nextLink.href = `/posts/post-detail?id=${nextPost.id}`;
            nextLink.style.display = 'inline-block';
        }
    }
    
    // Configurar botones de compartir
    function setupShareButtons(post) {
        if (!post || !post.title) return;
        
        const facebookBtn = document.querySelector('.share-facebook');
        const twitterBtn = document.querySelector('.share-twitter');
        const linkedinBtn = document.querySelector('.share-linkedin');
        const whatsappBtn = document.querySelector('.share-whatsapp');
        const emailBtn = document.querySelector('.share-mail');
        
        const postUrl = window.location.href;
        const postTitle = encodeURIComponent(post.title);
        
        if (facebookBtn) {
            facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        }
        
        if (twitterBtn) {
            twitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${postTitle}`;
        }
        
        if (linkedinBtn) {
            linkedinBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        }
        
        if (whatsappBtn) {
            whatsappBtn.href = `https://api.whatsapp.com/send?text=${postTitle}%20${encodeURIComponent(postUrl)}`;
        }
        
        if (emailBtn) {
            emailBtn.href = `mailto:?subject=${postTitle}&body=${encodeURIComponent(postUrl)}`;
        }
    }
    
    // Mostrar error
    function showError() {
        if (errorTemplate && postDetailContainer) {
            loadingContainer.style.display = 'none';
            
            const errorContent = errorTemplate.cloneNode(true);
            errorContent.id = '';
            errorContent.style.display = 'block';
            
            postDetailContainer.innerHTML = '';
            postDetailContainer.appendChild(errorContent);
        }
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
});