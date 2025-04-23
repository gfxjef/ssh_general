document.addEventListener('DOMContentLoaded', function() {
    const signatureModal = document.getElementById('signatureModal');
    const signaturePad = document.getElementById('signaturePad');
    const clearButton = document.getElementById('clearSignature');
    const saveButton = document.getElementById('saveSignature');
    const signaturePreview = document.getElementById('signaturePreview');
    const signatureInput = document.getElementById('signatureData');
    
    // Si algún elemento no existe, no continuar
    if (!signaturePad || !signatureModal) {
        console.error('Elementos de firma no encontrados');
        return;
    }
    
    // Asegurarse de que el canvas existe
    let canvas = signaturePad.querySelector('canvas');
    if (!canvas) {
        console.error('Canvas no encontrado, creando uno nuevo');
        canvas = document.createElement('canvas');
        signaturePad.appendChild(canvas);
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }
    
    let ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Ajustar el tamaño del canvas al contenedor
    function resizeCanvas() {
        const parentWidth = signaturePad.clientWidth;
        const parentHeight = signaturePad.clientHeight;
        
        console.log('Redimensionando canvas a:', parentWidth, 'x', parentHeight);
        
        canvas.width = parentWidth;
        canvas.height = parentHeight;
        
        // Limpiar el canvas después de redimensionar
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Inicializar
    function init() {
        console.log('Inicializando pad de firma');
        
        // Redimensionar al cargar
        setTimeout(resizeCanvas, 100);
        
        // Redimensionar cuando cambia el tamaño de la ventana
        window.addEventListener('resize', resizeCanvas);
        
        // Eventos de mouse
        canvas.addEventListener('mousedown', function(e) {
            console.log('Mouse down en canvas');
            startDrawing(e);
        });
        
        canvas.addEventListener('mousemove', function(e) {
            draw(e);
        });
        
        canvas.addEventListener('mouseup', function() {
            console.log('Mouse up en canvas');
            stopDrawing();
        });
        
        canvas.addEventListener('mouseout', function() {
            stopDrawing();
        });
        
        // Eventos táctiles
        canvas.addEventListener('touchstart', function(e) {
            console.log('Touch start en canvas');
            startDrawingTouch(e);
        });
        
        canvas.addEventListener('touchmove', function(e) {
            drawTouch(e);
        });
        
        canvas.addEventListener('touchend', function() {
            console.log('Touch end en canvas');
            stopDrawing();
        });
        
        // Botones
        clearButton.addEventListener('click', clearSignature);
        saveButton.addEventListener('click', saveSignature);
        
        console.log('Eventos registrados');
    }
    
    function startDrawing(e) {
        e.preventDefault();
        drawing = true;
        
        // Calcular coordenadas relativas al canvas
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        
        console.log('Inicio de dibujo en:', lastX, lastY);
    }
    
    function startDrawingTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
        drawing = true;
        
        console.log('Inicio de touch en:', lastX, lastY);
    }
    
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        
        // Calcular coordenadas relativas al canvas
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        drawLine(lastX, lastY, currentX, currentY);
        
        lastX = currentX;
        lastY = currentY;
    }
    
    function drawTouch(e) {
        if (!drawing) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        drawLine(lastX, lastY, currentX, currentY);
        
        lastX = currentX;
        lastY = currentY;
    }
    
    function drawLine(fromX, fromY, toX, toY) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
    }
    
    function stopDrawing() {
        drawing = false;
    }
    
    function clearSignature() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('Firma limpiada');
    }
    
    function saveSignature() {
        console.log('Guardando firma');
        const dataURL = canvas.toDataURL('image/png');
        signatureInput.value = dataURL;
        
        // Mostrar la firma en el preview
        signaturePreview.innerHTML = `
            <div class="border rounded mb-2 text-center p-2">
                <img src="${dataURL}" alt="Firma" style="max-height: 100px; max-width: 100%;">
                <button type="button" class="btn btn-sm btn-outline-danger mt-2" onclick="removeSignature()">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        // Cerrar el modal de manera segura
        try {
            const modal = bootstrap.Modal.getInstance(signatureModal);
            if (modal) {
                modal.hide();
            } else {
                // Fallback si bootstrap.Modal no está disponible
                signatureModal.classList.remove('show');
                signatureModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
        } catch (error) {
            console.error('Error al cerrar el modal:', error);
            // Intentar cerrar manualmente
            signatureModal.classList.remove('show');
            signatureModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }
    
    // Exponer la función de eliminar firma globalmente
    window.removeSignature = function() {
        signaturePreview.innerHTML = '';
        signatureInput.value = '';
        console.log('Firma eliminada');
    };
    
    // Inicializar al abrir el modal
    signatureModal.addEventListener('shown.bs.modal', function() {
        console.log('Modal de firma abierto');
        resizeCanvas();
    });
    
    // Inicializar
    init();
});

// Función para manejar el tipo de persona que confirma
document.addEventListener('DOMContentLoaded', function() {
    const personTypeSelectors = document.querySelectorAll('.person-type-selector');
    const destinatarioSection = document.getElementById('destinatarioSection');
    const otrosSection = document.getElementById('otrosSection');
    
    if (!personTypeSelectors.length || !destinatarioSection || !otrosSection) return;
    
    personTypeSelectors.forEach(selector => {
        selector.addEventListener('click', function() {
            // Quitar selección de todos los botones
            personTypeSelectors.forEach(btn => btn.classList.remove('active'));
            
            // Marcar el botón actual como activo
            this.classList.add('active');
            
            const personType = this.getAttribute('data-type');
            
            if (personType === 'destinatario') {
                destinatarioSection.classList.remove('d-none');
                otrosSection.classList.add('d-none');
                
                // Marcar los campos de "Otros" como no requeridos
                const otrosInputs = otrosSection.querySelectorAll('input[required]');
                otrosInputs.forEach(input => input.removeAttribute('required'));
                
                // Asegurarse que el select de destinatario es requerido
                const destinatarioSelect = destinatarioSection.querySelector('select');
                destinatarioSelect.setAttribute('required', 'required');
            } else {
                destinatarioSection.classList.add('d-none');
                otrosSection.classList.remove('d-none');
                
                // Marcar los campos de "Otros" como requeridos
                const otrosInputs = otrosSection.querySelectorAll('input:not([type="hidden"])');
                otrosInputs.forEach(input => input.setAttribute('required', 'required'));
                
                // Quitar required del select de destinatario
                const destinatarioSelect = destinatarioSection.querySelector('select');
                if (destinatarioSelect) destinatarioSelect.removeAttribute('required');
            }
        });
    });
    
    // Activar la primera opción por defecto
    if (personTypeSelectors.length > 0) {
        personTypeSelectors[0].click();
    }
});