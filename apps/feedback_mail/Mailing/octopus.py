import requests

# Configuración con tus datos de EmailOctopus
OCTOPUS_API_KEY = "eo_ebaaa54ce54b71a8f43cf0f717834982c846dca447245f0dff1cb5880f57ed46"
OCTOPUS_LIST_ID = "4de8d66a-71ea-11ee-b78c-d7b693f1ca1a"
# Usamos el endpoint correcto sin /api/2.0
BASE_URL = "https://api.emailoctopus.com"

def add_contact_to_octopus(email_address, nombre_apellido, empresa, ruc_dni):
    """
    Agrega un contacto a la lista de EmailOctopus usando la API v2.
    
    Parámetros:
      - email_address (str): El email del contacto.
      - nombre_apellido (str): El nombre (se usará para "First name"; se dejará "Last name" vacío).
      - empresa (str): Se mapea al campo "COMPANY".
      - ruc_dni (str): Se mapea al campo "RUC".
    
    Retorna el objeto response de la petición.
    """
    url = f"{BASE_URL}/lists/{OCTOPUS_LIST_ID}/contacts"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OCTOPUS_API_KEY}"
    }
    payload = {
        "email_address": email_address,
        "fields": {
            "FirstName": nombre_apellido,  # Usamos el nombre completo en FirstName
            "LastName": "",                # No se separa apellido
            "COMPANY": empresa,
            "RUC": ruc_dni
        },
        "tags": [],
        "status": "subscribed"
    }
    response = requests.post(url, headers=headers, json=payload)
    return response

if __name__ == '__main__':
    # Datos de prueba
    email_address = "prueba@ejemplo.com"
    nombre_apellido = "Juan Perez"
    empresa = "Empresa Prueba"
    ruc_dni = "48052850"
    
    response = add_contact_to_octopus(email_address, nombre_apellido, empresa, ruc_dni)
    
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except Exception as e:
        print("Error al parsear la respuesta:", e)
