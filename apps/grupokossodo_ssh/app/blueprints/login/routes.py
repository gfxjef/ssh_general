from flask import Blueprint, request, jsonify, render_template
import mysql.connector
import os
import logging
from dotenv import load_dotenv
from ...database import get_db_connection
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

    usuario_o_correo = data['usuario'].strip()
    password = data['pass']  # Contraseña en texto plano

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión con el servidor'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Consulta modificada para permitir login con usuario O correo
        cursor.execute(
            "SELECT correo, nombre, cargo, grupo, rango, usuario FROM usuarios WHERE (usuario = %s OR correo = %s) AND pass = %s",
            (usuario_o_correo, usuario_o_correo, password)
        )
        user = cursor.fetchone()

        if user:
            logger.info(f"Login exitoso: {usuario_o_correo}")
            return jsonify({
                'success': True,
                'user': {
                    'correo': user['correo'],
                    'nombre': user['nombre'],
                    'cargo': user['cargo'],
                    'grupo': user['grupo'],
                    'rango': user['rango'],
                    'usuario': user['usuario']
                }
            }), 200
        else:
            logger.warning(f"Intento fallido: {usuario_o_correo}")
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401

    except mysql.connector.Error as err:
        logger.error(f"Error de BD: {err}")
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
        
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@login_bp.route('/recover-password', methods=['POST'])
def recover_password():
    """Recupera la contraseña y la envía por correo electrónico"""
    if not request.is_json:
        return jsonify({'success': False, 'message': 'Se requiere JSON'}), 400
    
    data = request.get_json()
    if 'email' not in data:
        return jsonify({'success': False, 'message': 'Se requiere un correo electrónico'}), 400
    
    email = data['email'].strip()
    
    # Conectar a la base de datos
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión con el servidor'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Buscar el usuario por correo electrónico
        cursor.execute("SELECT nombre, usuario, pass FROM usuarios WHERE correo = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            logger.warning(f"Intento de recuperación para correo inexistente: {email}")
            return jsonify({'success': False, 'message': 'No se encontró una cuenta con ese correo electrónico'}), 404
        
        # Enviar correo electrónico con la contraseña
        email_enviado = enviar_correo_recuperacion(email, user['nombre'], user['usuario'], user['pass'])
        
        if email_enviado:
            logger.info(f"Contraseña enviada a: {email}")
            return jsonify({'success': True, 'message': 'Se ha enviado la contraseña a tu correo electrónico'}), 200
        else:
            logger.error(f"Error al enviar correo a: {email}")
            return jsonify({'success': False, 'message': 'Error al enviar el correo electrónico'}), 500
            
    except mysql.connector.Error as err:
        logger.error(f"Error de BD en recuperación: {err}")
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
        
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def enviar_correo_recuperacion(destinatario, nombre, usuario, password):
    """Envía un correo electrónico con la contraseña recuperada"""
    try:
        # Obtener credenciales desde variables de entorno
        email_user = os.environ.get('EMAIL_USER')
        email_password = os.environ.get('EMAIL_PASSWORD')
        
        if not email_user or not email_password:
            logger.error("Faltan credenciales de correo en variables de entorno")
            return False
        
        # Configurar mensaje
        msg = MIMEMultipart()
        msg['From'] = email_user
        msg['To'] = destinatario
        msg['Subject'] = "Recuperación de contraseña - Grupo Kossodo"
        
        # Crear el contenido del correo
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #3c4262; color: white; padding: 10px 20px; }}
                .content {{ padding: 20px; }}
                .credentials {{ background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #6cba9d; }}
                .footer {{ font-size: 12px; color: #777; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Grupo Kossodo - Recuperación de contraseña</h2>
                </div>
                <div class="content">
                    <p>Hola {nombre},</p>
                    <p>Recibimos una solicitud para recuperar tu contraseña. A continuación, encontrarás tus credenciales de acceso:</p>
                    
                    <div class="credentials">
                        <p><strong>Usuario:</strong> {usuario}</p>
                        <p><strong>Correo:</strong> {destinatario}</p>
                        <p><strong>Contraseña:</strong> {password}</p>
                    </div>
                    
                    <p>Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.</p>
                    <p>Si no solicitaste esta recuperación, por favor comunícate con el administrador del sistema.</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no responder a este correo.</p>
                    <p>&copy; 2025 Grupo Kossodo. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Conectar al servidor y enviar
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email_user, email_password)
        server.send_message(msg)
        server.quit()
        
        return True
        
    except Exception as e:
        logger.error(f"Error al enviar correo: {str(e)}")
        return False
