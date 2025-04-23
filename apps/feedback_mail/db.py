# db.py
import os
import mysql.connector
from mysql.connector import errorcode

# Configuración de la BD (usa tus variables de entorno en Render)
DB_CONFIG = {
    'user': os.environ.get('MYSQL_USER'),
    'password': os.environ.get('MYSQL_PASSWORD'),
    'host': os.environ.get('MYSQL_HOST'),
    'database': os.environ.get('MYSQL_DATABASE'),
    'port': 3306
}

def get_db_connection():
    """
    Establece la conexión con la base de datos.
    Retorna el objeto de conexión si es exitoso o None si falla.
    """
    try:
        cnx = mysql.connector.connect(**DB_CONFIG)
        return cnx
    except mysql.connector.Error as err:
        # Puedes usar print o logs. En Render, print irá a los logs del servidor.
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Error de acceso a la base de datos: Usuario o contraseña incorrectos")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("La base de datos no existe")
        else:
            print(f"Error de conexión a la base de datos: {err}")
        return None
