from .routes import inventory_bp

def get_blueprint():
    # Ensure we're using the right URL prefix
    return inventory_bp