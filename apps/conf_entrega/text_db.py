#!/usr/bin/env python3
# send_guia.py

import requests
import json
from datetime import datetime

API_URL = "http://localhost:5000/conf_entrega/guardar"  # Ajusta si tu endpoint cambia

def main():
    payload = {
        "ruta": {
            "n_ruta": "RUTA-123",
            "placa_vehiculo": "XYZ-987",
            "operador_1": "Juan Pérez",
            "auxiliar_1": "María López"
        },
        "guias": [
            {
                "n_guia": "GUIA-0001",
                "direccion": "Av. Siempre Viva 742, Springfield",
                "contacto": "Homero Simpson",
                "cliente": "Springfield Nuclear",
                "telefono": "555-1234",
                "cargo": "Supervisor",
                "detalles": {
                    "Bultos": "3",
                    "Codigos": "ABC123,DEF456,GHI789",
                    "Peso": "25kg"
                },
                "entrega_fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "ventas": {
                    "n_oc": "OC-2025-09",
                    "doc1": "http://docs.empresa.com/oc-2025-09.pdf",
                    "doc2": "",
                    "doc3": "",
                    "doc4": ""
                }
            }
        ]
    }

    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(API_URL, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:", response.json())
    except ValueError:
        print("Response Text:", response.text)

if __name__ == "__main__":
    main()
