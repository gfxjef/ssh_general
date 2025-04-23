import unittest
import json
import requests

class TestDBEndpoints(unittest.TestCase):
    BASE_URL = "http://209.45.52.219:5000/conf_entrega"  # Asegúrate de que la URL sea correcta

    def test_guardar_endpoint(self):
        """Prueba el endpoint /guardar con datos de ejemplo."""
        url = f"{self.BASE_URL}/guardar"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "ruta": {
                "n_ruta": "Ruta de Prueba",
                "placa_vehiculo": "XYZ-7893333331111555555",
                "operador_1": "Piloto de Prueba",
                "auxiliar_1": "Ayudante de Prueba"
            },
            "guias": [
                {
                    "n_guia": "Guia-Test-001www",
                    "direccion": "Calle de Prueba 123",
                    "contacto": "Contacto de Prueba",
                    "cliente": "Cliente de Prueba",
                    "telefono": "555-TEST",
                    "cargo": "100",
                    "detalles": "Entrega de prueba",
                    "entrega_fecha": "2025-04-03 12:00:00",
                    "ventas": {
                        "n_oc": "OC-Test-001",
                        "doc1": "http://example.com/doc1.pdf",
                        "doc2": "http://example.com/doc2.pdf"
                    }
                }
            ]
        }

        response = requests.post(url, headers=headers, data=json.dumps(payload))

        self.assertEqual(response.status_code, 201)  # Verifica que la solicitud fue exitosa y se creó un nuevo recurso
        # Aquí puedes agregar más aserciones para verificar el contenido de la respuesta
        print(response.json()) # Imprime la respuesta para inspección

    def test_actualizar_entrega_endpoint(self):
        """Prueba el endpoint /actualizar-entrega/<id_guia> con datos de ejemplo."""
        id_guia = 1  # Reemplaza con un ID de guía existente en tu base de datos
        url = f"{self.BASE_URL}/actualizar-entrega/{id_guia}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "entregado": True,
            "firma": "firma_en_base64",
            "rece_nombre": "Nombre del Receptor",
            "rece_dni": "DNI del Receptor",
            "rece_cargo": "Cargo del Receptor",
            "rece_firma": "firma_recepcion_en_base64",
            "fotos": "url_de_la_foto",
            "motivo_rechazo": None,
            "observaciones_rechazo": None
        }

        response = requests.post(url, headers=headers, data=json.dumps(payload))

        self.assertEqual(response.status_code, 200)  # Verifica que la solicitud fue exitosa
        # Aquí puedes agregar más aserciones para verificar el contenido de la respuesta
        print(response.json()) # Imprime la respuesta para inspección


if __name__ == '__main__':
    unittest.main()