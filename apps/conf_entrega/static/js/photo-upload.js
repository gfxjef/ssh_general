// Configuración global
const MAX_PHOTOS = 12; // Máximo de fotos permitidas
let currentPhotoCount = 0;
let capturedPhotos = []; // Array para almacenar las fotos capturadas

// Función para comprimir imágenes antes de cargarlas
function compressImage(imageDataUrl, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Redimensionar si es necesario
            if (width > maxWidth) {
                height = Math.floor(height * (maxWidth / width));
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprimir usando el parámetro de calidad (0 a 1)
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}

// Función para manejar la vista previa y carga de fotos
async function handlePhotoSelection(files) {
    if (!files.length) return;
    
    for (let i = 0; i < files.length; i++) {
        if (currentPhotoCount >= MAX_PHOTOS) {
            alert('Máximo de fotos alcanzado (12)');
            break;
        }
        
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            // Comprimir la imagen antes de procesarla
            const compressedImage = await compressImage(e.target.result, 1200, 0.7);
            
            currentPhotoCount++;
            // Generar ID único para la foto
            const photoId = Date.now() + Math.floor(Math.random() * 1000);
            // Guardar la foto en el array con su ID
            capturedPhotos.push({
                id: photoId,
                data: compressedImage
            });
            addPhotoPreview(compressedImage, photoId);
        };
        
        reader.readAsDataURL(file);
    }
}

// Función para agregar la vista previa de una foto
function addPhotoPreview(imageUrl, photoId) {
    // Crear un contenedor principal para la foto
    const photoCol = document.createElement('div');
    photoCol.className = 'col-6 mb-3'; // Usamos col-6 para tener dos fotos por fila
    photoCol.dataset.photoId = photoId;
    
    // Estructura HTML de la previsualización con botón de borrar debajo
    photoCol.innerHTML = `
        <div class="card">
            <div class="position-relative photo-container" style="height: 150px; overflow: hidden;">
                <img src="${imageUrl}" class="card-img-top img-photo-preview" 
                     style="object-fit: cover; height: 100%; width: 100%; cursor: pointer;">
            </div>
            <div class="card-body p-2">
                <button type="button" class="btn btn-danger btn-sm w-100 delete-photo">
                    <i class="bi bi-trash"></i> Borrar
                </button>
            </div>
            <input type="hidden" name="photo_data[]" value="${imageUrl}">
        </div>
    `;
    
    // Agregar evento para eliminar la foto
    const deleteBtn = photoCol.querySelector('.delete-photo');
    deleteBtn.addEventListener('click', function() {
        // Eliminar del array de fotos
        capturedPhotos = capturedPhotos.filter(photo => photo.id !== photoId);
        // Eliminar el elemento visual
        photoCol.remove();
        currentPhotoCount--;
    });
    
    // Agregar evento para previsualizar la foto en tamaño completo
    const photoImg = photoCol.querySelector('.img-photo-preview');
    photoImg.addEventListener('click', function() {
        showPhotoPreview(imageUrl);
    });
    
    // Agregar al contenedor de fotos (debajo de los botones de captura)
    const previewContainer = document.getElementById('photo-previews');
    if (previewContainer) {
        previewContainer.appendChild(photoCol);
    } else {
        // Si no existe el contenedor photo-previews, crearlo después del preview-container
        const mainContainer = document.getElementById('preview-container');
        if (mainContainer) {
            const newPreviewContainer = document.createElement('div');
            newPreviewContainer.id = 'photo-previews';
            newPreviewContainer.className = 'row mt-3';
            mainContainer.parentNode.insertBefore(newPreviewContainer, mainContainer.nextSibling);
            newPreviewContainer.appendChild(photoCol);
        }
    }
}

// Función para mostrar la previsualización de la foto en tamaño completo
function showPhotoPreview(imageUrl) {
    // Verificar si ya existe el modal
    let photoModal = document.getElementById('photoFullModal');
    
    if (!photoModal) {
        // Crear el modal si no existe
        photoModal = document.createElement('div');
        photoModal.id = 'photoFullModal';
        photoModal.className = 'modal fade';
        photoModal.tabIndex = '-1';
        photoModal.setAttribute('aria-hidden', 'true');
        
        photoModal.innerHTML = `
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Vista ampliada</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body d-flex align-items-center justify-content-center bg-dark p-0">
                        <img id="fullModalImage" src="" class="img-fluid" alt="Foto ampliada">
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(photoModal);
    }
    
    // Establecer la imagen y mostrar el modal
    document.getElementById('fullModalImage').src = imageUrl;
    const modal = new bootstrap.Modal(photoModal);
    modal.show();
}

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    // Crear contenedor para las miniaturas de fotos si no existe
    if (!document.getElementById('photo-previews')) {
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            const photoPreviewsContainer = document.createElement('div');
            photoPreviewsContainer.id = 'photo-previews';
            photoPreviewsContainer.className = 'row mt-3';
            previewContainer.parentNode.insertBefore(photoPreviewsContainer, previewContainer.nextSibling);
        }
    }
    
    // Configurar el input de foto capturada con cámara
    const cameraInput = document.getElementById('foto1');
    if (cameraInput) {
        cameraInput.addEventListener('change', function(e) {
            handlePhotoSelection(e.target.files);
            this.value = ''; // Reset para permitir seleccionar la misma foto
        });
    }
    
    // Configurar el input de fotos importadas
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handlePhotoSelection(e.target.files);
            this.value = ''; // Reset para permitir seleccionar las mismas fotos
        });
    }
    
    // Inicializar los modales de Bootstrap si existen
    if (typeof bootstrap !== 'undefined') {
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modalElement => {
            new bootstrap.Modal(modalElement);
        });
    }
});