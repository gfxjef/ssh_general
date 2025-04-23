from flask import Blueprint, render_template, jsonify, request, session

# Crear el blueprint para welcome
welcome_bp = Blueprint('welcome_bp', __name__)

@welcome_bp.route('/welcome', methods=['GET'])
def welcome():
    # Aquí podrías verificar si el usuario está autenticado
    # Por ejemplo, verificando en la sesión o con un decorador
    
    # Si quieres retornar una vista HTML:
    return render_template('welcome/index.html')
    
    # Si prefieres un endpoint JSON para una SPA:
    # return jsonify({
    #     'success': True,
    #     'message': 'Bienvenido al sistema'
    # })
