from .routes import bienestar_bp
from .api import bienestar_api_bp

def get_blueprint():
    return bienestar_bp

def get_api_blueprint():  # New function
    return bienestar_api_bp