from waitress import serve
from wsgi import application

if __name__ == '__main__':
    print("Servidor iniciado en http://0.0.0.0:5000")
    serve(application, host='0.0.0.0', port=5000)