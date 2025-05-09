import os
import shutil
import logging
import time
import fitz  # PyMuPDF
from PIL import Image
from flask import current_app

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, base_dir=None):
        """Inicializa el procesador de PDF."""
        # No usar current_app aquí, sino recibir el directorio base o calcularlo más tarde
        self.base_dir = base_dir
        
        # Estado del procesamiento
        self.current_progress = {
            "status": "idle",
            "current_file": None,
            "current_page": 0,
            "total_pages": 0,
            "percentage": 0
        }
    
    def get_base_dir(self):
        """Obtiene el directorio base donde se guardan los PDFs procesados"""
        if self.base_dir is None:
            self.base_dir = os.path.join(current_app.root_path, 'templates', 'pdf_reader', 'pdf')
            os.makedirs(self.base_dir, exist_ok=True)
            logger.info(f"Directorio base para PDFs: {self.base_dir}")
        return self.base_dir
    
    def get_progress(self):
        """Devuelve el estado actual del procesamiento."""
        return self.current_progress
    
    def process_pdf(self, pdf_path, delete_after=False):
        """
        Procesa un PDF extrayendo cada página en una imagen utilizando PyMuPDF y convierte la imagen a WEBP.
        
        Args:
            pdf_path: Ruta al archivo PDF.
            delete_after: Si se debe eliminar el PDF original después.
            
        Returns:
            dict: Información del procesamiento, incluyendo las rutas de las imágenes generadas.
        """
        try:
            pdf_filename = os.path.basename(pdf_path)
            pdf_name_without_ext = os.path.splitext(pdf_filename)[0]
            
            # Inicializar estado del procesamiento
            self.current_progress = {
                "status": "processing",
                "current_file": pdf_filename,
                "current_page": 0,
                "total_pages": 0,
                "percentage": 0,
                "start_time": time.time()
            }
            
            # Crear directorio para este PDF
            pdf_dir = os.path.join(self.get_base_dir(), pdf_name_without_ext)
            os.makedirs(pdf_dir, exist_ok=True)
            
            # Guardar una copia del PDF original en la misma carpeta
            original_pdf_path = os.path.join(pdf_dir, pdf_filename)
            shutil.copy2(pdf_path, original_pdf_path)
            logger.info(f"PDF original guardado en: {original_pdf_path}")
            
            # Abrir el PDF y extraer cada página a imagen
            doc = fitz.open(pdf_path)
            try:
                total_pages = doc.page_count
                self.current_progress["total_pages"] = total_pages
                images = []
                
                for i in range(total_pages):
                    page = doc.load_page(i)
                    pix = page.get_pixmap()
                    # Determinar el modo según la presencia de canal alfa
                    mode = "RGBA" if pix.alpha else "RGB"
                    # Convertir el pixmap a imagen PIL utilizando los datos del pixmap
                    img = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
                    
                    # Definir la ruta de salida en formato WEBP
                    webp_path = os.path.join(pdf_dir, f"page_{i+1}.webp")
                    img.save(webp_path, "WEBP", quality=100)
                    images.append(webp_path)
                    
                    # Actualizar el progreso
                    self.current_progress["current_page"] = i + 1
                    self.current_progress["percentage"] = int(((i + 1) / total_pages) * 100)
                    logger.info(f"Procesada página {i+1} de {total_pages}")
                
                # Crear una miniatura a partir de la primera página
                thumbnail = self.create_thumbnail_from_image(images[0], pdf_dir)
            finally:
                # Asegurarnos de cerrar el documento explícitamente
                doc.close()

            # Opcionalmente eliminar el PDF original
            if delete_after and os.path.exists(pdf_path):
                try:
                    time.sleep(1.0)  # Aumentar tiempo de espera
                    os.remove(pdf_path)
                    logger.info(f"PDF original eliminado: {pdf_path}")
                except Exception as e:
                    # No fallar la operación, solo registrar como advertencia
                    logger.warning(f"No se pudo eliminar el PDF original ({pdf_path}): {str(e)}")
                    # El procesamiento del PDF ya fue exitoso, no propagar este error
            
            # Calcular tiempo total de procesamiento
            end_time = time.time()
            processing_time = end_time - self.current_progress["start_time"]
            
            # Actualizar estado final
            self.current_progress["status"] = "completed"
            
            logger.info(f"Procesamiento completado: {pdf_filename}, {total_pages} páginas, {processing_time:.2f} segundos")
            
            return {
                "success": True,
                "pdf_path": original_pdf_path,
                "pdf_name": pdf_name_without_ext,
                "pages": total_pages,
                "images": images,
                "thumbnail": thumbnail,
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.current_progress = {
                "status": "error",
                "error": str(e),
                "current_file": pdf_filename if 'pdf_filename' in locals() else None
            }
            logger.error(f"Error procesando PDF {pdf_path}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "pdf_path": pdf_path
            }
    
    def create_thumbnail_from_image(self, image_path, pdf_dir):
        """Crea una miniatura a partir de la imagen de la primera página en formato WEBP."""
        try:
            img = Image.open(image_path)
            # Redimensionar para crear una miniatura
            img.thumbnail((300, 300))
            thumbnail_path = os.path.join(pdf_dir, "thumb_1.webp")
            img.save(thumbnail_path, "WEBP", quality=85)
            logger.info(f"Miniatura creada: {thumbnail_path}")
            return thumbnail_path
        except Exception as e:
            logger.error(f"Error al crear miniatura: {str(e)}")
            return None