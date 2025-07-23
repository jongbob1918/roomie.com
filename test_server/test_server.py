# test_server.py
from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import asyncio # 비동기 작업을 위해 asyncio 임포트
import random 
# 분리된 모듈들을 가져옵니다.
from models import RequestModel
import services
import config

# 클라이언트에 메시지를 전송할 수 있는 활성 WebSocket 연결들을 저장하는 리스트
active_connections: list[WebSocket] = []
notification_type = 0


# --- FastAPI 앱 및 미들웨어 설정 ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Action 핸들러 맵 ---
ACTION_HANDLERS = {
    "get_food_menu": services.get_food_menu,
    "get_supply_menu": services.get_supply_menu,
    "create_delivery_task": services.create_delivery_task,
    "get_order_history": services.get_order_history,
    "create_call_task": services.create_call_task,
}

# --- API 엔드포인트 ---
@app.post("/api")
async def handle_request(req_data: RequestModel): # async로 변경
    """ 클라이언트로부터 오는 모든 POST 요청을 처리하는 단일 엔드포인트 """
    print(f"\n--- 수신된 Action: {req_data.action} ---")
    
    handler = ACTION_HANDLERS.get(req_data.action)
    
    if handler:
        # services.py의 함수들이 대부분 동기 함수이므로,
        # 여기서는 바로 호출합니다. 만약 services.py의 함수가
        # awaitable (async def) 함수로 변경된다면 여기서 await 해야 합니다.
        response_data = handler(req_data.payload) 
    else:
        response_data = {
            "type": "error",
            "message": f"'{req_data.action}'은(는) 정의되지 않은 action입니다."
        }
        
    print(f"--- 전송할 응답 --- \n{response_data}\n--------------------")

    # 기존 get_order_history 요청 시 테스트 이벤트 전송 로직은 제거 (아래 주기적 전송으로 대체)
    # if req_data.action == "get_order_history":
    #     timeout_event = {
    #         "type": "event",
    #         "action": "task_timeout_return",
    #         "payload": {
    #             "task_name": "TASK_006",
    #             "location_name": "ROOM_102"
    #         }
    #     }
    #     await broadcast_event(timeout_event) 

    return response_data

# WebSocket 엔드포인트
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"새로운 WebSocket 연결: {websocket.client}")
    try:
        while True:
            # 클라이언트로부터 메시지를 받을 필요가 없다면 receive_text()는 제거하거나
            # 짧은 asyncio.sleep()으로 대체하여 리소스 소모를 줄일 수 있습니다.
            # await websocket.receive_text() # 클라이언트 메시지 수신 (현재 알림 시스템에는 불필요)
            await asyncio.sleep(0.1) # CPU 사용률을 낮추기 위한 짧은 대기
    except Exception as e:
        print(f"WebSocket 연결 오류/종료 ({websocket.client}): {e}")
    finally:
        active_connections.remove(websocket)
        print(f"WebSocket 연결 해제됨: {websocket.client}")

# --- 이벤트 브로드캐스트 함수 ---
async def broadcast_event(event_data: dict):
    print(f"이벤트 전송됨: {event_data} to {connection.client}")
    # 연결이 끊긴 소켓을 추적하여 제거하기 위한 리스트
    to_remove = []
    for connection in active_connections:
        
        try:
            await connection.send_text(json.dumps(event_data))

            # print(f"이벤트 전송됨: {event_data} to {connection.client}") # 디버깅용
        except Exception as e:
            print(f"메시지 전송 실패 (연결 끊김 예상): {connection.client}, 오류: {e}")
            to_remove.append(connection)
    
    # 전송 실패한 연결들을 active_connections 리스트에서 제거
    for connection in to_remove:
        if connection in active_connections: # 중복 제거 방지
            active_connections.remove(connection)

# --- 주기적으로 알림 이벤트를 전송하는 백그라운드 태스크 ---
async def send_periodic_notifications():
    global notification_type
    while True:
        await asyncio.sleep(20)  # 20초마다 실행

        event_options = [
            {
                "type": "event",
                "action": "call_request_acceptance",
                "payload": {
                    "task_name": "TASK_006",
                    "estimated_wait_time": 15
                }
            },
            {
                "type": "event",
                "action": "robot_arrival_completion",
                "payload": {
                    "task_name": "TASK_006",
                    "location_name": "ROOM_201"
                }
            },
            {
                "type": "event",
                "action": "delivery_completion",
                "payload": {
                    "task_name": "TASK_001",
                    "request_location": "ROOM_201"
                }
            },
            {
                "type": "event",
                "action": "task_timeout_return",
                "payload": {
                    "task_name": "TASK_006",
                    "location_name": "ROOM_201"
                }
            }
        ]

        event_data = random.choice(event_options)
        print(f"\n--- 주기적 알림: '{event_data['action']}' ---")
        asyncio.create_task(broadcast_event(event_data))
        
        # 다음 알림 타입으로 변경 (순환)
        notification_type = (notification_type + 1) % 3 

# --- 서버 시작 시 백그라운드 태스크 등록 ---
@app.on_event("startup")
async def startup_event():
    # 백그라운드에서 주기적 알림 전송 태스크 시작
    asyncio.create_task(send_periodic_notifications())
    print("FastAPI 서버 시작. 주기적 알림 태스크 활성화.")


# --- 서버 실행 ---
if __name__ == '__main__':
    uvicorn.run(app, host=config.SERVER_HOST, port=config.SERVER_PORT)