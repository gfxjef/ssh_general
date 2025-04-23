import os
import logging
import pymysql
import pymysql.cursors
from dotenv import load_dotenv
from datetime import datetime


# Configurar logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler()])
logger = logging.getLogger('db')

def verificar_credenciales(username, password):
    """Verifica las credenciales de usuario contra la base de datos."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            query = """
                SELECT * FROM usuarios 
                WHERE usuario = %s AND pass = %s
            """
            cursor.execute(query, (username, password))
            user = cursor.fetchone()
            return user is not None
    except Exception as e:
        logger.error(f"Error al verificar credenciales: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()
                        
# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
DB_CONFIG = {
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'host': os.getenv('MYSQL_HOST'),
    'database': os.getenv('MYSQL_DATABASE'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_connection():
    """Establece y retorna una conexión a la base de datos."""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"Error de conexión a la base de datos: {e}")
        raise

def check_and_create_tables():
    """Verifica y crea las tablas si no existen."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            # Tabla seguimiento_ruta
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seguimiento_ruta (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    n_ruta VARCHAR(100) NOT NULL,
                    placa_vehiculo VARCHAR(20) NOT NULL,
                    operador_1 VARCHAR(100) NOT NULL,
                    auxiliar_1 VARCHAR(100) NOT NULL
                )
            """)
            
            # Tabla seguimiento_guia
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seguimiento_guia (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    id_guia INT NOT NULL,
                    id_salida INT NOT NULL,
                    n_guia VARCHAR(100) NOT NULL,
                    direccion TEXT NOT NULL,
                    contacto VARCHAR(100) NOT NULL,
                    cliente VARCHAR(100) NOT NULL,
                    telefono VARCHAR(20) NOT NULL,
                    cargo VARCHAR(100) NOT NULL,
                    detalles TEXT NOT NULL,
                    entrega_fecha DATETIME,
                    entregado BOOLEAN DEFAULT FALSE,
                    firma BLOB,
                    rece_nombre VARCHAR(100),
                    rece_dni VARCHAR(20),
                    rece_cargo VARCHAR(100),
                    rece_firma BLOB,
                    fotos TEXT,
                    motivo_rechazo VARCHAR(100),
                    observaciones_rechazo TEXT,
                    UNIQUE KEY unique_id_guia (id_guia),
                    FOREIGN KEY (id_salida) REFERENCES seguimiento_ruta(id)
                )
            """)
            
            # Tabla seguimiento_ventas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seguimiento_ventas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    id_seg_vent INT NOT NULL,
                    id_guia INT NOT NULL,
                    n_oc VARCHAR(100) NOT NULL,
                    doc TEXT,
                    UNIQUE KEY unique_id_seg_vent (id_seg_vent),
                    FOREIGN KEY (id_guia) REFERENCES seguimiento_guia(id_guia)
                )
            """)
        
        logger.info("Tablas verificadas/creadas con éxito")
        connection.commit()
    except Exception as e:
        logger.error(f"Error al verificar/crear tablas: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'connection' in locals():
            connection.close()

def verify_table_columns():
    """Verifica que las tablas tengan todas las columnas necesarias."""
    required_columns = {
        'seguimiento_ruta': ['timestamp', 'id_salida', 'n_ruta', 'placa_vehiculo', 'operador_1', 'auxiliar_1'],
        'seguimiento_guia': ['timestamp', 'id_guia', 'id_salida', 'n_guia', 'direccion', 'contacto', 'cliente', 
                             'telefono', 'cargo', 'detalles', 'entrega_fecha', 'entregado', 'firma', 'rece_nombre', 
                             'rece_dni', 'rece_cargo', 'rece_firma', 'fotos', 'motivo_rechazo', 'observaciones_rechazo'],
        'seguimiento_ventas': ['timestamp', 'id_seg_vent', 'id_guia', 'n_oc', 'doc']
    }
    
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            for table, columns in required_columns.items():
                # Verificar si la tabla existe
                cursor.execute(f"SHOW TABLES LIKE '{table}'")
                if cursor.fetchone() is None:
                    logger.warning(f"La tabla {table} no existe, no se pueden verificar sus columnas")
                    continue
                
                # Obtener columnas existentes
                cursor.execute(f"SHOW COLUMNS FROM {table}")
                existing_columns = [column['Field'].lower() for column in cursor.fetchall()]
                
                # Verificar columnas faltantes
                missing_columns = [col for col in columns if col.lower() not in existing_columns]
                
                if missing_columns:
                    logger.warning(f"Faltan columnas en la tabla {table}: {missing_columns}")
                    # Aquí se podrían agregar las columnas faltantes si es necesario
                else:
                    logger.info(f"La tabla {table} tiene todas las columnas requeridas")
    except Exception as e:
        logger.error(f"Error al verificar columnas de las tablas: {e}")
        raise
    finally:
        if 'connection' in locals():
            connection.close()

# Funciones para operaciones CRUD
def guardar_seguimiento_ruta(n_ruta, placa_vehiculo, operador_1, auxiliar_1):
    """Guarda un nuevo registro en la tabla seguimiento_ruta y retorna el id_salida generado."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            query = """
                INSERT INTO seguimiento_ruta (n_ruta, placa_vehiculo, operador_1, auxiliar_1)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (n_ruta, placa_vehiculo, operador_1, auxiliar_1))
            connection.commit()
            
            # Obtener el id_salida generado
            cursor.execute("SELECT LAST_INSERT_ID() as id_salida")
            result = cursor.fetchone()
            return result['id_salida'] if result else None
    except Exception as e:
        logger.error(f"Error al guardar seguimiento_ruta: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'connection' in locals():
            connection.close()

def guardar_seguimiento_guia(id_salida, n_guia, direccion, contacto, cliente, telefono, cargo, detalles, entrega_fecha=None):
    """Guarda un nuevo registro en la tabla seguimiento_guia y retorna el id_guia generado."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            # Primero, obtener el máximo id_guia existente
            cursor.execute("SELECT MAX(id_guia) as max_id FROM seguimiento_guia")
            result = cursor.fetchone()
            next_id_guia = 1  # Valor por defecto si no hay registros
            if result and result['max_id'] is not None:
                next_id_guia = result['max_id'] + 1
            
            # Insertar con el nuevo id_guia
            query = """
                INSERT INTO seguimiento_guia 
                (id_guia, id_salida, n_guia, direccion, contacto, cliente, telefono, cargo, detalles, entrega_fecha)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (next_id_guia, id_salida, n_guia, direccion, contacto, cliente, telefono, cargo, detalles, entrega_fecha))
            connection.commit()
            
            # Crear directorio en FTP para esta guía
            try:
                import os
                from .ftp_utils import get_ftp_connection, ensure_directory_exists
                
                FTP_BASE_PATH = '/public_html/python/grupokssd/rastreo'
                ftp = get_ftp_connection()
                
                # Navegar a la raíz primero
                ftp.cwd('/')
                
                # Crear directorio para la guía
                directory = f"{FTP_BASE_PATH}/{n_guia}"
                if ensure_directory_exists(ftp, directory):
                    logger.info(f"Directorio FTP creado para la guía {n_guia}: {directory}")
                else:
                    logger.error(f"No se pudo crear el directorio FTP para la guía {n_guia}")
                
                # Cerrar conexión FTP
                ftp.quit()
            except Exception as e:
                logger.error(f"Error al crear directorio FTP para la guía {n_guia}: {e}")
                # No afecta el flujo principal, continuamos aunque falle la creación del directorio
            
            return next_id_guia
    except Exception as e:
        logger.error(f"Error al guardar seguimiento_guia: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'connection' in locals():
            connection.close()

def guardar_seguimiento_ventas(id_guia, n_oc, doc1=None, doc2=None, doc3=None, doc4=None):
    """Guarda un nuevo registro en la tabla seguimiento_ventas y retorna el id_seg_vent generado."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            # Primero, obtener el máximo id_seg_vent existente
            cursor.execute("SELECT MAX(id_seg_vent) as max_id FROM seguimiento_ventas")
            result = cursor.fetchone()
            next_id_seg_vent = 1  # Valor por defecto si no hay registros
            if result and result['max_id'] is not None:
                next_id_seg_vent = result['max_id'] + 1
            
            # Obtener número de guía para almacenamiento de documentos
            cursor.execute("SELECT n_guia FROM seguimiento_guia WHERE id_guia = %s", (id_guia,))
            guia_result = cursor.fetchone()
            n_guia = guia_result['n_guia'] if guia_result else None
            
            # Procesar los documentos para el nuevo formato (URLs separadas por comas)
            doc = None
            if any([doc1, doc2, doc3, doc4]):
                # Filtrar los documentos que no son None o vacíos
                docs = [d for d in [doc1, doc2, doc3, doc4] if d]
                if docs:
                    # Unir las URLs con comas
                    doc = ','.join(docs)
            
            # Insertar con el nuevo id_seg_vent
            query = """
                INSERT INTO seguimiento_ventas 
                (id_seg_vent, id_guia, n_oc, doc)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (next_id_seg_vent, id_guia, n_oc, doc))
            connection.commit()
            
            return next_id_seg_vent
    except Exception as e:
        logger.error(f"Error al guardar seguimiento_ventas: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'connection' in locals():
            connection.close()

def guardar_seguimiento_ventas_nuevo(id_guia, n_oc, doc=None):
    """Guarda un nuevo registro en la tabla seguimiento_ventas con el formato actualizado de documentos."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            # Primero, obtener el máximo id_seg_vent existente
            cursor.execute("SELECT MAX(id_seg_vent) as max_id FROM seguimiento_ventas")
            result = cursor.fetchone()
            next_id_seg_vent = 1  # Valor por defecto si no hay registros
            if result and result['max_id'] is not None:
                next_id_seg_vent = result['max_id'] + 1
            
            # Obtener número de guía para almacenamiento de documentos
            cursor.execute("SELECT n_guia FROM seguimiento_guia WHERE id_guia = %s", (id_guia,))
            guia_result = cursor.fetchone()
            n_guia = guia_result['n_guia'] if guia_result else None
            
            # Insertar con el nuevo id_seg_vent y formato de documentos
            query = """
                INSERT INTO seguimiento_ventas 
                (id_seg_vent, id_guia, n_oc, doc)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (next_id_seg_vent, id_guia, n_oc, doc))
            connection.commit()
            
            return next_id_seg_vent
    except Exception as e:
        logger.error(f"Error al guardar seguimiento_ventas: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'connection' in locals():
            connection.close()

def actualizar_entrega_guia(id_guia, entregado, firma=None, rece_nombre=None, rece_dni=None, rece_cargo=None, rece_firma=None, fotos=None, motivo_rechazo=None, observaciones_rechazo=None):
    """Actualiza la información de entrega o rechazo de una guía."""
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            query = """
                UPDATE seguimiento_guia
                SET entregado = %s, 
                    firma = %s,
                    rece_nombre = %s,
                    rece_dni = %s,
                    rece_cargo = %s,
                    rece_firma = %s,
                    fotos = %s,
                    motivo_rechazo = %s,
                    observaciones_rechazo = %s,
                    entrega_fecha = CURRENT_TIMESTAMP
                WHERE id_guia = %s
            """
            cursor.execute(query, (
                entregado, 
                firma, 
                rece_nombre, 
                rece_dni, 
                rece_cargo, 
                rece_firma, 
                fotos, 
                motivo_rechazo,
                observaciones_rechazo,
                id_guia
            ))
            connection.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error al actualizar entrega de guía: {e}")
        if 'connection' in locals():
            connection.rollback()
        raise
    finally:
        if 'connection' in locals():
            connection.close()

# Inicialización: Verificar y crear tablas al importar el módulo
try:
    check_and_create_tables()
    verify_table_columns()
except Exception as e:
    logger.error(f"Error durante la inicialización de la base de datos: {e}")