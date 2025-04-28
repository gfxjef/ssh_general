from flask import Blueprint, request, jsonify, render_template
import mysql.connector
import os
import logging
from dotenv import load_dotenv
from ...database import get_db_connection

# Cargar variables de entorno desde .env si es necesario
load_dotenv()

# Crear el blueprint para el endpoint de login
login_bp = Blueprint('login_bp', __name__, template_folder='../../templates')

# Configuración de logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

@login_bp.route('/login', methods=['GET'])
def show_login():
    """Muestra la página de inicio de sesión"""
    return render_template('login/index.html')

@login_bp.route('/login', methods=['POST'])
def handle_login():
    # Validar que se reciba JSON
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Se requiere JSON'}), 400

    data = request.get_json()
    if 'usuario' not in data or 'pass' not in data:
        return jsonify({'success': False, 'message': 'Faltan usuario o contraseña'}), 400

    usuario = data['usuario'].strip()
    password = data['pass']  # Contraseña en texto plano

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión con el servidor'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Consulta para autenticar. Añadimos "rango" a la selección
        cursor.execute(
            "SELECT correo, nombre, cargo, grupo, rango FROM usuarios WHERE usuario = %s AND pass = %s",
            (usuario, password)
        )
        user = cursor.fetchone()

        if user:
            logger.info(f"Login exitoso: {usuario}")
            return jsonify({
                'success': True,
                'user': {
                    'correo': user['correo'],
                    'nombre': user['nombre'],
                    'cargo': user['cargo'],
                    'grupo': user['grupo'],
                    'rango': user['rango']  # Añadimos rango a la respuesta
                }
            }), 200
        else:
            logger.warning(f"Intento fallido: {usuario}")
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401

    except mysql.connector.Error as err:
        logger.error(f"Error de BD: {err}")
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
        
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
