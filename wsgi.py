import sys
import os

# Agregar la ruta principal al path de Python
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Importar la aplicación werkzeug para el dispatcher
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple
from flask import Flask

# Importar las aplicaciones Flask
from apps.grupokossodo_ssh.app import create_app as create_kossodo_app
from apps.pdf_reader.backend.app import app as pdf_app
from apps.conf_entrega.app import app as conf_entrega_app
from apps.feedback_mail.main import app as feedback_mail_app  # Importar app de feedback

# Crear instancias de las aplicaciones
kossodo_app = create_kossodo_app()

# Crear una aplicación raíz simple
root_app = Flask(__name__)

@root_app.route('/')
def index():
    return """
    <h1>Servidor de aplicaciones</h1>
    <ul>
        <li><a href="/grupokossodo_ssh">Grupo Kossodo SSH</a></li>
        <li><a href="/pdf_reader">PDF Reader</a></li>
        <li><a href="/conf_entrega">Confirmación de Entrega</a></li>
        <li><a href="/feedback_mail">Sistema de Feedback y Encuestas</a></li>
    </ul>
    """

# Configurar el dispatcher con aplicaciones en rutas específicas
application = DispatcherMiddleware(root_app, {
    '/grupokossodo_ssh': kossodo_app,
    '/pdf_reader': pdf_app,
    '/conf_entrega': conf_entrega_app,
    '/feedback_mail': feedback_mail_app  # Añadir app de feedback al dispatcher
})

# Para ejecución directa en desarrollo
if __name__ == '__main__':
    run_simple('0.0.0.0', 5000, application, 
               use_reloader=True, use_debugger=True)