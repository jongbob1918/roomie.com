# services.py
from datetime import datetime, timedelta
import pytz
import uuid # 동적인 Task ID 생성을 위해 추가

# config.py와 models.py에서 필요한 내용을 가져옵니다.
import config
from models import RequestPayload

# 모든 서비스 함수들은 동일한 timezone을 사용합니다.
KST = pytz.timezone(config.TIMEZONE)

def get_food_menu(payload: RequestPayload) -> dict:
    """ 음식 메뉴를 반환하는 서비스 """
    return {
        "type": "response",
        "action": "get_food_menu",
        "payload": {"food_items": config.FOOD_MENU}
    }

def get_supply_menu(payload: RequestPayload) -> dict:
    """ 비품 메뉴를 반환하는 서비스 """
    return {
        "type": "response",
        "action": "get_supply_menu",
        "payload": {"supply_items": config.SUPPLY_MENU}
    }

def create_delivery_task(payload: RequestPayload) -> dict:
    """ 배달 작업을 생성하는 서비스 """
    # 동적으로 고유한 작업 ID 생성 (하드코딩 제거)
    task_id = f"TASK_{str(uuid.uuid4())[:8].upper()}"
    print(f"새로운 배달 작업 생성: {task_id}")
    print("요청된 주문 내역:", payload.order_details.items)
    
    return {
        "type": "response",
        "action": "create_delivery_task",
        "payload": {
            "location_name": payload.location_name,
            "task_name": task_id,
            "success": True,
            "error_code": None,
            "error_message": None,
            "estimated_time": 55,
            "task_creation_time": datetime.now(KST).isoformat()
        }
    }

def get_order_history(payload: RequestPayload) -> dict:
    """ 주문 내역을 반환하는 서비스 """
    now = datetime.now(KST)
    return {
        "type": "response",
        "action": "get_order_history",
        "payload": {
            "request_location": payload.request_location,
            "task_name": payload.task_name,
            "task_type_name": payload.task_type_name,
            "estimated_time": 55,
            "task_creation_time": (now - timedelta(minutes=5)).isoformat(),
            "robot_assignment_time": (now - timedelta(minutes=4)).isoformat(),
            "pickup_completion_time": now.isoformat(),
            "delivery_arrival_time": None
        }
    }

def create_call_task(payload: RequestPayload) -> dict:
    """ 로봇 호출 작업을 생성하는 서비스 """
    task_id = f"TASK_{str(uuid.uuid4())[:8].upper()}"
    print(f"새로운 호출 작업 생성: {task_id}")
    
    return {
        "type": "response",
        "action": "create_call_task",
        "payload": {
            "location_name": payload.location,
            "task_name": task_id,
            "success": True,
            "error_code": None,
            "error_message": None,
            "task_creation_time": datetime.now(KST).isoformat()
        }
    }