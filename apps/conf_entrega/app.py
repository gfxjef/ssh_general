from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import urllib.parse
import json
from datetime import datetime
from . import db

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tu_clave_secreta_aqui'  # Cambiar en producción
# Aumentar límite de tamaño de solicitud a 50 MB
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Modelo temporal de usuario (en producción usar base de datos)
class User(UserMixin):
    def __init__(self, id):
        self.id = id

# Datos de ejemplo (reemplazar con base de datos)
users = {'admin': {'password': 'admin123'}}

@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users and users[username]['password'] == password:
            user = User(username)
            login_user(user)
            return redirect(url_for('lista_rutas'))
        flash('Usuario o contraseña incorrectos')
    return render_template('login.html')

@app.route('/lista-rutas')
@login_required
def lista_rutas():
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # Consultar todas las guías no entregadas
            query = """
                SELECT sg.id_guia, sg.n_guia, sg.direccion, sg.contacto, sg.cliente
                FROM seguimiento_guia sg
                WHERE sg.entregado = FALSE OR sg.entregado IS NULL
                ORDER BY sg.timestamp DESC
            """
            cursor.execute(query)
            rutas = cursor.fetchall()
            
        return render_template('lista_rutas.html', rutas=rutas)
    except Exception as e:
        app.logger.error(f"Error al obtener rutas: {str(e)}")
        flash('Error al cargar las rutas asignadas', 'danger')
        return render_template('lista_rutas.html', rutas=[])
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/detalle-ruta/<int:id_guia>')
@login_required
def detalle_ruta(id_guia):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # Consultar detalles de la guía
            query = """
                SELECT 
                    sg.id_guia, sg.n_guia, sg.direccion, sg.contacto, 
                    sg.cliente, sg.telefono, sg.cargo, sg.detalles,
                    sg.entregado, sg.entrega_fecha,
                    sr.n_ruta, sr.placa_vehiculo, sr.operador_1, sr.auxiliar_1
                FROM seguimiento_guia sg
                LEFT JOIN seguimiento_ruta sr ON sg.id_salida = sr.id
                WHERE sg.id_guia = %s
            """
            cursor.execute(query, (id_guia,))
            ruta = cursor.fetchone()
            
            if not ruta:
                flash('La ruta solicitada no existe', 'danger')
                return redirect(url_for('lista_rutas'))
            
            # Convertir el resultado a un diccionario modificable
            ruta = dict(ruta) if ruta else {}

            # Consultar documentos asociados
            query_docs = """
                SELECT sv.n_oc, sv.doc
                FROM seguimiento_ventas sv
                WHERE sv.id_guia = %s
            """
            cursor.execute(query_docs, (id_guia,))
            ventas = cursor.fetchone()

            # Preparar documentos para mostrar en la interfaz
            documentos = []
            if ventas:
                # Agregar orden de compra
                if 'n_oc' in ventas and ventas['n_oc']:
                    documentos.append({
                        'nombre': f'OC: {ventas["n_oc"]}',
                        'tipo': 'pdf', 
                        'url': '#'
                    })

                # Procesar documentos de la columna 'doc'
                if 'doc' in ventas and ventas['doc']:
                    # Dividir la cadena de URLs por comas
                    docs_urls = ventas['doc'].split(',')
                    
                    # Agregar cada documento encontrado
                    for i, doc_url in enumerate(docs_urls, 1):
                        if doc_url.strip():  # Verificar que no esté vacío
                            documentos.append({
                                'nombre': f'Documento {i}',
                                'tipo': 'pdf', 
                                'url': doc_url.strip()
                            })

            ruta['documentos'] = documentos
            
        return render_template('detalle_ruta.html', ruta=ruta)
    except Exception as e:
        app.logger.error(f"Error al obtener detalles de ruta: {str(e)}")
        flash('Error al cargar los detalles de la ruta', 'danger')
        return redirect(url_for('lista_rutas'))
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/confirmar-entrega/<int:id_guia>', methods=['GET', 'POST'])
@login_required
def confirmar_entrega(id_guia):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # Consultar detalles de la guía
            query = """
                SELECT 
                    sg.id_guia, sg.n_guia, sg.direccion, sg.contacto, 
                    sg.cliente, sg.telefono, sg.cargo, sg.detalles
                FROM seguimiento_guia sg
                WHERE sg.id_guia = %s
            """
            cursor.execute(query, (id_guia,))
            ruta = cursor.fetchone()
            
            if not ruta:
                flash('La ruta solicitada no existe', 'danger')
                return redirect(url_for('lista_rutas'))
            
        if request.method == 'POST':
            # Procesar los datos del formulario
            form_data = {
                'tipo_persona': request.form.get('tipo_persona', ''),
                'rece_nombre': request.form.get('nombre', '') or request.form.get('contactoId', ''),
                'rece_dni': request.form.get('dni', ''),
                'rece_cargo': request.form.get('cargo', ''),
                'firma': request.form.get('signatureData', ''),
                'entregado': True,
                'entrega_fecha': datetime.now()
            }
            
            # Validaciones básicas
            if not form_data['rece_nombre']:
                flash('El nombre de quien recibe es obligatorio', 'danger')
                return render_template('confirmar_entrega.html', ruta=ruta)
                
            # Guardar la firma en el servidor FTP
            firma_url = None
            from .ftp_utils import upload_base64_image
            
            if form_data['firma']:
                # Generar nombre del archivo incluyendo nombre y número de guía
                nombre_normalizado = form_data['rece_nombre'].lower().replace(' ', '_')
                firma_filename = f"{nombre_normalizado}_{ruta['n_guia']}_firma.jpg"
                firma_url = upload_base64_image(
                    ruta['n_guia'], 
                    form_data['firma'],
                    firma_filename
                )
                if not firma_url:
                    app.logger.warning(f"No se pudo guardar la firma en el servidor FTP")
            
            # Procesar y guardar fotos si existen
            fotos_urls = []
            
            # Procesar fotos desde photo_data[]
            if 'photo_data[]' in request.form:
                foto_data_list = request.form.getlist('photo_data[]')
                from .ftp_utils import upload_base64_image
                
                for i, foto_data in enumerate(foto_data_list, 1):  # Comenzar desde 1
                    if foto_data:
                        # Generar nombre con formato solicitado: foto_X_NUMEROGUIA.jpg
                        foto_filename = f"foto_{i}_{ruta['n_guia']}.jpg"
                        
                        # Subir al FTP en la carpeta de la guía
                        foto_url = upload_base64_image(
                            ruta['n_guia'], 
                            foto_data,
                            foto_filename
                        )
                        if foto_url:
                            fotos_urls.append(foto_url)
            
            # Guardar fotos como string separado por comas en la base de datos
            fotos_string = ", ".join(fotos_urls) if fotos_urls else None
            
            # Actualizar en la base de datos
            with connection.cursor() as cursor:
                query = """
                    UPDATE seguimiento_guia
                    SET 
                        rece_nombre = %s,
                        rece_dni = %s,
                        rece_cargo = %s,
                        firma = %s,
                        fotos = %s,
                        entregado = %s,
                        entrega_fecha = %s
                    WHERE id_guia = %s
                """
                cursor.execute(query, (
                    form_data['rece_nombre'],
                    form_data['rece_dni'],
                    form_data['rece_cargo'],
                    firma_url,
                    fotos_string,
                    form_data['entregado'],
                    form_data['entrega_fecha'],
                    id_guia
                ))
                connection.commit()
                
            flash('Entrega confirmada correctamente', 'success')
            return redirect(url_for('lista_rutas'))
            
        return render_template('confirmar_entrega.html', ruta=ruta)
    except Exception as e:
        app.logger.error(f"Error al confirmar entrega: {str(e)}")
        flash('Error al procesar la confirmación de entrega', 'danger')
        return redirect(url_for('detalle_ruta', id_guia=id_guia))
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/rechazar-entrega/<int:id_guia>', methods=['GET', 'POST'])
@login_required
def rechazar_entrega(id_guia):
    try:
        connection = db.get_connection()
        with connection.cursor() as cursor:
            # Consultar detalles de la guía
            query = """
                SELECT 
                    sg.id_guia, sg.n_guia, sg.direccion, sg.contacto, 
                    sg.cliente, sg.telefono, sg.cargo, sg.detalles
                FROM seguimiento_guia sg
                WHERE sg.id_guia = %s
            """
            cursor.execute(query, (id_guia,))
            ruta = cursor.fetchone()
            
            if not ruta:
                flash('La ruta solicitada no existe', 'danger')
                return redirect(url_for('lista_rutas'))
            
        if request.method == 'POST':
            # Obtener datos del formulario
            motivo = request.form.get('motivo', '')
            observaciones = request.form.get('observaciones', '')
            
            if not motivo:
                flash('Debe seleccionar un motivo de rechazo', 'danger')
                return render_template('rechazar_entrega.html', ruta=ruta)
            
            # Procesar y guardar fotos de evidencia si existen
            fotos_urls = []
            
            # Fotos tomadas directamente
            if 'fotos' in request.files:
                fotos = request.files.getlist('fotos')
                from .ftp_utils import upload_file
                
                for i, foto in enumerate(fotos):
                    if foto and foto.filename:
                        extension = foto.filename.rsplit('.', 1)[1].lower() if '.' in foto.filename else 'jpg'
                        foto_filename = f"rechazo_foto_{i+1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}"
                        foto_url = upload_file(ruta['n_guia'], foto, foto_filename)
                        if foto_url:
                            fotos_urls.append(foto_url)
            
            # Guardar fotos como JSON en la base de datos (si hay)
            fotos_json = json.dumps(fotos_urls) if fotos_urls else None
            
            # Actualizar en la base de datos
            with connection.cursor() as cursor:
                query = """
                    UPDATE seguimiento_guia
                    SET 
                        motivo_rechazo = %s,
                        observaciones_rechazo = %s,
                        fotos = %s,
                        entregado = FALSE,
                        entrega_fecha = NOW()
                    WHERE id_guia = %s
                """
                cursor.execute(query, (motivo, observaciones, fotos_json, id_guia))
                connection.commit()
                
            flash('Rechazo de entrega registrado correctamente', 'success')
            return redirect(url_for('lista_rutas'))
            
        return render_template('rechazar_entrega.html', ruta=ruta)
    except Exception as e:
        app.logger.error(f"Error al rechazar entrega: {str(e)}")
        flash('Error al procesar el rechazo de entrega', 'danger')
        return redirect(url_for('detalle_ruta', id_guia=id_guia))
    finally:
        if 'connection' in locals():
            connection.close()

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    flash('Has cerrado sesión exitosamente')
    return redirect(url_for('login'))

@app.route('/guardar', methods=['POST'])
def guardar_datos():
    """
    Endpoint para guardar datos en las tablas de seguimiento.
    Espera un JSON con la siguiente estructura:
    {
      "ruta": {
        "n_ruta": "Nombre de la ruta",
        "placa_vehiculo": "Placa del vehículo",
        "operador_1": "Nombre del operador",
        "auxiliar_1": "Nombre del auxiliar"
      },
      "guias": [
        {
          "n_guia": "Número o código de la guía",
          "direccion": "Dirección de entrega",
          "contacto": "Nombre de la persona de contacto",
          "cliente": "Nombre del cliente",
          "telefono": "Teléfono de contacto",
          "cargo": "Cargo o rol del destinatario",
          "detalles": {
            "Bultos": "cantidad de bultos",
            "Codigos": "códigos de productos",
            "Peso": "peso de producto"
          },
          "entrega_fecha": "YYYY-MM-DD HH:MM:SS",
          "ventas": {
            "n_oc": "Número de orden de compra",
            "doc1": "URL o referencia del documento 1",
            "doc2": "URL o referencia del documento 2",
            "doc3": "URL o referencia del documento 3",
            "doc4": "URL o referencia del documento 4"
          }
        }
      ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        # Verificar si los datos de ruta están completos
        if 'ruta' not in data:
            return jsonify({'error': 'Faltan datos de ruta'}), 400
        
        ruta_data = data['ruta']
        required_ruta_fields = ['n_ruta', 'placa_vehiculo', 'operador_1', 'auxiliar_1']
        for field in required_ruta_fields:
            if field not in ruta_data or not ruta_data[field]:
                return jsonify({'error': f'El campo {field} es obligatorio en los datos de ruta'}), 400
        
        # Guardar datos de ruta
        id_salida = db.guardar_seguimiento_ruta(
            ruta_data['n_ruta'],
            ruta_data['placa_vehiculo'],
            ruta_data['operador_1'],
            ruta_data['auxiliar_1']
        )
        
        if not id_salida:
            return jsonify({'error': 'Error al guardar los datos de ruta'}), 500
        
        # Procesar guías
        guias_ids = []
        if 'guias' in data and isinstance(data['guias'], list):
            for guia_data in data['guias']:
                required_guia_fields = ['n_guia', 'direccion', 'contacto', 'cliente', 'telefono', 'cargo', 'detalles']
                for field in required_guia_fields:
                    if field not in guia_data or not guia_data[field]:
                        return jsonify({'error': f'El campo {field} es obligatorio en los datos de guía'}), 400
                
                # Validar que 'detalles' sea un objeto y contenga las claves específicas
                if not isinstance(guia_data['detalles'], dict):
                    return jsonify({'error': 'El campo detalles debe ser un objeto con las claves Bultos, Codigos y Peso'}), 400
                detalles_required_keys = ['Bultos', 'Codigos', 'Peso']
                for key in detalles_required_keys:
                    if key not in guia_data['detalles'] or not guia_data['detalles'][key]:
                        return jsonify({'error': f'El campo {key} es obligatorio en detalles'}), 400
                
                # Convertir el objeto de detalles a cadena JSON para almacenarlo en la BD
                detalles_str = json.dumps(guia_data['detalles'])
                
                # Convertir fecha de entrega si existe
                entrega_fecha = None
                if 'entrega_fecha' in guia_data and guia_data['entrega_fecha']:
                    try:
                        entrega_fecha = datetime.strptime(guia_data['entrega_fecha'], '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS'}), 400
                
                # Guardar datos de guía
                id_guia = db.guardar_seguimiento_guia(
                    id_salida,
                    guia_data['n_guia'],
                    guia_data['direccion'],
                    guia_data['contacto'],
                    guia_data['cliente'],
                    guia_data['telefono'],
                    guia_data['cargo'],
                    detalles_str,
                    entrega_fecha
                )
                
                if not id_guia:
                    return jsonify({'error': f'Error al guardar los datos de la guía {guia_data["n_guia"]}'}), 500
                
                guias_ids.append(id_guia)
                
                # Procesar datos de ventas si existen
                if 'ventas' in guia_data and isinstance(guia_data['ventas'], dict):
                    ventas_data = guia_data['ventas']
                    
                    if 'n_oc' not in ventas_data or not ventas_data['n_oc']:
                        return jsonify({'error': 'El campo n_oc es obligatorio en los datos de ventas'}), 400
                    
                    # Verificar si se está usando el nuevo formato con campo 'doc'
                    if 'doc' in ventas_data:
                        id_seg_vent = db.guardar_seguimiento_ventas_nuevo(
                            id_guia,
                            ventas_data['n_oc'],
                            ventas_data.get('doc')
                        )
                    else:
                        doc1 = ventas_data.get('doc1')
                        doc2 = ventas_data.get('doc2')
                        doc3 = ventas_data.get('doc3')
                        doc4 = ventas_data.get('doc4')
                        
                        id_seg_vent = db.guardar_seguimiento_ventas(
                            id_guia,
                            ventas_data['n_oc'],
                            doc1,
                            doc2,
                            doc3,
                            doc4
                        )
                    
                    if not id_seg_vent:
                        return jsonify({'error': f'Error al guardar los datos de ventas para la guía {guia_data["n_guia"]}'}), 500
        
        return jsonify({
            'success': True,
            'message': 'Datos guardados correctamente',
            'id_salida': id_salida,
            'guias_ids': guias_ids
        }), 201
        
    except Exception as e:
        app.logger.error(f"Error al procesar la solicitud: {str(e)}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/actualizar-entrega/<int:id_guia>', methods=['POST'])
def actualizar_entrega(id_guia):
    """
    Endpoint para actualizar los datos de entrega de una guía.
    Espera un JSON con la siguiente estructura:
    {
        "entregado": true/false,
        "firma": "base64_string" (opcional),
        "rece_nombre": "string" (opcional),
        "rece_dni": "string" (opcional),
        "rece_cargo": "string" (opcional),
        "rece_firma": "base64_string" (opcional),
        "fotos": "json_string_con_urls" (opcional)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        if 'entregado' not in data:
            return jsonify({'error': 'El campo entregado es obligatorio'}), 400
        
        fotos = None
        if 'fotos' in data and data['fotos']:
            if isinstance(data['fotos'], list):
                fotos = json.dumps(data['fotos'])
            else:
                fotos = data['fotos']
        
        actualizado = db.actualizar_entrega_guia(
            id_guia,
            data['entregado'],
            data.get('firma'),
            data.get('rece_nombre'),
            data.get('rece_dni'),
            data.get('rece_cargo'),
            data.get('rece_firma'),
            fotos
        )
        
        if not actualizado:
            return jsonify({'error': f'No se encontró la guía con ID {id_guia} o no se pudo actualizar'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Datos de entrega actualizados correctamente',
            'id_guia': id_guia
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error al actualizar los datos de entrega: {str(e)}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

if __name__ == '__main__':
    # Para desarrollo
    # app.run(debug=True)
    
    # Para producción
    app.run(host='0.0.0.0', port=5000, debug=False)
