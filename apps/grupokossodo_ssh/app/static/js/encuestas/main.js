/**
 * main.js - Módulo principal para la página de encuestas
 */

// Variable global para almacenar los registros
window.registrosCompletos = [];

/**
 * Carga los datos de calificaciones desde la API
 */
async function cargarDatos() {
    try {
        // Cargar datos desde la API
        const registros = await window.EncuestasAPI.cargarCalificaciones();
        
        // Guardar referencia global a los registros completos
        window.registrosCompletos = registros;
        
        // Inicializar filtros
        window.EncuestasFiltros.inicializarFiltros(registros);
        
        // Inicializar visualizaciones con todos los datos
        window.EncuestasGraficos.actualizarVisualizaciones(registros);
        window.EncuestasTablas.actualizarTablaRegistros(registros);
        
        return registros;
    } catch (error) {
        console.error('Error al cargar datos:', error);
        return [];
    }
}

/**
 * Inicializa la página de encuestas
 */
function inicializar() {
    // Inicializar eventos de modales
    window.EncuestasModales.inicializarEventosModales();
    
    // Inicializar filtro de fechas
    window.EncuestasFiltros.inicializarFiltroFechas();
    
    // Agregar eventos para gráficos responsivos
    window.addEventListener('resize', window.EncuestasGraficos.ajustarTamañoGraficosCirculares);
    
    // Cargar datos iniciales
    cargarDatos();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);

// Exportar funciones
window.EncuestasMain = {
    cargarDatos,
    inicializar
}; 