from flask import Blueprint, url_for

pdf_reader_bp = Blueprint('pdf_reader', __name__, 
                          template_folder='../../templates/pdf_reader',
                          static_folder='../../templates/pdf_reader',  # Usar templates como carpeta de estáticos
                          static_url_path='/pdf_reader/assets',  # URL pública para los estáticos
                          url_prefix='/pdf_reader')

# Importar las rutas después de crear el blueprint para evitar importaciones circulares
from . import app as routes

# Función para obtener el blueprint (similar a otros blueprints en tu proyecto)
def get_blueprint():
    return pdf_reader_bp

@pdf_reader_bp.context_processor
def inject_pdf_reader_url():
    return {
        'pdf_reader_base_url': lambda: url_for('pdf_reader.index')[:-1]
    }