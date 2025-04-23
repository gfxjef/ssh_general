import os
import ftplib
import io
import base64
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler()])
logger = logging.getLogger('ftp')

# Cargar variables de entorno
load_dotenv()

FTP_CONFIG = {
    'host': os.getenv('FTP_HOST'),
    'user': os.getenv('FTP_USER'),
    'pass': os.getenv('FTP_PASS'),
    'base_path': '/public_html/python/grupokssd/rastreo'
}

def get_ftp_connection():
    """Establece y retorna una conexión FTP."""
    try:
        ftp = ftplib.FTP(FTP_CONFIG['host'])
        ftp.login(FTP_CONFIG['user'], FTP_CONFIG['pass'])
        return ftp
    except Exception as e:
        logger.error(f"Error al conectar al FTP: {e}")
        raise

def ensure_directory_exists(ftp, directory):
    """Asegura que el directorio existe, creándolo si es necesario."""
    try:
        # Dividir la ruta en componentes
        parts = directory.strip('/').split('/')
        current_dir = ''
        
        for part in parts:
            if not part:
                continue
                
            current_dir = current_dir + '/' + part if current_dir else '/' + part
            
            try:
                ftp.cwd(current_dir)
            except ftplib.error_perm:
                try:
                    ftp.mkd(current_dir)
                    ftp.cwd(current_dir)
                except Exception as e:
                    logger.error(f"Error al crear directorio {current_dir}: {e}")
                    return False
        
        return True
    except Exception as e:
        logger.error(f"Error al asegurar existencia de directorio {directory}: {e}")
        return False

def upload_base64_image(n_guia, image_data, file_name):
    """
    Sube una imagen codificada en base64 al servidor FTP.
    La carpeta para la guía debe haber sido creada previamente.
    
    Args:
        n_guia: Número de guía que servirá como nombre de la carpeta
        image_data: Imagen en formato base64 (incluye cabecera como 'data:image/png;base64,')
        file_name: Nombre del archivo a guardar
    
    Returns:
        URL completa de la imagen subida
    """
    try:
        # Extraer los datos de imagen de la cadena base64
        if image_data and ',' in image_data:
            image_data = image_data.split(',')[1]
        
        if not image_data:
            logger.error("Datos de imagen inválidos")
            return None
        
        # Decodificar los datos base64
        image_binary = base64.b64decode(image_data)
        
        # Conectar al FTP
        ftp = get_ftp_connection()
        
        # Construir el path completo para la carpeta de la guía
        directory = f"{FTP_CONFIG['base_path']}/{n_guia}"
        
        # Verificar que el directorio existe
        try:
            ftp.cwd('/')  # Ir a la raíz primero
            ftp.cwd(directory)
            logger.info(f"Usando directorio existente: {directory}")
        except:
            # Si no existe, intentar crearlo
            try:
                ftp.cwd('/')
                if ensure_directory_exists(ftp, directory):
                    logger.info(f"Directorio creado para la guía {n_guia}: {directory}")
                    ftp.cwd(directory)
                else:
                    logger.error(f"No se pudo crear el directorio para {n_guia}")
                    ftp.quit()
                    return None
            except Exception as e:
                logger.error(f"Error accediendo al directorio {directory}: {e}")
                ftp.quit()
                return None
        
        # Subir el archivo en fragmentos para evitar problemas con archivos grandes
        try:
            # Usar BytesIO para manejar la transmisión de datos de manera más eficiente
            bio = io.BytesIO(image_binary)
            # Configurar el tamaño del bloque a 8KB para un mejor manejo de la memoria
            ftp.storbinary(f'STOR {file_name}', bio, blocksize=8192)
            logger.info(f"Archivo {file_name} subido correctamente a {directory}")
        except Exception as e:
            logger.error(f"Error al subir archivo {file_name}: {e}")
            ftp.quit()
            return None
        
        # Cerrar conexión
        ftp.quit()
        
        # Retornar la URL completa
        return f"https://www.atusaludlicoreria.com/python/grupokssd/rastreo/{n_guia}/{file_name}"
    
    except Exception as e:
        logger.error(f"Error al subir imagen: {e}")
        return None

def upload_file(n_guia, file_object, file_name):
    """
    Sube un archivo al servidor FTP.
    La carpeta para la guía debe haber sido creada previamente.
    
    Args:
        n_guia: Número de guía que servirá como nombre de la carpeta
        file_object: Objeto de archivo (con método read())
        file_name: Nombre del archivo a guardar
    
    Returns:
        URL completa del archivo subido
    """
    try:
        # Conectar al FTP
        ftp = get_ftp_connection()
        
        # Construir el path completo para la carpeta de la guía
        directory = f"{FTP_CONFIG['base_path']}/{n_guia}"
        
        # Verificar que el directorio existe
        try:
            ftp.cwd('/')  # Ir a la raíz primero
            ftp.cwd(directory)
            logger.info(f"Usando directorio existente: {directory}")
        except:
            # Si no existe, intentar crearlo
            try:
                ftp.cwd('/')
                if ensure_directory_exists(ftp, directory):
                    logger.info(f"Directorio creado para la guía {n_guia}: {directory}")
                    ftp.cwd(directory)
                else:
                    logger.error(f"No se pudo crear el directorio para {n_guia}")
                    ftp.quit()
                    return None
            except Exception as e:
                logger.error(f"Error accediendo al directorio {directory}: {e}")
                ftp.quit()
                return None
        
        # Subir el archivo con tamaño de bloque optimizado
        try:
            ftp.storbinary(f'STOR {file_name}', file_object, blocksize=8192)
            logger.info(f"Archivo {file_name} subido correctamente a {directory}")
        except Exception as e:
            logger.error(f"Error al subir archivo {file_name}: {e}")
            ftp.quit()
            return None
        
        # Cerrar conexión
        ftp.quit()
        
        # Retornar la URL completa
        return f"https://www.atusaludlicoreria.com/python/grupokssd/rastreo/{n_guia}/{file_name}"
    
    except Exception as e:
        logger.error(f"Error al subir archivo: {e}")
        return None