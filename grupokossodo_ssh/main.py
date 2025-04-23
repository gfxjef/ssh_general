from app import create_app
import os
import logging

# Configuración de logging
logger = logging.getLogger(__name__)

# Crear la aplicación Flask
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
