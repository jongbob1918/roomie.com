# test_server.py (수정 후)

from fastapi import FastAPI, WebSocket, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect # 예외 처리를 위해 추가
import uvicorn
import json
import asyncio
import random

from models import RequestModel, RequestPayload # RequestModel은 이제 각 함수에서 직접 payload를 받으므로 RequestPayload가 더 많이 쓰일 수 있습니다.
import services
import config

# --- FastAPI 앱 및 미들웨어 설정 ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- /api/gui 접두사를 가진 API 라우터 생성 ---
router = APIRouter(prefix="/api/gui")

# --- WebSocket 연결 관리 (room_id 기반 딕셔너리로 변경) ---
# { "ROOM_102": [websocket1, websocket2], "ROOM_201": [websocket3] } 형태
room_connections: dict[str, list[WebSocket]] = {}


# --- API 엔드포인트 (개별 함수로 분리) ---

@router.post("/get_food_menu")
async def get_food_menu_endpoint(payload: RequestPayload):
    print_request_info("get_food_menu", payload)
    return services.get_food_menu(payload)

@router.post("/get_supply_menu")
async def get_supply_menu_endpoint(payload: RequestPayload):
    print_request_info("get_supply_menu", payload)
    return services.get_supply_menu(payload)

@router.post("/create_delivery_task")
async def create_delivery_task_endpoint(payload: RequestPayload):
    print_request_info("create_delivery_task", payload)
    return services.create_delivery_task(payload)

@router.post("/get_order_history")
async def get_order_history_endpoint(payload: RequestPayload):
    print_request_info("get_order_history", payload)
    # 특정 작업 조회가 시작되면 해당 방에 알림을 보낼 수 있습니다 (예시).
    # task_name = payload.task_name
    # room_id = payload.request_location
    # await broadcast_event_to_room(room_id, {"type": "event", "action": "history_view_started", "payload": {"task_name": task_name}})
    return services.get_order_history(payload)

@router.post("/create_call_task")
async def create_call_task_endpoint(payload: RequestPayload):
    print_request_info("create_call_task", payload)
    return services.create_call_task(payload)

# 생성한 라우터를 앱에 포함
app.include_router(router)


# --- WebSocket 엔드포인트 (경로 및 로직 수정) ---
@app.websocket("/api/gui/ws/guest/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    if room_id not in room_connections:
        room_connections[room_id] = []
    room_connections[room_id].append(websocket)
    print(f"새로운 WebSocket 연결: {room_id} ({websocket.client})")

    try:
        while True:
            # 클라이언트로부터 메시지를 기다리며 연결 유지
            await websocket.receive_text()
    except WebSocketDisconnect:
        print(f"WebSocket 연결 해제됨: {room_id} ({websocket.client})")
    finally:
        # 연결 종료 시 해당 웹소켓 제거
        if room_id in room_connections:
            room_connections[room_id].remove(websocket)
            if not room_connections[room_id]: # 방에 연결된 클라이언트가 없으면 딕셔너리에서 해당 방 제거
                del room_connections[room_id]

# --- 이벤트 브로드캐스트 함수 (특정 방 타겟팅 기능 추가) ---
async def broadcast_event_to_room(room_id: str, event_data: dict):
    if room_id in room_connections:
        connections = room_connections[room_id]
        to_remove = []
        for connection in connections:
            try:
                await connection.send_text(json.dumps(event_data))
                print(f"이벤트 전송됨: {event_data} to {room_id} ({connection.client})")
            except Exception as e:
                print(f"메시지 전송 실패 (연결 끊김 예상): {connection.client}, 오류: {e}")
                to_remove.append(connection)
        
        # 전송 실패한 연결 제거
        for connection in to_remove:
            connections.remove(connection)

# 모든 방에 브로드캐스트 (필요 시 사용)
async def broadcast_event_to_all(event_data: dict):
    for room_id in list(room_connections.keys()):
        await broadcast_event_to_room(room_id, event_data)

# --- 주기적 알림 전송 백그라운드 태스크 (수정) ---
async def send_periodic_notifications():
    while True:
        await asyncio.sleep(20)

        # ... (기존 event_options 로직은 동일) ...
        event_options = [
            # ... (기존 이벤트 목록) ...
        ]
        event_data = random.choice(event_options)
        
        # 페이로드에서 타겟 위치(room_id)를 추출
        target_room = event_data["payload"].get("location_name") or event_data["payload"].get("request_location")

        if target_room:
             print(f"\n--- 주기적 알림: '{event_data['action']}' to {target_room} ---")
             # 특정 방에만 이벤트 전송
             await broadcast_event_to_room(target_room, event_data)
        else:
             print(f"\n--- 주기적 알림 (전체): '{event_data['action']}' ---")
             # 타겟 방이 없으면 전체에 보내거나, 보내지 않도록 정책 결정 가능
             # await broadcast_event_to_all(event_data)


# --- 로깅을 위한 헬퍼 함수 ---
def print_request_info(action: str, payload: RequestPayload):
    print(f"\n--- 수신된 Action: {action} ---")
    try:
        # Pydantic 모델을 dict로 변환하여 JSON으로 출력
        print(json.dumps(payload.dict(), ensure_ascii=False, indent=2))
    except Exception as e:
        print("페이로드 출력 실패:", e)

# ... (서버 시작 로직은 동일) ...
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(send_periodic_notifications())
    print("FastAPI 서버 시작. 주기적 알림 태스크 활성화.")

if __name__ == '__main__':
    uvicorn.run(app, host=config.SERVER_HOST, port=config.SERVER_PORT)