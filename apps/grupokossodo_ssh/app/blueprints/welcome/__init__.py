from .routes import welcome_bp

# Esta función permite importar directamente el blueprint desde este módulo
def get_blueprint():
    return welcome_bp
