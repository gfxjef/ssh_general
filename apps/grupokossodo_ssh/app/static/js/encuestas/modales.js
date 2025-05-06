/**
 * modales.js - Módulo para la gestión de ventanas modales
 */

/**
 * Muestra el modal con detalles del registro
 * @param {Object} registro - Registro a mostrar
 */
function mostrarDetalles(registro) {
    try {
        // Check if registro exists
        if (!registro) {
            console.error("Registro no encontrado");
            return;
        }
        
        // Mostrar ID en el título del modal
        document.getElementById('modalIdCalificacion').textContent = registro.idcalificacion || 'N/A';
        
        // Llenar la información básica
        document.getElementById('detallesRuc').textContent = registro.ruc || 'No disponible';
        document.getElementById('detallesDocumento').textContent = registro.documento || 'No disponible';
        document.getElementById('detallesFecha').textContent = window.EncuestasTablas.formatearFecha(registro.timestamp);
        
        // Mostrar observaciones
        document.getElementById('detallesObservaciones').innerHTML = 
            registro.observaciones || '<div class="no-observaciones">Sin observaciones</div>';
        
        // Mostrar promociones
        const promocionesHtml = [];
        for (let i = 1; i <= 5; i++) {
            const promo = registro[`promo${i}`];
            const timePromo = registro[`time_promo${i}`];
            
            if (promo || timePromo) {
                promocionesHtml.push(`
                    <div class="promo-item">
                        <h3>Promoción ${i}</h3>
                        <div class="promo-descripcion">${promo || '<span class="no-descripcion">Sin descripción</span>'}</div>
                        ${timePromo ? `<div class="promo-timestamp">Fecha: ${window.EncuestasTablas.formatearFecha(timePromo)}</div>` : ''}
                    </div>
                `);
            }
        }
        
        document.getElementById('detallesPromociones').innerHTML = 
            promocionesHtml.length > 0 ? 
                promocionesHtml.join('') : 
                '<div class="no-promociones">No hay promociones registradas</div>';

        // Configurar el botón de conformidad
        const btnConformidad = document.getElementById('btnConformidad');
        if (btnConformidad) {
            btnConformidad.setAttribute('data-record-id', registro.idcalificacion);
            btnConformidad.onclick = function() {
                abrirModalConformidad(registro.idcalificacion);
            };
        }

        // Mostrar el modal
        document.getElementById('modalDetalles').style.display = 'flex';
        
    } catch (error) {
        console.error("Error al mostrar detalles:", error);
    }
}

/**
 * Cierra el modal de detalles
 */
function cerrarModalDetalles() {
    document.getElementById('modalDetalles').style.display = 'none';
}

/**
 * Inicializa referencias a elementos del modal de conformidad
 * @returns {Object} - Referencias a elementos del modal
 */
function iniciarModalConformidad() {
    // Solo referenciamos los elementos cuando ya sabemos que existen
    const modalConformidad = document.getElementById('modalConformidad');
    const conformidadRecordId = document.getElementById('conformidadRecordId');
    
    return { modalConformidad, conformidadRecordId };
}

/**
 * Abre el modal de conformidad para un registro específico
 * @param {string|number} recordId - ID del registro
 */
async function abrirModalConformidad(recordId) {
    const { modalConformidad, conformidadRecordId } = iniciarModalConformidad();
    
    // 1. Primero mostrar el modal inmediatamente
    if (modalConformidad) {
        modalConformidad.style.display = 'block';
        // Centrar el modal en la pantalla
        modalConformidad.style.display = 'flex';
    }
    
    // 2. Guardar el ID
    if (conformidadRecordId) {
        conformidadRecordId.value = recordId;
    }
    
    // 3. Mostrar indicador de carga
    document.getElementById('tipoConformidad').disabled = true;
    document.getElementById('observacionConformidad').disabled = true;
    
    const formBody = document.querySelector('#formConformidad');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loadingConformidad';
    loadingIndicator.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando datos...</div>';
    formBody.prepend(loadingIndicator);
    
    // 4. Hacer la solicitud en segundo plano
    try {
        const data = await window.EncuestasAPI.obtenerDetallesConformidad(recordId);
        
        // Remover el indicador de carga
        document.getElementById('loadingConformidad').remove();
        
        // Habilitar campos
        document.getElementById('tipoConformidad').disabled = false;
        document.getElementById('observacionConformidad').disabled = false;
        
        if (data.status === 'success' && data.record) {
            document.getElementById('tipoConformidad').value = data.record.conformidad || '';
            document.getElementById('observacionConformidad').value = data.record.conformidad_obs || '';
        } else {
            document.getElementById('tipoConformidad').value = '';
            document.getElementById('observacionConformidad').value = '';
        }
    } catch (error) {
        console.error('Error al cargar datos de conformidad:', error);
        document.getElementById('loadingConformidad').innerHTML = 
            '<div class="text-danger">Error al cargar datos. Puede continuar ingresando la información.</div>';
        
        // Habilitar campos a pesar del error
        document.getElementById('tipoConformidad').disabled = false;
        document.getElementById('observacionConformidad').disabled = false;
    }
}

/**
 * Cierra el modal de conformidad
 */
function cerrarModalConformidad() {
    const { modalConformidad } = iniciarModalConformidad();
    if (modalConformidad) {
        modalConformidad.style.display = 'none';
    }
}

/**
 * Guarda la información de conformidad
 */
async function guardarConformidad() {
    const recordId = document.getElementById('conformidadRecordId').value;
    const tipoConformidad = document.getElementById('tipoConformidad').value;
    const observacion = document.getElementById('observacionConformidad').value;
    
    // Validación básica
    if (!tipoConformidad) {
        alert('Por favor seleccione un tipo de conformidad');
        return;
    }
    
    try {
        const data = await window.EncuestasAPI.guardarConformidad(recordId, tipoConformidad, observacion);
        
        if (data.status === 'success') {
            alert('Conformidad guardada correctamente');
            cerrarModalConformidad();
            // Actualizar la vista si es necesario
            window.EncuestasMain.cargarDatos();
        } else {
            alert('Error al guardar la conformidad: ' + data.message);
        }
    } catch (error) {
        console.error('Error al guardar conformidad:', error);
        alert('Error al guardar la conformidad: ' + error.message);
    }
}

/**
 * Inicializa los eventos de los modales
 */
function inicializarEventosModales() {
    // Evento para cerrar el modal de detalles
    document.getElementById('closeModalDetalles').addEventListener('click', cerrarModalDetalles);
    
    // Evento para cerrar modal con botón "Cerrar"
    document.querySelectorAll('.btn-cerrar').forEach(btn => {
        btn.addEventListener('click', function() {
            cerrarModalDetalles();
            cerrarModalConformidad();
        });
    });
}

// Exportar funciones
window.EncuestasModales = {
    mostrarDetalles,
    cerrarModalDetalles,
    iniciarModalConformidad,
    abrirModalConformidad,
    cerrarModalConformidad,
    guardarConformidad,
    inicializarEventosModales
}; 