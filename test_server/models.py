# models.py
from pydantic import BaseModel
from typing import List, Optional

class OrderItem(BaseModel):
    name: str
    quantity: int
    price: int

class OrderDetails(BaseModel):
    items: List[OrderItem]

class RequestPayload(BaseModel):
    location_name: Optional[str] = None
    request_location: Optional[str] = None
    task_name: Optional[str] = None
    task_type_name: Optional[str] = None
    order_details: Optional[OrderDetails] = None
    location: Optional[str] = None

class RequestModel(BaseModel):
    action: str
    payload: Optional[RequestPayload] = {}