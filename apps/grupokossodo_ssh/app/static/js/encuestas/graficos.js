/**
 * graficos.js - Módulo para el manejo de gráficos y visualizaciones
 */

// Variables globales para las instancias de los gráficos
let chartVentas = null;
let chartConformidad = null;
let chartLineas = null;
let chartRegiones = null;

/**
 * Calcula estadísticas y crea visualizaciones
 * @param {Array} data - Datos de calificaciones
 */
function generarEstadisticas(data) {
    const todosRegistros = data;
    
    // Incluir tanto Ventas (OT) como Ventas (OC)
    const ventasRegistros = todosRegistros.filter(r => 
        r.tipo === 'Ventas (OT)' || r.tipo === 'Ventas (OC)'
    );
    
    const ventasStats = {
        bueno: ventasRegistros.filter(r => r.calificacion === 'Bueno').length,
        regular: ventasRegistros.filter(r => r.calificacion === 'Regular').length,
        malo: ventasRegistros.filter(r => r.calificacion === 'Malo').length,
        novotado: ventasRegistros.filter(r => !r.calificacion || r.calificacion.trim() === '').length,
        total: ventasRegistros.length
    };
    
    // Estadísticas para Conformidad
    const conformidadRegistros = todosRegistros.filter(r => r.tipo === 'Coordinador (Conformidad)');
    const conformidadStats = {
        bueno: conformidadRegistros.filter(r => r.calificacion === 'Bueno').length,
        regular: conformidadRegistros.filter(r => r.calificacion === 'Regular').length,
        malo: conformidadRegistros.filter(r => r.calificacion === 'Malo').length,
        novotado: conformidadRegistros.filter(r => !r.calificacion || r.calificacion.trim() === '').length,
        total: conformidadRegistros.length
    };
    
    // Estadísticas por Asesor (solo para Ventas)
    const asesoresStats = {};
    
    ventasRegistros.forEach(registro => {
        const asesor = registro.asesor || 'Sin asesor';
        if (!asesoresStats[asesor]) {
            asesoresStats[asesor] = {
                total: 0,
                bueno: 0,
                regular: 0,
                malo: 0
            };
        }
        
        asesoresStats[asesor].total++;
        
        if (registro.calificacion === 'Bueno') asesoresStats[asesor].bueno++;
        else if (registro.calificacion === 'Regular') asesoresStats[asesor].regular++;
        else if (registro.calificacion === 'Malo') asesoresStats[asesor].malo++;
    });
    
    // Verificar que la suma de bueno+regular+malo coincida con total para cada asesor
    Object.keys(asesoresStats).forEach(asesor => {
        const stats = asesoresStats[asesor];
        const suma = stats.bueno + stats.regular + stats.malo;
        // Si hay discrepancia, corregir el total
        if (suma !== stats.total) {
            console.warn(`Corrigiendo total para ${asesor}: ${stats.total} → ${suma}`);
            stats.total = suma;
        }
    });
    
    // Ranking de asesores (solo para Ventas)
    const asesoresRanking = Object.entries(asesoresStats)
        .map(([nombre, stats]) => ({
            nombre,
            total: stats.total,
            bueno: stats.bueno,
            porcentaje: stats.total > 0 ? (stats.bueno / stats.total * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.porcentaje - a.porcentaje);
    
    // Crear visualizaciones
    crearGraficosEstadisticas(ventasStats, conformidadStats, asesoresStats, asesoresRanking);
}

/**
 * Crea los gráficos y tablas de estadísticas
 * @param {Object} ventasStats - Estadísticas de ventas
 * @param {Object} conformidadStats - Estadísticas de conformidad
 * @param {Object} asesoresStats - Estadísticas por asesor
 * @param {Array} asesoresRanking - Ranking de asesores
 */
function crearGraficosEstadisticas(ventasStats, conformidadStats, asesoresStats, asesoresRanking) {
    // 1. Gráfico para Ventas (OT)
    const ctxVentas = document.getElementById('chartVentas').getContext('2d');
    
    // Destruir el gráfico existente si hay uno
    if (chartVentas && typeof chartVentas.destroy === 'function') {
        chartVentas.destroy();
    }
    
    chartVentas = new Chart(ctxVentas, {
        type: 'pie',
        data: {
            labels: ['Bueno', 'Regular', 'Malo', 'No votado'],
            datasets: [{
                data: [ventasStats.bueno, ventasStats.regular, ventasStats.malo, ventasStats.novotado],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth < 576 ? 'bottom' : 'bottom',
                    align: 'start',
                    labels: {
                        boxWidth: window.innerWidth < 576 ? 10 : 15,
                        font: {
                            size: window.innerWidth < 576 ? 9 : 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = Math.round(value / ventasStats.total * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // 2. Gráfico para Conformidad
    const ctxConformidad = document.getElementById('chartConformidad').getContext('2d');
    
    // Destruir el gráfico existente si hay uno
    if (chartConformidad && typeof chartConformidad.destroy === 'function') {
        chartConformidad.destroy();
    }
    
    chartConformidad = new Chart(ctxConformidad, {
        type: 'pie',
        data: {
            labels: ['Bueno', 'Regular', 'Malo', 'No votado'],
            datasets: [{
                data: [conformidadStats.bueno, conformidadStats.regular, conformidadStats.malo, conformidadStats.novotado],
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth < 576 ? 'bottom' : 'top',
                    labels: {
                        boxWidth: window.innerWidth < 576 ? 12 : 20,
                        font: {
                            size: window.innerWidth < 576 ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = Math.round(value / conformidadStats.total * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // 3. Tabla de calificaciones por asesor
    const tablaAsesores = document.getElementById('tablaAsesores');
    let tablaHtml = `
        <table class="stat-table">
            <thead>
                <tr>
                    <th>Asesor</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Convertir a array, ordenar por total (descendente) y limitar a 5
    const asesoresArray = Object.entries(asesoresStats)
        .map(([nombre, stats]) => ({nombre, ...stats}))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    asesoresArray.forEach(asesor => {
        tablaHtml += `
            <tr class="asesor-row" 
                data-bueno="${asesor.bueno}" 
                data-regular="${asesor.regular}" 
                data-malo="${asesor.malo}">
                <td>${asesor.nombre}</td>
                <td>${asesor.total}</td>
            </tr>
        `;
    });

    tablaHtml += `
            </tbody>
        </table>
        <div id="asesorTooltip" class="asesor-tooltip" style="display: none;"></div>
    `;
    tablaAsesores.innerHTML = tablaHtml;

    // Agregar manejadores de eventos para el tooltip
    const tooltip = document.getElementById('asesorTooltip');
    document.querySelectorAll('.asesor-row').forEach(row => {
        row.addEventListener('mouseover', function(e) {
            const bueno = this.getAttribute('data-bueno');
            const regular = this.getAttribute('data-regular');
            const malo = this.getAttribute('data-malo');
            
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div>Bueno: ${bueno}</div>
                    <div>Regular: ${regular}</div>
                    <div>Malo: ${malo}</div>
                </div>
            `;
            
            // Posicionar el tooltip
            const rowRect = this.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            tooltip.style.left = (rowRect.right + 10) + 'px';
            tooltip.style.top = (rowRect.top + scrollTop - tooltipRect.height/2 + rowRect.height/2) + 'px';
            tooltip.style.display = 'block';
        });
        
        row.addEventListener('mouseout', function() {
            tooltip.style.display = 'none';
        });
    });
    
    // 4. Ranking de asesores
    const rankingAsesores = document.getElementById('rankingAsesores');
    let rankingHtml = `
        <table class="stat-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Asesor</th>
                    <th>%</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Limitar el ranking a los 5 primeros
    const top5Ranking = asesoresRanking.slice(0, 5);

    top5Ranking.forEach((asesor, index) => {
        const esMejor = index === 0 ? 'best-performer' : '';
        rankingHtml += `
            <tr class="${esMejor} ranking-row" 
                data-total="${asesor.total}" 
                data-bueno="${asesor.bueno}">
                <td>${index + 1}</td>
                <td>${asesor.nombre}</td>
                <td>${asesor.porcentaje}%</td>
            </tr>
        `;
    });

    rankingHtml += `
            </tbody>
        </table>
        <div id="rankingTooltip" class="asesor-tooltip" style="display: none;"></div>
    `;
    rankingAsesores.innerHTML = rankingHtml;
    
    // Agregar manejadores de eventos para el tooltip del ranking
    const rankingTooltip = document.getElementById('rankingTooltip');
    document.querySelectorAll('.ranking-row').forEach(row => {
        row.addEventListener('mouseover', function(e) {
            const total = this.getAttribute('data-total');
            const bueno = this.getAttribute('data-bueno');
            
            rankingTooltip.innerHTML = `
                <div class="tooltip-content">
                    <div>Total: ${total} / Bueno: ${bueno}</div>
                </div>
            `;
            
            // Posicionar el tooltip
            const rowRect = this.getBoundingClientRect();
            const tooltipRect = rankingTooltip.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            rankingTooltip.style.left = (rowRect.right + 10) + 'px';
            rankingTooltip.style.top = (rowRect.top + scrollTop - tooltipRect.height/2 + rowRect.height/2) + 'px';
            rankingTooltip.style.display = 'block';
        });
        
        row.addEventListener('mouseout', function() {
            rankingTooltip.style.display = 'none';
        });
    });
}

/**
 * Actualiza el gráfico de líneas con tendencias
 * @param {Array} data - Datos para actualizar el gráfico
 */
function actualizarGraficoLineas(data) {
    // Agrupar datos por día (en lugar de por mes)
    const datosPorDia = {};
    const diasEtiquetas = [];
    
    data.forEach(item => {
        if (item.timestamp) {
            const fecha = new Date(item.timestamp);
            // Crear clave única para cada día (YYYY-MM-DD)
            const fechaKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`;
            
            // Formato DD/MM/YYYY para mostrar en el gráfico
            const etiquetaDia = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            
            if (!datosPorDia[fechaKey]) {
                datosPorDia[fechaKey] = {
                    fecha: fecha,
                    etiqueta: etiquetaDia,
                    bueno: 0,
                    regular: 0,
                    malo: 0,
                    total: 0
                };
                diasEtiquetas.push(fechaKey);
            }
            
            datosPorDia[fechaKey].total++;
            
            if (item.calificacion === 'Bueno') datosPorDia[fechaKey].bueno++;
            else if (item.calificacion === 'Regular') datosPorDia[fechaKey].regular++;
            else if (item.calificacion === 'Malo') datosPorDia[fechaKey].malo++;
        }
    });
    
    // Ordenar los días cronológicamente
    diasEtiquetas.sort();
    
    // Limitar a máximo 15 días si hay demasiados datos (para mejor visualización)
    let diasMostrados = diasEtiquetas;
    if (diasEtiquetas.length > 15) {
        diasMostrados = diasEtiquetas.slice(-15); // Mostrar los últimos 15 días
    }
    
    // Preparar datos y etiquetas para el gráfico
    const etiquetasFormateadas = diasMostrados.map(key => datosPorDia[key].etiqueta);
    const datosLineas = {
        bueno: diasMostrados.map(key => datosPorDia[key].bueno),
        regular: diasMostrados.map(key => datosPorDia[key].regular),
        malo: diasMostrados.map(key => datosPorDia[key].malo)
    };
    
    // Crear gráfico
    const ctx = document.getElementById('chartLineas').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (chartLineas && typeof chartLineas.destroy === 'function') {
        chartLineas.destroy();
    }

    chartLineas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetasFormateadas,
            datasets: [
                {
                    label: 'Bueno',
                    data: datosLineas.bueno,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Regular',
                    data: datosLineas.regular,
                    borderColor: '#FFC107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Malo',
                    data: datosLineas.malo,
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth < 576 ? 'bottom' : 'top',
                    labels: {
                        boxWidth: window.innerWidth < 576 ? 12 : 20,
                        font: {
                            size: window.innerWidth < 576 ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label; // Ya está en formato DD/MM/YYYY
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: window.innerWidth > 576,
                        text: 'Fecha'
                    },
                    ticks: {
                        maxRotation: 90, // Mayor rotación en móviles para ahorrar espacio
                        minRotation: window.innerWidth < 576 ? 90 : 45,
                        font: {
                            size: window.innerWidth < 576 ? 8 : 10
                        },
                        callback: function(value, index, values) {
                            // En móviles, mostrar menos etiquetas 
                            if (window.innerWidth < 576) {
                                return index % 3 === 0 ? this.getLabelForValue(value) : '';
                            }
                            return this.getLabelForValue(value);
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: window.innerWidth > 576,
                        text: 'Cantidad de Calificaciones'
                    },
                    ticks: {
                        precision: 0,
                        font: {
                            size: window.innerWidth < 576 ? 8 : 10
                        }
                    }
                }
            }
        }
    });
}

/**
 * Actualiza el gráfico de regiones
 * @param {Array} data - Datos para actualizar el gráfico
 */
function actualizarGraficoRegiones(data) {
    // Agregar agrupación por grupos para este gráfico
    const gruposDatos = {};
    
    // Agrupar datos por el campo "grupo"
    data.forEach(item => {
        const grupo = item.grupo || 'Sin grupo';
        
        if (!gruposDatos[grupo]) {
            gruposDatos[grupo] = {
                total: 0,
                bueno: 0,
                regular: 0,
                malo: 0
            };
        }
        
        gruposDatos[grupo].total++;
        
        if (item.calificacion === 'Bueno') gruposDatos[grupo].bueno++;
        else if (item.calificacion === 'Regular') gruposDatos[grupo].regular++;
        else if (item.calificacion === 'Malo') gruposDatos[grupo].malo++;
    });
    
    // Preparar datos para el gráfico
    const grupos = Object.keys(gruposDatos);
    const totalesPorGrupo = grupos.map(grupo => gruposDatos[grupo].total);
    
    // Crear gráfico
    const ctx = document.getElementById('chartRegiones').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (chartRegiones && typeof chartRegiones.destroy === 'function') {
        chartRegiones.destroy();
    }

    chartRegiones = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: grupos,
            datasets: [{
                label: 'Distribución por grupo',
                data: totalesPorGrupo,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Registros por grupo',
                    font: {
                        size: window.innerWidth < 576 ? 10 : 14
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 576 ? 8 : 10
                        },
                        maxRotation: window.innerWidth < 576 ? 90 : 0
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 576 ? 8 : 10
                        }
                    }
                }
            }
        }
    });
}

/**
 * Actualiza todas las visualizaciones con los datos filtrados
 * @param {Array} data - Datos para actualizar las visualizaciones
 */
function actualizarVisualizaciones(data) {
    // Generar estadísticas con los datos filtrados
    generarEstadisticas(data);
    
    // Actualizar el nuevo gráfico de líneas
    actualizarGraficoLineas(data);
    
    // Actualizar el nuevo gráfico de regiones
    actualizarGraficoRegiones(data);
}

/**
 * Ajusta el tamaño de los gráficos circulares según el tamaño de la pantalla
 */
function ajustarTamañoGraficosCirculares() {
    const cardSmallElements = document.querySelectorAll('.card-small');
    
    cardSmallElements.forEach(card => {
        if (window.innerWidth < 576) {
            // En móvil, hacer que el contenedor sea más alto
            const container = card.querySelector('.chart-container');
            if (container) {
                container.style.height = '200px';
                container.style.width = '100%';
                container.style.maxWidth = '200px';
                container.style.margin = '0 auto';
            }
        } else {
            // En escritorio, restaurar estilo
            const container = card.querySelector('.chart-container');
            if (container) {
                container.style.height = '';
                container.style.width = '';
                container.style.maxWidth = '';
                container.style.margin = '';
            }
        }
    });
}

// Exportar las funciones para uso global
window.EncuestasGraficos = {
    generarEstadisticas,
    actualizarGraficoLineas,
    actualizarGraficoRegiones,
    actualizarVisualizaciones,
    ajustarTamañoGraficosCirculares
}; 