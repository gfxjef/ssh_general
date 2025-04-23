from flask import Blueprint, jsonify, render_template  # Añadido render_template
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