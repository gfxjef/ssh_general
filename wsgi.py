import sys
import os

# Agregar la ruta principal al path de Python
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Importar la aplicación werkzeug para el dispatcher
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.serving import run_simple
from flask import Flask

# Importar las aplicaciones Flask
from grupokossodo_ssh.app import create_app as create_kossodo_app
from pdf_reader.backend.app import app as pdf_app

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
    </ul>
    """

# Configurar el dispatcher con aplicaciones en rutas específicas
application = DispatcherMiddleware(root_app, {
    '/grupokossodo_ssh': kossodo_app,
    '/pdf_reader': pdf_app
})

# Para ejecución directa en desarrollo
if __name__ == '__main__':
    run_simple('0.0.0.0', 5001, application, 
               use_reloader=True, use_debugger=True)