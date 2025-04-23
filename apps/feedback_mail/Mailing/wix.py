from flask import Blueprint, request, jsonify
from ..db import get_db_connection  # Ajusta si db.py está en el mismo paquete
from .octopus import add_contact_to_octopus

wix_bp = Blueprint('wix_bp', __name__)
TABLE_NAME = "WIX"  # Nombre exacto de la tabla en tu BD

@wix_bp.route('/records', methods=['GET'])
def get_records():
    """
    GET /wix/records
    Devuelve todos los registros de la tabla WIX.
    """
    cnx = get_db_connection()
    if cnx is None:
        return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500

    try:
        cursor = cnx.cursor(dictionary=True)
        query = f"SELECT * FROM `{TABLE_NAME}`;"
        cursor.execute(query)
        records = cursor.fetchall()
        return jsonify({'status': 'success', 'records': records}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500
    finally:
        cursor.close()
        cnx.close()

@wix_bp.route('/records', methods=['POST'])
def insert_record():
    """
    POST /wix/records
    Inserta un nuevo registro en la tabla WIX.
    Espera un JSON con:
      - nombre_apellido
      - empresa
      - telefono2
      - ruc_dni
      - correo
      - treq_requerimiento
    Luego, se envía el contacto a EmailOctopus.
    
    La columna submission_time se asigna automáticamente con el timestamp actual.
    """
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'No se recibieron datos JSON.'}), 400

    # Campos obligatorios
    required_fields = [
        "nombre_apellido",
        "empresa",
        "telefono2",
        "ruc_dni",
        "correo",
        "treq_requerimiento"
    ]
    for field in required_fields:
        if field not in data:
            return jsonify({'status': 'error', 'message': f'Falta el campo {field}.'}), 400

    cnx = get_db_connection()
    if cnx is None:
        return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500

    try:
        cursor = cnx.cursor()
        # Se agrega NOW() para que submission_time reciba la fecha y hora exacta
        insert_query = f"""
            INSERT INTO `{TABLE_NAME}` 
            (nombre_apellido, empresa, telefono2, ruc_dni, correo, treq_requerimiento, submission_time)
            VALUES (%s, %s, %s, %s, %s, %s, NOW());
        """
        values = (
            data["nombre_apellido"],
            data["empresa"],
            data["telefono2"],
            data["ruc_dni"],
            data["correo"],
            data["treq_requerimiento"]
        )
        cursor.execute(insert_query, values)
        cnx.commit()

        # Llamada a la función para enviar el contacto a EmailOctopus
        oct_response = add_contact_to_octopus(
            email_address=data["correo"],
            nombre_apellido=data["nombre_apellido"],
            empresa=data["empresa"],
            ruc_dni=data["ruc_dni"]
        )
        if oct_response.status_code not in [200, 201]:
            print("Error al agregar el contacto a Octopus:", oct_response.text)

        return jsonify({'status': 'success', 'message': 'Registro insertado correctamente.'}), 201
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500
    finally:
        cursor.close()
        cnx.close()
