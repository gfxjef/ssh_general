from flask import Flask
from dotenv import load_dotenv
import logging
import os

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join('logs', 'app.log')),
        logging.StreamHandler()
    ]
)

def create_app(config_name=None):
    """Inicializa la aplicación Flask"""
    app = Flask(__name__)
    
    # Configuración de la aplicación
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'clave_secreta_por_defecto')
    
    # Registro de blueprints
    from .blueprints.login import get_blueprint as get_login_bp
    from .blueprints.welcome import get_blueprint as get_welcome_bp
    from .blueprints.records import get_blueprint as get_records_bp
    from .blueprints.inventory import get_blueprint as get_inventory_bp
    from .blueprints.bienestar import get_blueprint as get_bienestar_bp
    from .blueprints.bienestar import get_api_blueprint as get_bienestar_api_bp

    
    app.register_blueprint(get_login_bp(), url_prefix='/api')
    app.register_blueprint(get_welcome_bp(), url_prefix='/api')
    app.register_blueprint(get_records_bp())
    app.register_blueprint(get_inventory_bp(), url_prefix='/api')
    app.register_blueprint(get_bienestar_bp(), url_prefix='/bienestar')
    app.register_blueprint(get_bienestar_api_bp(), url_prefix='/api')  # API endpoints under /api

    # Add context processor for base_url
    @app.context_processor
    def inject_base_url():
        return {'base_url': '/grupokossodo_ssh'}

    # Ruta principal que devuelve la aplicación frontend
    @app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    @app.route('/health')
    def health():
        return {"status": "ok"}
    
    return app