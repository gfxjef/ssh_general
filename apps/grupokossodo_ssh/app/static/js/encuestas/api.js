/**
 * api.js - Módulo para manejar todas las comunicaciones con el backend
 */

// API Base URL
const API_BASE_URL = '/api';

/**
 * Carga los registros de calificaciones desde el servidor
 * @returns {Promise} - Promesa que resuelve a los datos cargados
 */
async function cargarCalificaciones() {
    try {
        const response = await fetch(AppConfig.getFullPath(`${API_BASE_URL}/records`));
        const data = await response.json();

        if (data.status !== 'success' || !Array.isArray(data.records)) {
            throw new Error('Error en la respuesta del servidor');
        }

        return data.records;
    } catch (err) {
        console.error('Error:', err);
        mostrarMensaje(`Error cargando calificaciones: ${err.message}`, 'error');
        return [];
    }
}

/**
 * Obtiene los detalles de conformidad para un registro específico
 * @param {string|number} recordId - ID del registro
 * @returns {Promise} - Promesa que resuelve a los datos de conformidad
 */
async function obtenerDetallesConformidad(recordId) {
    try {
        const response = await fetch(AppConfig.getFullPath(`${API_BASE_URL}/record-conformidad/${recordId}`));
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al cargar datos de conformidad:', error);
        throw error;
    }
}

/**
 * Guarda la información de conformidad de un registro
 * @param {string|number} recordId - ID del registro
 * @param {string} tipoConformidad - Tipo de conformidad
 * @param {string} observacion - Observaciones sobre la conformidad
 * @returns {Promise} - Promesa que resuelve con el resultado del guardado
 */
async function guardarConformidad(recordId, tipoConformidad, observacion) {
    try {
        // Preparar los datos para enviar
        const datos = {
            conformidad: tipoConformidad,
            conformidad_obs: observacion
        };
        
        const response = await fetch(AppConfig.getFullPath(`${API_BASE_URL}/record-conformidad/${recordId}`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al guardar conformidad:', error);
        throw error;
    }
}

/**
 * Muestra un mensaje en la interfaz
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje (error, success, info)
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    const mensajeElement = document.getElementById('mensaje');
    if (mensajeElement) {
        mensajeElement.innerHTML = `<div class="${tipo}-message">${mensaje}</div>`;
    }
}

// Exportar las funciones para uso global
window.EncuestasAPI = {
    cargarCalificaciones,
    obtenerDetallesConformidad,
    guardarConformidad,
    mostrarMensaje
}; 