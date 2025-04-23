import json
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from ...database import get_db_connection
import os

# Configure logging
logger = logging.getLogger(__name__)

def ensure_table_exists(table_name: str, columns_definition: List[str]) -> bool:
    """
    Ensure that a table exists in the database with the specified structure.
    
    Args:
        table_name: Name of the table to create
        columns_definition: List of column definitions (e.g., ["id INT AUTO_INCREMENT PRIMARY KEY", "name VARCHAR(255)"])
    
    Returns:
        bool: True if successful, False otherwise
    """
    conn = get_db_connection()
    if conn is None:
        logger.error(f"Failed to connect to database when ensuring table {table_name}")
        return False
    
    cursor = conn.cursor()
    try:
        columns_str = ", ".join(columns_definition)
        query = f"CREATE TABLE IF NOT EXISTS {table_name} ({columns_str});"
        cursor.execute(query)
        conn.commit()
        logger.info(f"Table {table_name} created or verified successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating table {table_name}: {str(e)}")
        return False
    finally:
        cursor.close()
        conn.close()

def ensure_column_exists(table_name: str, column_name: str, column_def: str) -> bool:
    """
    Ensure that a column exists in the specified table.
    
    Args:
        table_name: Name of the table
        column_name: Name of the column to check/create
        column_def: Column definition (e.g., "INT DEFAULT 0")
    
    Returns:
        bool: True if column exists or was created, False otherwise
    """
    conn = get_db_connection()
    if conn is None:
        logger.error(f"Failed to connect to database when ensuring column {column_name} in {table_name}")
        return False
    
    cursor = conn.cursor()
    try:
        # Check if column exists
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """, (table_name, column_name))
        
        if cursor.fetchone()[0] == 0:
            # Column doesn't exist, add it
            query = f"ALTER TABLE {table_name} ADD COLUMN `{column_name}` {column_def};"
            cursor.execute(query)
            conn.commit()
            logger.info(f"Column {column_name} added to {table_name}")
        
        return True
    except Exception as e:
        logger.error(f"Error ensuring column {column_name} in {table_name}: {str(e)}")
        return False
    finally:
        cursor.close()
        conn.close()

def get_stock_by_group(grupo: str) -> Dict[str, Any]:
    """
    Get inventory stock for a specific group
    
    Args:
        grupo: Group name ('kossodo' or 'kossomet')
    
    Returns:
        Dict with stock information
    """
    if grupo not in ['kossodo', 'kossomet']:
        return {"error": "Grupo inválido. Use 'kossodo' o 'kossomet'."}
    
    inventario_table = f"inventario_merch_{grupo}"
    
    conn = get_db_connection()
    if conn is None:
        logger.error("Failed to connect to database when getting stock")
        return {"error": "Error de conexión a la base de datos"}
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Get all columns that start with merch_
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME LIKE 'merch\\_%'
        """, (inventario_table,))
        
        cols = [row['COLUMN_NAME'] for row in cursor.fetchall()]
        
        # Calculate totals for each product from inventory
        inventory_totals = {}
        for col in cols:
            cursor.execute(f"SELECT SUM(`{col}`) AS total FROM {inventario_table}")
            result = cursor.fetchone()
            total = result['total'] if result['total'] is not None else 0
            inventory_totals[col] = total
        
        # Calculate used products from confirmed requests
        request_totals = {col: 0 for col in cols}
        cursor.execute("SELECT productos FROM inventario_solicitudes_conf WHERE grupo = %s", (grupo,))
        conf_rows = cursor.fetchall()
        
        for row in conf_rows:
            try:
                productos_dict = json.loads(row['productos']) if row['productos'] else {}
                for prod, qty in productos_dict.items():
                    if prod in request_totals:
                        request_totals[prod] += qty
            except Exception as e:
                logger.error(f"Error processing productos JSON: {str(e)}")
        
        # Calculate available stock
        stock = {}
        for col in cols:
            stock[col] = inventory_totals.get(col, 0) - request_totals.get(col, 0)
            
        return stock
        
    except Exception as e:
        logger.error(f"Error getting stock: {str(e)}")
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

def send_email_notification(recipients: List[str], subject: str, template_data: Dict[str, Any]) -> bool:
    """
    Send email notification.
    
    Args:
        recipients: List of email addresses
        subject: Email subject
        template_data: Data to include in the email template
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Get email configuration from environment
        email_user = os.environ.get('EMAIL_USER')
        email_password = os.environ.get('EMAIL_PASSWORD')
        
        if not email_user or not email_password:
            logger.error("Email credentials not configured")
            return False
        
        # Create email content
        msg = MIMEMultipart("alternative")
        msg["From"] = email_user
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        
        # Generate email body based on template_data
        body_html = generate_email_template(template_data)
        msg.attach(MIMEText(body_html, "html"))
        
        # Send email
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(email_user, email_password)
        server.sendmail(email_user, recipients, msg.as_string())
        server.quit()
        
        logger.info(f"Email sent successfully to {', '.join(recipients)}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

def generate_email_template(data: Dict[str, Any]) -> str:
    """
    Generate HTML template for email notifications
    
    Args:
        data: Data to include in the template
    
    Returns:
        str: HTML content for email
    """
    productos_html = ""
    productos = data.get('productos', [])
    if isinstance(productos, str):
        try:
            productos = json.loads(productos)
        except:
            productos = []
    
    if isinstance(productos, list):
        productos_html = "".join(f"<li>{p}</li>" for p in productos)
    elif isinstance(productos, dict):
        productos_html = "".join(f"<li>{k}: {v}</li>" for k, v in productos.items())
    
    return f"""
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {{
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }}
          .container {{
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
          }}
          h2 {{
            color: #006699;
            margin-top: 0;
          }}
          table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }}
          table, th, td {{
            border: 1px solid #ddd;
          }}
          th {{
            background-color: #f2f2f2;
          }}
          th, td {{
            text-align: left;
            padding: 8px;
          }}
          .button {{
            display: inline-block;
            background-color: #006699;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
          }}
          .footer {{
            margin-top: 20px;
            font-size: 12px;
            color: #777;
          }}
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Nueva Solicitud de {data.get('solicitante', 'N/A')}</h2>
          <p>Estimados,</p>
          <p>Se ha registrado una nueva solicitud de inventario con la siguiente información:</p>
          <table>
            <tr>
              <th>ID</th>
              <td>{data.get('id', 'N/A')}</td>
            </tr>
            <tr>
              <th>Fecha/Hora de Registro</th>
              <td>{data.get('timestamp', 'N/A')}</td>
            </tr>
            <tr>
              <th>Solicitante</th>
              <td>{data.get('solicitante', 'N/A')}</td>
            </tr>
            <tr>
              <th>Grupo</th>
              <td>{data.get('grupo', 'N/A')}</td>
            </tr>
            <tr>
              <th>RUC</th>
              <td>{data.get('ruc', 'N/A')}</td>
            </tr>
            <tr>
              <th>Fecha de Visita</th>
              <td>{data.get('fecha_visita', 'N/A')}</td>
            </tr>
            <tr>
              <th>Cantidad de Packs</th>
              <td>{data.get('cantidad_packs', 'N/A')}</td>
            </tr>
            <tr>
              <th>Productos</th>
              <td>
                <ul>{productos_html}</ul>
              </td>
            </tr>
            <tr>
              <th>Catálogos</th>
              <td>{data.get('catalogos', 'N/A')}</td>
            </tr>
            <tr>
              <th>Estado</th>
              <td>{data.get('status', 'pending')}</td>
            </tr>
          </table>
          <p>Para aprobar o procesar esta solicitud, haga clic en el siguiente enlace:</p>
          <p>
            <a href="https://kossodo.estilovisual.com/marketing/inventario/confirmacion.html" class="button">
              Aprobar/Procesar Solicitud
            </a>
          </p>
          <p>Si necesita más información, revise la solicitud en el sistema.</p>
          <p>Saludos cordiales,<br/><strong>Sistema de Inventario</strong></p>
          <div class="footer">
            Este mensaje ha sido generado automáticamente. No responda a este correo.
          </div>
        </div>
      </body>
    </html>
    """