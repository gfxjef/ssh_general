/**
 * Funcionalidad para reportar problemas con los PDFs
 */

// Mostrar el modal de reporte
function reportPDF(catalogName) {
    const modal = document.getElementById('reportModal');
    const reportPdfNameSpan = document.getElementById('reportPdfName');
    const form = document.getElementById('reportForm');
    
    // Limpiar y configurar el formulario
    form.reset();
    reportPdfNameSpan.textContent = catalogName.replace(/_/g, ' ').replace(/.pdf$/, '');
    
    // Mostrar el modal
    modal.style.display = 'flex';
    
    // Asegurarse de que los manejadores de eventos se registren solo una vez
    document.getElementById('closeReportModal').onclick = closeReportModal;
    document.getElementById('cancelReport').onclick = closeReportModal;
    document.getElementById('submitReport').onclick = function() {
        submitReport(catalogName);
    };
    
    // Manejar cierre con la tecla Esc
    document.addEventListener('keydown', handleEscapeKey);
    
    // También cerrar el modal si se hace clic fuera de él
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeReportModal();
        }
    });
}

// Cerrar el modal
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.style.display = 'none';
    
    // Eliminar el manejador de evento de la tecla Esc
    document.removeEventListener('keydown', handleEscapeKey);
}

// Manejar la tecla Escape para cerrar el modal
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeReportModal();
    }
}

// Enviar el reporte - FUNCIÓN ACTUALIZADA
function submitReport(catalogName) {
    const errorType = document.getElementById('errorType').value;
    const errorDesc = document.getElementById('errorDescription').value.trim();
    
    // Validación básica
    if (!errorType) {
        alert('Por favor seleccione un tipo de error');
        return;
    }
    
    if (!errorDesc) {
        alert('Por favor describa el error');
        return;
    }
    
    // Obtener datos del usuario desde sessionStorage
    let userData = { nombre: 'Usuario desconocido', cargo: 'Cargo desconocido' };
    try {
        const storedUserData = JSON.parse(sessionStorage.getItem('userData'));
        if (storedUserData) {
            userData = {
                nombre: storedUserData.nombre || 'No disponible',
                cargo: storedUserData.cargo || 'No disponible'
            };
        }
    } catch (e) {
        console.error('Error al obtener datos de usuario:', e);
    }
    
    // Obtener la URL base para las solicitudes
    const baseUrl = window.location.pathname.includes('/grupokossodo_ssh') ? 
                  '/grupokossodo_ssh/pdf_reader/' : '/pdf_reader/';
    
    // Construir los datos para enviar
    const reportData = {
        pdf: catalogName,
        tipo: errorType,
        descripcion: errorDesc,
        usuario: userData.nombre,
        cargo: userData.cargo
    };
    
    // Mostrar indicador de carga
    const submitBtn = document.getElementById('submitReport');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    // Enviar al servidor
    fetch(baseUrl + 'report-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Reporte enviado correctamente. Gracias por su colaboración.');
            closeReportModal();
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    })
    .catch(error => {
        console.error('Error al enviar reporte:', error);
        alert('Error al enviar el reporte: ' + error.message);
    })
    .finally(() => {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

// Exportar las funciones para que estén disponibles en el ámbito global
window.reportPDF = reportPDF;
window.closeReportModal = closeReportModal;