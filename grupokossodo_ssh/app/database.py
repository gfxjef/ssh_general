import mysql.connector
import os
import logging
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configuración de la base de datos
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'atusalud_atusalud'),
    'password': os.getenv('DB_PASSWORD', 'kmachin1'),
    'host': os.getenv('DB_HOST', 'atusaludlicoreria.com'),
    'database': os.getenv('DB_NAME', 'atusalud_kossomet'),
    'port': int(os.getenv('DB_PORT', 3306))
}

def get_db_connection():
    """Establece conexión a la base de datos."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        logger.info("Conexión exitosa a la BD")
        return conn
    except mysql.connector.Error as err:
        logger.error(f"Error de conexión: {err}")
        return None