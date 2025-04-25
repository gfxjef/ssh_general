import os
import time
import shutil
import logging
from flask import request, jsonify, send_from_directory, redirect, url_for, current_app, render_template
from werkzeug.utils import secure_filename
from . import pdf_reader_bp
from .pdf_processor import PDFProcessor

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de carga de archivos
ALLOWED_EXTENSIONS = {'pdf'}

# Variable global para el procesador
pdf_processor = None

def get_upload_folder():
    """Obtiene la carpeta de subida de archivos en tiempo de ejecución"""
    return os.path.join(current_app.root_path, 'templates', 'pdf_reader', 'uploads')

def init_pdf_processor():
    """Inicializa el procesador de PDF con el contexto de la aplicación disponible"""
    global pdf_processor
    if pdf_processor is None:
        pdf_processor = PDFProcessor()
    return pdf_processor

_initialized = False  # Variable para controlar si ya se inicializó

@pdf_reader_bp.record
def on_blueprint_register(state):
    """Se ejecuta cuando el blueprint se registra en la aplicación"""
    global _initialized
    if not _initialized:
        app = state.app
        with app.app_context():
            # Código original de setup_app
            pdf_dir = os.path.join(app.root_path, 'templates', 'pdf_reader', 'pdf')
            upload_dir = os.path.join(app.root_path, 'templates', 'pdf_reader', 'uploads')
            
            os.makedirs(pdf_dir, exist_ok=True)
            os.makedirs(upload_dir, exist_ok=True)
            
            logger.info(f"Directorios inicializados: {pdf_dir}, {upload_dir}")
            
            # Inicializar el procesador de PDF
            init_pdf_processor()
            
            _initialized = True

# Resto del código de tu archivo app.py...
@pdf_reader_bp.route('/')
def index():
    # Redirigir a la página de catálogo
    return redirect(url_for('pdf_reader.catalogo'))

@pdf_reader_bp.route('/catalogo')
def catalogo():
    return render_template('pdf_reader/catalogo.html')

@pdf_reader_bp.route('/upload')
def upload_page():
    return render_template('pdf_reader/upload.html')

@pdf_reader_bp.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(current_app.root_path, 'templates', 'pdf_reader', 'css'), filename)

@pdf_reader_bp.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(current_app.root_path, 'templates', 'pdf_reader', 'js'), filename)

@pdf_reader_bp.route('/pdf/<path:path>')
def serve_pdf_files(path):
    directory, file = os.path.split(path)
    pdf_dir = os.path.join(current_app.root_path, 'templates', 'pdf_reader', 'pdf', directory)
    return send_from_directory(pdf_dir, file)

@pdf_reader_bp.route('/listar-directorio')
def listar_directorio():
    """Endpoint para listar contenidos de un directorio específico"""
    dir_path = request.args.get('dir', '')
    
    # Por seguridad, solo permitir directorios específicos
    allowed_dirs = {
        'pdf': os.path.join(current_app.root_path, 'static', 'pdf_reader', 'pdf')
    }
    
    if dir_path not in allowed_dirs or not os.path.exists(allowed_dirs[dir_path]):
        return jsonify([])
    
    # Listar contenidos del directorio
    try:
        items = []
        for item in os.listdir(allowed_dirs[dir_path]):
            item_path = os.path.join(allowed_dirs[dir_path], item)
            is_dir = os.path.isdir(item_path)
            items.append({
                'name': item + ('/' if is_dir else ''),
                'isDirectory': is_dir,
                'path': os.path.join(dir_path, item)
            })
        return jsonify(items)
    except Exception as e:
        logger.error(f"Error al listar directorio {dir_path}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pdf_reader_bp.route('/listar-pdfs')
def listar_pdfs():
    """Endpoint para listar los PDFs disponibles"""
    pdfs = []
    
    # Buscar en frontend/pdf
    pdf_dir = os.path.join(current_app.root_path, 'static', 'pdf_reader', 'pdf')
    if os.path.exists(pdf_dir):
        for carpeta in os.listdir(pdf_dir):
            pdf_folder = os.path.join(pdf_dir, carpeta)
            if os.path.isdir(pdf_folder):
                # Buscar archivos PDF dentro de esta carpeta
                for archivo in os.listdir(pdf_folder):
                    if archivo.lower().endswith('.pdf'):
                        pdfs.append(archivo)
    
    pdfs.sort()  # Ordenar alfabéticamente
    return jsonify(pdfs)

@pdf_reader_bp.route('/listar-pdfs-procesados')
def listar_pdfs_procesados():
    """Endpoint para listar PDFs procesados y contar sus páginas basándose en las imágenes .webp"""
    processed_pdfs = []
    
    # Buscar en templates/pdf_reader/pdf (estructura correcta)
    frontend_pdf_dir = os.path.join(current_app.root_path, 'templates', 'pdf_reader', 'pdf')
    
    # Debug - verificar que el directorio existe
    logger.info(f"Buscando PDFs en: {frontend_pdf_dir}")
    if not os.path.exists(frontend_pdf_dir):
        logger.warning(f"Directorio no encontrado: {frontend_pdf_dir}")
        os.makedirs(frontend_pdf_dir, exist_ok=True)
        return jsonify([])
        
    # Listar directorios en la carpeta pdf
    logger.info(f"Contenido de {frontend_pdf_dir}: {os.listdir(frontend_pdf_dir) if os.path.exists(frontend_pdf_dir) else 'directorio no existe'}")
    
    # Recorrer cada carpeta de PDF en el directorio
    for pdf_folder in os.listdir(frontend_pdf_dir):
        folder_path = os.path.join(frontend_pdf_dir, pdf_folder)
        
        if os.path.isdir(folder_path):
            # Contar archivos .webp en la carpeta
            page_files = [f for f in os.listdir(folder_path) 
                       if f.startswith('page_') and f.endswith('.webp')]
            page_count = len(page_files)
            
            if page_count > 0:
                # Buscar un archivo thumbnail
                thumbnail = None
                for file in os.listdir(folder_path):
                    if file.startswith('thumb_') and file.endswith('.webp'):
                        thumbnail = f'/pdf/{pdf_folder}/{file}'
                        break
                
                processed_pdfs.append({
                    'name': pdf_folder,
                    'pages': page_count,
                    'has_images': True,
                    'thumbnail': thumbnail or f'/pdf/{pdf_folder}/page_1.webp'  # Usar la primera página como miniatura si no hay una específica
                })
    
    return jsonify(processed_pdfs)




def allowed_file(filename):
    """Verifica si la extensión del archivo es permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@pdf_reader_bp.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    """Endpoint para subir y procesar un PDF"""
    # Obtener el procesador de PDF
    processor = init_pdf_processor()
    
    if 'pdf' not in request.files:
        return jsonify({'success': False, 'error': 'No se envió archivo PDF'}), 400
    
    file = request.files['pdf']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No se seleccionó archivo'}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Guardar el archivo subido temporalmente
            filename = secure_filename(file.filename)
            # Usar get_upload_folder() en lugar de UPLOAD_FOLDER
            upload_folder = get_upload_folder()
            temp_path = os.path.join(upload_folder, filename)
            file.save(temp_path)
            
            # Procesar el PDF
            result = processor.process_pdf(temp_path, delete_after=True)
            
            # Si el procesamiento es exitoso pero falla la eliminación, 
            # aún considerarlo exitoso (verificar presencia de 'images')
            if result.get('images') and len(result.get('images', [])) > 0:
                return jsonify({
                    'success': True,
                    'pdf_name': result.get('pdf_name', ''),
                    'pages': result.get('pages', 0),
                    'message': f'PDF procesado correctamente con {result.get("pages", 0)} páginas'
                })
            elif not result['success']:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Error desconocido')
                }), 500
        except Exception as e:
            # Añadir manejo de excepciones general
            logger.error(f"Error en upload_pdf: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
    
    return jsonify({'success': False, 'error': 'Tipo de archivo no permitido'}), 400

@pdf_reader_bp.route('/view')
def view_pdf():
    """Página para visualizar un PDF específico"""
    pdf_param = request.args.get('pdf')
    return render_template('pdf_reader/index.html', pdf_url=pdf_param)

@pdf_reader_bp.route('/progreso-pdf')
def progreso_pdf():
    """Endpoint para consultar el progreso del procesamiento de PDF"""
    processor = init_pdf_processor()
    progress = processor.get_progress()
    return jsonify(progress)

@pdf_reader_bp.route('/ver')
def ver_catalogos():
    """Página para visualizar el listado completo de catálogos"""
    return render_template('pdf_reader/ver.html')