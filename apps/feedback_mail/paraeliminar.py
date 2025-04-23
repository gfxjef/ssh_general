import requests
import json
import argparse
from datetime import datetime

def test_submit_endpoint(base_url="http://localhost:5001", endpoint="/feedback_mail/submit", custom_data=None):
    """
    Realiza una solicitud POST al endpoint de submit de feedback_mail
    
    Args:
        base_url: URL base del servidor
        endpoint: Ruta del endpoint
        custom_data: Datos personalizados para enviar (opcional)
    """
    url = f"{base_url}{endpoint}"
    
    # Datos de prueba predeterminados
    default_data = {
        "asesor": "Asesor de Prueba",
        "nombres": "Cliente Prueba",
        "ruc": "12345678901",  # RUC debe tener 11 dígitos numéricos
        "correo": "gfxjef@gmail.com",
        "documento": "1234567890",  # Documento debe tener 10 dígitos numéricos
        "tipo": "Ventas (OC)"
    }
    
    # Usar datos personalizados si se proporcionan
    data = custom_data if custom_data else default_data
    
    print("\n" + "="*60)
    print(f"REALIZANDO SOLICITUD POST A: {url}")
    print(f"DATOS ENVIADOS:")
    print(json.dumps(data, indent=4))
    print("="*60 + "\n")
    
    try:
        # Realizar la solicitud POST
        response = requests.post(url, json=data)
        
        # Mostrar el código de estado HTTP
        print(f"CÓDIGO DE ESTADO: {response.status_code}")
        
        # Intentar mostrar la respuesta como JSON
        try:
            response_data = response.json()
            print("\nRESPUESTA (JSON):")
            print(json.dumps(response_data, indent=4))
        except json.JSONDecodeError:
            print("\nRESPUESTA (TEXTO):")
            print(response.text)
        
        return response
    
    except requests.exceptions.ConnectionError:
        print(f"ERROR: No se pudo conectar a {url}. Verifica que el servidor esté en funcionamiento.")
    except Exception as e:
        print(f"ERROR INESPERADO: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Herramienta para probar el endpoint /submit de feedback_mail")
    parser.add_argument("--url", default="http://localhost:5001", help="URL base del servidor")
    parser.add_argument("--endpoint", default="/feedback_mail/submit", help="Ruta del endpoint")
    parser.add_argument("--nombre", default=None, help="Nombre del cliente")
    parser.add_argument("--correo", default=None, help="Correo del cliente")
    parser.add_argument("--asesor", default=None, help="Nombre del asesor")
    parser.add_argument("--consulta", default=None, help="Número de consulta")
    parser.add_argument("--tipo", default=None, help="Tipo de encuesta")
    
    args = parser.parse_args()
    
    # Construir datos personalizados si se proporcionaron argumentos
    custom_data = {}
    if args.nombre:
        custom_data["nombre_cliente"] = args.nombre
    if args.correo:
        custom_data["correo_cliente"] = args.correo
    if args.asesor:
        custom_data["asesor"] = args.asesor
    if args.consulta:
        custom_data["numero_consulta"] = args.consulta
    if args.tipo:
        custom_data["tipo"] = args.tipo
    
    # Usar datos personalizados solo si se proporcionó al menos un argumento
    if custom_data:
        test_submit_endpoint(args.url, args.endpoint, custom_data)
    else:
        test_submit_endpoint(args.url, args.endpoint)