/**
 * filtros.js - Módulo para el manejo de filtros y búsquedas
 */

/**
 * Inicializa los filtros con los datos disponibles
 * @param {Array} data - Datos para extraer valores únicos
 */
function inicializarFiltros(data) {
    // Extraer valores únicos para los filtros
    const asesores = [...new Set(data.map(item => item.asesor).filter(Boolean))];
    const grupos = [...new Set(data.map(item => item.grupo).filter(Boolean))];
    const calificaciones = [...new Set(data.map(item => item.calificacion).filter(Boolean))];
    
    // Llenar los filtros con opciones
    llenarSelect('filtro1', [{ valor: '', texto: 'Todos los asesores' }, ...asesores.map(a => ({ valor: a, texto: a }))]);
    llenarSelect('filtro2', [{ valor: '', texto: 'Todos los grupos' }, ...grupos.map(g => ({ valor: g, texto: g }))]);
    llenarSelect('filtro3', [{ valor: '', texto: 'Todas las calificaciones' }, ...calificaciones.map(c => ({ valor: c, texto: c }))]);
    
    // NO sobrescribimos el filtro4, solo añadimos las fechas extraídas como grupo separado
    const fechas = extraerFechasUnicas(data);
    
    // Obtener el selector de fechas
    const selectorFechas = document.getElementById('filtro4');
    
    // Comprobar si ya tiene las opciones predefinidas
    const tieneOpcionesPredefinidas = selectorFechas.querySelector('option[value="hoy"]') !== null;
    
    // Si NO tiene las opciones predefinidas, las añadimos
    if (!tieneOpcionesPredefinidas) {
        // Mantener la primera opción "Todos los periodos"
        const opcionPorDefecto = selectorFechas.options[0];
        
        // Limpiar el selector
        selectorFechas.innerHTML = '';
        
        // Volver a añadir la opción por defecto
        selectorFechas.appendChild(opcionPorDefecto);
        
        // Añadir las opciones predefinidas de rangos
        const rangosPredefinidos = [
            { valor: 'hoy', texto: 'Hoy' },
            { valor: 'ayer', texto: 'Ayer' },
            { valor: 'semana', texto: 'Esta semana' },
            { valor: 'mes', texto: 'Este mes' },
            { valor: 'mes-1', texto: 'Último mes' },
            { valor: 'mes-3', texto: 'Últimos 3 meses' },
            { valor: 'mes-6', texto: 'Últimos 6 meses' },
            { valor: 'año', texto: 'Este año' },
            { valor: 'personalizado', texto: 'Rango personalizado' }
        ];
        
        // Crear grupo para rangos predefinidos
        const grupoRangos = document.createElement('optgroup');
        grupoRangos.label = 'Rangos predefinidos';
        
        // Añadir opciones al grupo
        rangosPredefinidos.forEach(opcion => {
            const option = document.createElement('option');
            option.value = opcion.valor;
            option.textContent = opcion.texto;
            grupoRangos.appendChild(option);
        });
        
        // Añadir el grupo al selector
        selectorFechas.appendChild(grupoRangos);
    }
    
    // Verificar si ya existe un grupo para fechas específicas
    let grupoFechas = selectorFechas.querySelector('optgroup[label="Fechas específicas"]');
    
    // Si no existe, crearlo
    if (!grupoFechas) {
        grupoFechas = document.createElement('optgroup');
        grupoFechas.label = 'Fechas específicas';
        selectorFechas.appendChild(grupoFechas);
    } else {
        // Si existe, limpiarlo
        grupoFechas.innerHTML = '';
    }
    
    // Añadir las fechas específicas al grupo
    fechas.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.valor;
        option.textContent = opcion.texto;
        grupoFechas.appendChild(option);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.filtro-select').forEach(select => {
        // Eliminar listeners antiguos usando clonación
        const nuevoSelect = select.cloneNode(true);
        select.parentNode.replaceChild(nuevoSelect, select);
        
        // Añadir nuevo listener
        nuevoSelect.addEventListener('change', () => aplicarFiltros(window.registrosCompletos || []));
    });
}

/**
 * Llena un selector con opciones
 * @param {string} id - ID del selector
 * @param {Array} opciones - Opciones para llenar el selector
 */
function llenarSelect(id, opciones) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.valor;
        option.textContent = opcion.texto;
        select.appendChild(option);
    });
}

/**
 * Extrae fechas únicas de los datos
 * @param {Array} data - Datos para extraer fechas
 * @returns {Array} - Fechas únicas
 */
function extraerFechasUnicas(data) {
    // Extraer meses únicos de los registros
    const fechas = [];
    data.forEach(item => {
        if (item.timestamp) {
            const fecha = new Date(item.timestamp);
            const mesAnio = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            const mesAnioObj = {
                valor: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
                texto: mesAnio
            };
            
            if (!fechas.some(f => f.valor === mesAnioObj.valor)) {
                fechas.push(mesAnioObj);
            }
        }
    });
    
    // Ordenar fechas (más recientes primero)
    return fechas.sort((a, b) => b.valor.localeCompare(a.valor));
}

/**
 * Inicializa el filtro de fechas
 */
function inicializarFiltroFechas() {
    const selectFiltroFechas = document.getElementById('filtro4');
    const rangoFechasContainer = document.getElementById('rangoFechasContainer');
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    const btnAplicarFechas = document.getElementById('aplicarFechas');
    
    // Configurar fechas por defecto (inicio: hace un mes, fin: hoy)
    const hoy = new Date();
    const haceMes = new Date();
    haceMes.setMonth(haceMes.getMonth() - 1);
    
    fechaInicio.valueAsDate = haceMes;
    fechaFin.valueAsDate = hoy;
    
    // Mostrar/ocultar el selector de rango según la opción seleccionada
    selectFiltroFechas.addEventListener('change', function() {
        if (this.value === 'personalizado') {
            rangoFechasContainer.style.display = 'block';
        } else {
            rangoFechasContainer.style.display = 'none';
            // Aplicar el filtro de rango predefinido inmediatamente
            aplicarFiltros(window.registrosCompletos || []);
        }
    });
    
    // Aplicar el filtro cuando se hace clic en el botón
    btnAplicarFechas.addEventListener('click', function() {
        aplicarFiltros(window.registrosCompletos || []);
    });
}

/**
 * Aplica los filtros a los datos
 * @param {Array} data - Datos a filtrar
 */
function aplicarFiltros(data) {
    const asesor = document.getElementById('filtro1').value;
    const grupo = document.getElementById('filtro2').value;
    const calificacion = document.getElementById('filtro3').value;
    const filtroFecha = document.getElementById('filtro4').value;
    
    // Filtrar datos según selecciones
    let datosFiltrados = data.filter(item => {
        let cumpleFiltros = true;
        
        if (asesor && item.asesor !== asesor) cumpleFiltros = false;
        if (grupo && item.grupo !== grupo) cumpleFiltros = false;
        if (calificacion && item.calificacion !== calificacion) cumpleFiltros = false;
        
        // Nuevo filtro de fechas mejorado
        if (filtroFecha && item.timestamp) {
            const itemFecha = new Date(item.timestamp);
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999); // Final del día actual
            
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            ayer.setHours(0, 0, 0, 0); // Inicio del día de ayer
            
            const ayerFin = new Date();
            ayerFin.setDate(ayerFin.getDate() - 1);
            ayerFin.setHours(23, 59, 59, 999); // Final del día de ayer
            
            // Inicio de semana (lunes)
            const inicioSemana = new Date();
            const diaSemana = inicioSemana.getDay();
            const diff = inicioSemana.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
            inicioSemana.setDate(diff);
            inicioSemana.setHours(0, 0, 0, 0);
            
            // Inicio de mes
            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);
            
            // Inicio del mes anterior
            const inicioMesAnterior = new Date();
            inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
            inicioMesAnterior.setDate(1);
            inicioMesAnterior.setHours(0, 0, 0, 0);
            
            // Hace 3 meses
            const hace3Meses = new Date();
            hace3Meses.setMonth(hace3Meses.getMonth() - 3);
            hace3Meses.setHours(0, 0, 0, 0);
            
            // Hace 6 meses
            const hace6Meses = new Date();
            hace6Meses.setMonth(hace6Meses.getMonth() - 6);
            hace6Meses.setHours(0, 0, 0, 0);
            
            // Inicio del año
            const inicioAño = new Date(hoy.getFullYear(), 0, 1);
            inicioAño.setHours(0, 0, 0, 0);
            
            // Aplicar filtro según la opción seleccionada
            switch (filtroFecha) {
                case 'hoy':
                    const inicioHoy = new Date();
                    inicioHoy.setHours(0, 0, 0, 0);
                    if (itemFecha < inicioHoy || itemFecha > hoy) cumpleFiltros = false;
                    break;
                case 'ayer':
                    if (itemFecha < ayer || itemFecha > ayerFin) cumpleFiltros = false;
                    break;
                case 'semana':
                    if (itemFecha < inicioSemana || itemFecha > hoy) cumpleFiltros = false;
                    break;
                case 'mes':
                    if (itemFecha < inicioMes || itemFecha > hoy) cumpleFiltros = false;
                    break;
                case 'mes-1':
                    if (itemFecha < inicioMesAnterior || itemFecha > inicioMes) cumpleFiltros = false;
                    break;
                case 'mes-3':
                    if (itemFecha < hace3Meses || itemFecha > hoy) cumpleFiltros = false;
                    break;
                case 'mes-6':
                    if (itemFecha < hace6Meses || itemFecha > hoy) cumpleFiltros = false;
                    break;
                case 'año':
                    if (itemFecha < inicioAño || itemFecha > hoy) cumpleFiltros = false;
                    break;
                case 'personalizado':
                    const fechaInicio = new Date(document.getElementById('fechaInicio').value);
                    fechaInicio.setHours(0, 0, 0, 0);
                    
                    const fechaFin = new Date(document.getElementById('fechaFin').value);
                    fechaFin.setHours(23, 59, 59, 999);
                    
                    if (isNaN(fechaInicio) || isNaN(fechaFin)) {
                        // Si las fechas no son válidas, no filtramos
                        break;
                    }
                    
                    if (itemFecha < fechaInicio || itemFecha > fechaFin) cumpleFiltros = false;
                    break;
                default:
                    // Si es un año-mes específico
                    if (filtroFecha.match(/^\d{4}-\d{2}$/)) {
                        const [year, month] = filtroFecha.split('-').map(Number);
                        const inicioMesSeleccionado = new Date(year, month - 1, 1);
                        inicioMesSeleccionado.setHours(0, 0, 0, 0);
                        
                        const finMesSeleccionado = new Date(year, month, 0);
                        finMesSeleccionado.setHours(23, 59, 59, 999);
                        
                        if (itemFecha < inicioMesSeleccionado || itemFecha > finMesSeleccionado) cumpleFiltros = false;
                    }
                    break;
            }
        }
        
        return cumpleFiltros;
    });
    
    // Actualizar visualizaciones con datos filtrados
    window.EncuestasGraficos.actualizarVisualizaciones(datosFiltrados);
    window.EncuestasTablas.actualizarTablaRegistros(datosFiltrados);
}

// Exportar funciones
window.EncuestasFiltros = {
    inicializarFiltros,
    inicializarFiltroFechas,
    aplicarFiltros
}; 