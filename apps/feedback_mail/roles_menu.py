from flask import Blueprint, request, jsonify
from mysql.connector import Error
from .db import get_db_connection

TABLE_NAME = "roles_menu"
roles_menu_bp = Blueprint('roles_menu_bp', __name__)

# Lista de columnas válidas (las que están en la tabla)
ALLOWED_COLUMNS = [
    "menu1_Inventario",
    "submenu1_agregar_inventario",
    "menu2_Feedback",
    "submenu2_generador_encuestas",
    "submenu3_respuestas_comentarios",
    "menu3_Solicitud_Merchandising",
    "submenu4_nueva_solicitud",
    "submenu5_confirmados",
    "submenu6_entregados",
    "menu4_Administracion",
    "submenu7_roles"
]

@roles_menu_bp.route('/roles_menu', methods=['GET'])
def get_roles_menu():
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


@roles_menu_bp.route('/roles_menu', methods=['POST'])
def add_role_to_column():
    """
    Agrega un rol a una columna específica del registro 1.
    Se espera recibir un JSON con:
      - "column": nombre de la columna.
      - "role": rol a agregar.
    Ejemplo:
    {
      "column": "submenu6_entregados",
      "role": "nuevo_rol"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'status': 'error', 'message': 'No se proporcionaron datos.'}), 400

    column = data.get('column')
    role = data.get('role')
    if not column or not role:
        return jsonify({'status': 'error', 'message': 'Debe especificar "column" y "role".'}), 400

    if column not in ALLOWED_COLUMNS:
        return jsonify({'status': 'error', 'message': 'Columna no válida.'}), 400

    cnx = get_db_connection()
    if cnx is None:
        return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500

    try:
        cursor = cnx.cursor(dictionary=True)
        # Se obtiene el valor actual de la columna en el registro 1.
        select_query = f"SELECT `{column}` FROM `{TABLE_NAME}` WHERE id = 1;"
        cursor.execute(select_query)
        result = cursor.fetchone()
        if result is None:
            return jsonify({'status': 'error', 'message': 'Registro no encontrado.'}), 404

        current_value = result[column] or ""
        # Convertir a lista (si hay contenido, separar por comas)
        roles_list = [r.strip() for r in current_value.split(',')] if current_value.strip() != '' else []

        if role in roles_list:
            return jsonify({'status': 'error', 'message': 'El rol ya existe en la columna.'}), 400

        roles_list.append(role)
        new_value = ','.join(roles_list)

        update_query = f"UPDATE `{TABLE_NAME}` SET `{column}` = %s WHERE id = 1;"
        cursor.execute(update_query, (new_value,))
        cnx.commit()
        return jsonify({'status': 'success', 'message': f'Rol agregado a {column} correctamente.'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500
    finally:
        cursor.close()
        cnx.close()


@roles_menu_bp.route('/roles_menu', methods=['PUT'])
def update_column_value():
    """
    Reemplaza el valor completo de una columna del registro 1.
    Se espera recibir un JSON con:
      - "column": nombre de la columna.
      - "new_value": nuevo valor (cadena separada por comas) que se desea guardar.
    Ejemplo:
    {
      "column": "submenu6_entregados",
      "new_value": "administrador,asesor"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'status': 'error', 'message': 'No se proporcionaron datos.'}), 400

    column = data.get('column')
    new_value = data.get('new_value')
    if not column or new_value is None:
        return jsonify({'status': 'error', 'message': 'Debe especificar "column" y "new_value".'}), 400

    if column not in ALLOWED_COLUMNS:
        return jsonify({'status': 'error', 'message': 'Columna no válida.'}), 400

    cnx = get_db_connection()
    if cnx is None:
        return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500

    try:
        cursor = cnx.cursor()
        query = f"UPDATE `{TABLE_NAME}` SET `{column}` = %s WHERE id = 1;"
        cursor.execute(query, (new_value,))
        cnx.commit()
        return jsonify({'status': 'success', 'message': f'Columna {column} actualizada correctamente.'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500
    finally:
        cursor.close()
        cnx.close()


@roles_menu_bp.route('/roles_menu', methods=['DELETE'])
def delete_role_from_column():
    """
    Elimina un rol de una columna específica del registro 1.
    Se espera recibir un JSON con:
      - "column": nombre de la columna.
      - "role": rol a eliminar.
    Ejemplo:
    {
      "column": "submenu6_entregados",
      "role": "jefe_de_ventas"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'status': 'error', 'message': 'No se proporcionaron datos.'}), 400

    column = data.get('column')
    role = data.get('role')
    if not column or not role:
        return jsonify({'status': 'error', 'message': 'Debe especificar "column" y "role".'}), 400

    if column not in ALLOWED_COLUMNS:
        return jsonify({'status': 'error', 'message': 'Columna no válida.'}), 400

    cnx = get_db_connection()
    if cnx is None:
        return jsonify({'status': 'error', 'message': 'No se pudo conectar a la base de datos.'}), 500

    try:
        cursor = cnx.cursor(dictionary=True)
        select_query = f"SELECT `{column}` FROM `{TABLE_NAME}` WHERE id = 1;"
        cursor.execute(select_query)
        result = cursor.fetchone()
        if result is None:
            return jsonify({'status': 'error', 'message': 'Registro no encontrado.'}), 404

        current_value = result[column] or ""
        roles_list = [r.strip() for r in current_value.split(',')] if current_value.strip() != '' else []

        if role not in roles_list:
            return jsonify({'status': 'error', 'message': 'El rol no existe en la columna.'}), 400

        roles_list.remove(role)
        new_value = ','.join(roles_list)

        update_query = f"UPDATE `{TABLE_NAME}` SET `{column}` = %s WHERE id = 1;"
        cursor.execute(update_query, (new_value,))
        cnx.commit()
        return jsonify({'status': 'success', 'message': f'Rol eliminado de {column} correctamente.'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500
    finally:
        cursor.close()
        cnx.close()
