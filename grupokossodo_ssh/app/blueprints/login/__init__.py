from .routes import login_bp

# Esta función permite importar directamente el blueprint desde este módulo
def get_blueprint():
    return login_bp
