import os
import json
import logging
from datetime import datetime
from flask import Blueprint, render_template, request, jsonify, current_app
from ...database import get_db_connection
from .utils import (
    ensure_table_exists, ensure_column_exists, 
    get_stock_by_group, send_email_notification
)

# Configure logging
logger = logging.getLogger(__name__)

# Create the inventory blueprint
inventory_bp = Blueprint('inventory_bp', __name__, template_folder='../../templates')

# Define table columns
merch_columns = [
    "id INT AUTO_INCREMENT PRIMARY KEY",
    "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP",
    "responsable VARCHAR(255)",
    "merch_lapiceros_normales INT DEFAULT 0",
    "merch_lapicero_ejecutivos INT DEFAULT 0",
    "merch_blocks INT DEFAULT 0",
    "merch_tacos INT DEFAULT 0",
    "merch_gel_botella INT DEFAULT 0",
    "merch_bolas_antiestres INT DEFAULT 0",
    "merch_padmouse INT DEFAULT 0",
    "merch_bolsa INT DEFAULT 0",
    "merch_lapiceros_esco INT DEFAULT 0",
    "observaciones TEXT"
]

solicitud_columns = [
    "id INT AUTO_INCREMENT PRIMARY KEY",
    "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP",
    "solicitante VARCHAR(255)",
    "grupo VARCHAR(50)",
    "ruc VARCHAR(50)",
    "fecha_visita DATE",
    "cantidad_packs INT DEFAULT 0",
    "productos TEXT",
    "catalogos TEXT",
    "status VARCHAR(50) DEFAULT 'pending'"
]

confirmacion_columns = [
    "id INT AUTO_INCREMENT PRIMARY KEY",
    "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP",
    "solicitud_id INT NOT NULL",
    "confirmador VARCHAR(255) NOT NULL",
    "observaciones TEXT",
    "productos TEXT",
    "grupo VARCHAR(50)",
    "FOREIGN KEY (solicitud_id) REFERENCES inventario_solicitudes(id)"
]

# Initialize tables - proper way to handle initialization for blueprints
def init_tables():
    """Create necessary database tables if they don't exist."""
    logger.info("Initializing inventory tables")
    # Create inventory tables
    for grupo in ['kossodo', 'kossomet']:
        ensure_table_exists(f"inventario_merch_{grupo}", merch_columns)
    
    # Create solicitudes and confirmacion tables
    ensure_table_exists("inventario_solicitudes", solicitud_columns)
    ensure_table_exists("inventario_solicitudes_conf", confirmacion_columns)

# Register initialization function to be called when app is created
@inventory_bp.record_once
def on_register(state):
    app = state.app
    with app.app_context():
        init_tables()

# ---------------------------------------------------------
# ENDPOINTS DE INVENTARIO (MERCH)
# ---------------------------------------------------------

@inventory_bp.route('/inventory', methods=['GET'])
def obtener_inventario():
    tabla_param = request.args.get('tabla')
    if tabla_param not in ['kossodo', 'kossomet']:
        return jsonify({"error": "Parámetro 'tabla' inválido. Use 'kossodo' o 'kossomet'."}), 400
    
    table_name = f"inventario_merch_{tabla_param}"
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(f"SELECT * FROM {table_name} ORDER BY timestamp DESC;")
        registros = cursor.fetchall()
        return jsonify(registros), 200
    except Exception as e:
        logger.error(f"Error al obtener inventario: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@inventory_bp.route('/inventory', methods=['POST'])
def agregar_inventario():
    tabla_param = request.args.get('tabla')
    if tabla_param not in ['kossodo', 'kossomet']:
        return jsonify({"error": "Parámetro 'tabla' inválido. Use 'kossodo' o 'kossomet'."}), 400
    
    table_name = f"inventario_merch_{tabla_param}"
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No se proporcionaron datos en formato JSON."}), 400
    
    columnas = []
    valores = []
    
    for key, val in data.items():
        if key in ['responsable', 'observaciones'] or key.startswith('merch_'):
            columnas.append(key)
            valores.append(val)
    
    if not columnas:
        return jsonify({"error": "No se han enviado campos válidos para insertar."}), 400
    
    placeholders = ", ".join(["%s"] * len(valores))
    columnas_str = ", ".join(f"`{col}`" for col in columnas)
    query = f"INSERT INTO {table_name} ({columnas_str}) VALUES ({placeholders});"
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute(query, tuple(valores))
        conn.commit()
        nuevo_id = cursor.lastrowid
        return jsonify({"message": "Registro agregado exitosamente", "id": nuevo_id}), 201
    except Exception as e:
        conn.rollback()
        logger.error(f"Error al agregar inventario: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@inventory_bp.route('/nuevo_producto', methods=['POST'])
def nuevo_producto():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos en formato JSON."}), 400
    
    grupo = data.get('grupo')
    nombre_producto = data.get('nombre_producto')
    columna = data.get('columna')
    cantidad = data.get('cantidad', 0)
    
    if grupo not in ['kossodo', 'kossomet']:
        return jsonify({"error": "El grupo debe ser 'kossodo' o 'kossomet'."}), 400
    
    if not columna or not nombre_producto:
        return jsonify({"error": "Faltan datos: nombre_producto o columna."}), 400
    
    table_name = f"inventario_merch_{grupo}"
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor()
    try:
        # Verificar si la columna ya existe, si no, crearla
        if ensure_column_exists(table_name, columna, "INT DEFAULT 0"):
            # Insertar el nuevo producto
            insert_sql = f"INSERT INTO {table_name} (`{columna}`) VALUES (%s);"
            cursor.execute(insert_sql, (cantidad,))
            conn.commit()
            nuevo_id = cursor.lastrowid
            return jsonify({"message": "Nuevo producto agregado correctamente", "id": nuevo_id}), 201
        else:
            return jsonify({"error": "Error al crear la columna en la base de datos"}), 500
    except Exception as e:
        conn.rollback()
        logger.error(f"Error al agregar nuevo producto: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@inventory_bp.route('/inventory/stock', methods=['GET'])
def obtener_stock():
    """
    Get inventory stock for a specific group
    Maps to /api/stock when the blueprint is registered with url_prefix='/api'
    """
    grupo = request.args.get('grupo')
    if grupo not in ['kossodo', 'kossomet']:
        return jsonify({"error": "Grupo inválido. Use 'kossodo' o 'kossomet'."}), 400
    
    inventario_table = f"inventario_merch_{grupo}"
    stock_table = f"inventario_stock_{grupo}"
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Get all columns that start with merch_
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME LIKE 'merch\\_%'
        """, (inventario_table,))
        
        cols = [row['COLUMN_NAME'] for row in cursor.fetchall()]
        
        # Calculate total inventory per product
        inventory_totals = {}
        for col in cols:
            cursor.execute(f"SELECT SUM(`{col}`) AS total FROM {inventario_table}")
            result = cursor.fetchone()
            total = result['total'] if result['total'] is not None else 0
            inventory_totals[col] = total
        
        # Calculate used products from confirmed requests
        request_totals = {col: 0 for col in cols}
        cursor.execute("SELECT productos FROM inventario_solicitudes_conf WHERE grupo = %s", (grupo,))
        conf_rows = cursor.fetchall()
        
        for row in conf_rows:
            try:
                productos_dict = json.loads(row['productos']) if row['productos'] else {}
                for prod, qty in productos_dict.items():
                    if prod in request_totals:
                        request_totals[prod] += qty
            except Exception as e:
                logger.error(f"Error processing productos JSON: {str(e)}")
        
        # Calculate available stock
        stock = {}
        for col in cols:
            stock[col] = inventory_totals.get(col, 0) - request_totals.get(col, 0)
        
        # Store current stock in stock table
        create_stock_query = f"""
            CREATE TABLE IF NOT EXISTS {stock_table} (
                id INT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """
        cursor.execute(create_stock_query)
        conn.commit()
        
        # Check existing columns in stock table
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME LIKE 'merch\\_%'
        """, (stock_table,))
        
        stock_cols_existing = {row['COLUMN_NAME'] for row in cursor.fetchall()}
        
        # Add missing columns to stock table
        for col in cols:
            if col not in stock_cols_existing:
                alter_query = f"ALTER TABLE {stock_table} ADD COLUMN `{col}` INT DEFAULT 0;"
                cursor.execute(alter_query)
                conn.commit()
        
        # Update stock table with current values
        columns_list = ', '.join([f"`{col}`" for col in cols])
        placeholders = ', '.join(['%s'] * len(cols))
        values = [stock[col] for col in cols]
        update_parts = ', '.join([f"`{col}` = VALUES(`{col}`)" for col in cols])
        
        insert_query = f"""
            INSERT INTO {stock_table} (id, {columns_list})
            VALUES (1, {placeholders})
            ON DUPLICATE KEY UPDATE {update_parts};
        """
        cursor.execute(insert_query, values)
        conn.commit()
        
        # Get updated stock record
        cursor.execute(f"SELECT * FROM {stock_table} WHERE id = 1;")
        stock_row = cursor.fetchone()
        
        return jsonify(stock_row), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error getting stock: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# ENDPOINTS PARA SOLICITUDES
# ---------------------------------------------------------
@inventory_bp.route('/inventory/solicitud', methods=['POST'])
def crear_solicitud():
    """
    Create a new inventory request
    Maps to /api/solicitud when the blueprint is registered with url_prefix='/api'
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos en formato JSON."}), 400
    
    solicitante = data.get('solicitante')
    grupo = data.get('grupo')
    ruc = data.get('ruc')
    fecha_visita = data.get('fecha_visita')
    cantidad_packs = data.get('cantidad_packs', 0)
    productos = data.get('productos', [])
    catalogos = data.get('catalogos', "")
    
    if not solicitante or not grupo or not ruc or not fecha_visita:
        return jsonify({"error": "Faltan campos requeridos: solicitante, grupo, ruc, fecha_visita."}), 400
    
    productos_str = json.dumps(productos)
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor()
    try:
        # Ensure table exists
        ensure_table_exists("inventario_solicitudes", solicitud_columns)
        
        insert_sql = """
            INSERT INTO inventario_solicitudes
            (solicitante, grupo, ruc, fecha_visita, cantidad_packs, productos, catalogos)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """
        values = (solicitante, grupo, ruc, fecha_visita, cantidad_packs, productos_str, catalogos)
        cursor.execute(insert_sql, values)
        conn.commit()
        nuevo_id = cursor.lastrowid
        
        # Prepare email data
        solicitud_data = {
            "id": nuevo_id,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "solicitante": solicitante,
            "grupo": grupo,
            "ruc": ruc,
            "fecha_visita": fecha_visita,
            "cantidad_packs": cantidad_packs,
            "productos": productos,
            "catalogos": catalogos,
            "status": "pending"
        }
        
        # Send email notification
        recipients = [
            "jcamacho@kossodo.com",
            "rbazan@kossodo.com",
            "creatividad@kossodo.com",
            "eventos@kossodo.com"
        ]
        subject = f"Nueva Solicitud de Merchandising (ID: {nuevo_id}) - {solicitante}"
        
        # Use the send_email_notification function from utils.py
        from threading import Thread
        Thread(target=send_email_notification, args=(recipients, subject, solicitud_data)).start()
        
        return jsonify({"message": "Solicitud creada exitosamente", "id": nuevo_id}), 201
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error creating solicitud: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@inventory_bp.route('/solicitudes', methods=['GET'])
def obtener_solicitudes():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    status_param = request.args.get('status')
    id_param = request.args.get('id')
    
    cursor = conn.cursor(dictionary=True)
    try:
        base_query = "SELECT * FROM inventario_solicitudes"
        conditions = []
        values = []
        
        if status_param:
            conditions.append("status = %s")
            values.append(status_param)
        
        if id_param:
            conditions.append("id = %s")
            values.append(id_param)
        
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        base_query += " ORDER BY timestamp DESC"
        cursor.execute(base_query, tuple(values))
        rows = cursor.fetchall()
        
        # Process productos field from JSON to list for each row
        for row in rows:
            if row.get('productos'):
                try:
                    row['productos'] = json.loads(row['productos'])
                except:
                    pass
        
        return jsonify(rows), 200
    except Exception as e:
        logger.error(f"Error al obtener solicitudes: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@inventory_bp.route('/solicitudes/<int:solicitud_id>/confirm', methods=['PUT'])
def confirmar_solicitud(solicitud_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos en formato JSON."}), 400
    
    confirmador = data.get('confirmador')
    observaciones = data.get('observaciones', "")
    productos_finales = data.get('productos', {})
    
    if not confirmador:
        return jsonify({"error": "El campo 'confirmador' es requerido."}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if the request exists and is pending
        cursor.execute("SELECT status, grupo FROM inventario_solicitudes WHERE id = %s", (solicitud_id,))
        solicitud = cursor.fetchone()
        
        if not solicitud:
            return jsonify({"error": "La solicitud no existe."}), 404
        
        if solicitud['status'] != 'pending':
            return jsonify({"error": f"La solicitud no está pendiente (status actual: {solicitud['status']})."}), 400
        
        grupo = solicitud['grupo']
        conf_table = "inventario_solicitudes_conf"
        productos_json = json.dumps(productos_finales) if productos_finales else None
        
        # Insert confirmation
        insert_sql = f"""
            INSERT INTO {conf_table} (solicitud_id, confirmador, observaciones, productos, grupo)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(insert_sql, (solicitud_id, confirmador, observaciones, productos_json, grupo))
        
        # Update request status
        cursor.execute("UPDATE inventario_solicitudes SET status = 'confirmed' WHERE id = %s", (solicitud_id,))
        conn.commit()
        
        return jsonify({"message": "Solicitud confirmada exitosamente"}), 200
    except Exception as e:
        conn.rollback()
        logger.error(f"Error en confirmación: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@inventory_bp.route('/confirmaciones', methods=['GET'])
def obtener_confirmaciones():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT c.*, s.solicitante, s.ruc, s.fecha_visita, s.cantidad_packs
            FROM inventario_solicitudes_conf c
            JOIN inventario_solicitudes s ON c.solicitud_id = s.id
            ORDER BY c.timestamp DESC;
        """
        cursor.execute(query)
        confirmaciones = cursor.fetchall()
        
        # Process productos field from JSON
        for conf in confirmaciones:
            if conf.get('productos'):
                try:
                    conf['productos'] = json.loads(conf['productos'])
                except:
                    pass
        
        return jsonify(confirmaciones), 200
    except Exception as e:
        logger.error(f"Error al obtener confirmaciones: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Add this route to inventory/routes.py if it's not already there
@inventory_bp.route('/inventory/merchandising/solicitud', methods=['GET'])
def solicitud_merchandising():
    """Muestra la página de solicitud de merchandising"""
    return render_template('merchandising/solicitud.html')