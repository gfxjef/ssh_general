from flask import Blueprint, jsonify, render_template, request
from datetime import datetime
from ...database import get_db_connection

# Crear el blueprint
bp = Blueprint('records', __name__, url_prefix='/api')


# Definir el nombre de la tabla
TABLE_NAME = "envio_de_encuestas"

@bp.route('/records', methods=['GET'])
def get_records():
    """Endpoint para obtener todos los registros de calificaciones"""
    try:
        # Obtener conexión a la base de datos
        cnx = get_db_connection()
        if cnx is None:
            return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500
        
        # Ejecutar consulta
        cursor = cnx.cursor(dictionary=True)
        query = f"SELECT * FROM `{TABLE_NAME}`;"
        cursor.execute(query)
        records = cursor.fetchall()
        
        # Cerrar cursor y conexión
        cursor.close()
        cnx.close()
        
        # Devolver resultados
        return jsonify({'status': 'success', 'records': records}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
@bp.route('/encuestas', methods=['GET'])
def show_encuestas():
    """Muestra la página de encuestas de calificación"""
    return render_template('ventas/encuestas/index.html')

@bp.route('/record-conformidad/<int:record_id>', methods=['GET', 'POST'])
def record_conformidad(record_id):
    """Endpoint para obtener o actualizar la conformidad de un registro"""
    try:
        # Obtener conexión a la base de datos
        cnx = get_db_connection()
        if cnx is None:
            return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500
        
        cursor = cnx.cursor(dictionary=True)
        
        if request.method == 'GET':
            # Obtener información de conformidad existente
            query = f"SELECT conformidad, conformidad_obs, conformidad_timestamp FROM `{TABLE_NAME}` WHERE idcalificacion = %s;"
            cursor.execute(query, (record_id,))
            record = cursor.fetchone()
            
            # Cerrar cursor y conexión
            cursor.close()
            cnx.close()
            
            return jsonify({'status': 'success', 'record': record}), 200
            
        elif request.method == 'POST':
            # Actualizar información de conformidad
            data = request.json
            today = datetime.now().strftime('%Y-%m-%d')
            
            query = f"UPDATE `{TABLE_NAME}` SET conformidad = %s, conformidad_obs = %s, conformidad_timestamp = %s WHERE idcalificacion = %s;"
            cursor.execute(query, (
                data.get('conformidad'),
                data.get('conformidad_obs'),
                today,
                record_id
            ))
            
            cnx.commit()
            cursor.close()
            cnx.close()
            
            return jsonify({'status': 'success', 'message': 'Conformidad actualizada correctamente'}), 200
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500