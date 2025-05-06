/**
 * tablas.js - Módulo para el manejo de tablas y visualización de datos
 */

/**
 * Formatea una fecha para mostrarla
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Actualiza la tabla de registros con los datos filtrados
 * @param {Array} data - Datos para actualizar la tabla
 */
function actualizarTablaRegistros(data) {
    // Filtrar registros que tengan calificación
    const registrosFiltrados = data.filter(registro => 
        registro.calificacion && registro.calificacion.trim() !== ''
    );
    
    // Ordenar registros por fecha (más recientes primero)
    registrosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.timestamp || 0);
        const fechaB = new Date(b.timestamp || 0);
        return fechaB - fechaA; // Orden descendente
    });

    const tbody = document.querySelector('#tablaCalificaciones tbody');
    tbody.innerHTML = '';

    registrosFiltrados.forEach(registro => {
        const registroId = registro.idcalificacion || '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${registroId}</td>
            <td>${registro.asesor || '-'}</td>
            <td>${registro.nombres || '-'}</td>
            <td>${registro.calificacion || '-'}</td>
            <td>${registro.tipo || '-'}</td>
            <td>
                <button class="btn-detalles" data-id="${registroId}">+</button>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Add event listener to the button we just created
        const btn = tr.querySelector('.btn-detalles');
        btn.addEventListener('click', function() {
            const registroMatch = data.find(r => r.idcalificacion == registroId);
            if (registroMatch) {
                window.EncuestasModales.mostrarDetalles(registroMatch);
            } else {
                console.error("No se encontró el registro con ID:", registroId);
            }
        });
    });
}

// Exportar funciones
window.EncuestasTablas = {
    formatearFecha,
    actualizarTablaRegistros
}; 