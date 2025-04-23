from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Union, Any

@dataclass
class MerchandisingItem:
    """Model class for merchandising items"""
    id: int = None
    name: str = None
    column_name: str = None
    quantity: int = 0

@dataclass
class InventoryRequest:
    """Model class for inventory requests"""
    id: int = None
    timestamp: datetime = None
    solicitante: str = None
    grupo: str = None
    ruc: str = None
    fecha_visita: str = None
    cantidad_packs: int = 0
    productos: List[str] = None
    catalogos: str = None
    status: str = "pending"

@dataclass
class RequestConfirmation:
    """Model class for request confirmations"""
    id: int = None
    timestamp: datetime = None
    solicitud_id: int = None
    confirmador: str = None
    observaciones: str = None
    productos: Dict[str, int] = None
    grupo: str = None