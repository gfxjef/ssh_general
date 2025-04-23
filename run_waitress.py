import logging
from waitress import serve
from wsgi import application

if __name__ == '__main__':
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    logger = logging.getLogger('waitress')
    logger.setLevel(logging.INFO)
    
    print("Servidor iniciado en http://0.0.0.0:5000")
    
    # Configuración de Waitress para manejar operaciones bloqueantes
    serve(
        application, 
        host='0.0.0.0', 
        port=5000,
        threads=8,           # Aumentar número de hilos
        connection_limit=100, # Limitar conexiones para evitar sobrecarga
        channel_timeout=120,  # Timeout de conexión en segundos
        cleanup_interval=30   # Limpiar conexiones cerradas cada 30 segundos
    )