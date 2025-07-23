# test_server.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 분리된 모듈들을 가져옵니다.
from models import RequestModel
import services
import config  # ✅ This line is added to fix the error

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
def handle_request(req_data: RequestModel):
    """ 클라이언트로부터 오는 모든 POST 요청을 처리하는 단일 엔드포인트 """
    print(f"\n--- 수신된 Action: {req_data.action} ---")
    
    handler = ACTION_HANDLERS.get(req_data.action)
    
    if handler:
        response_data = handler(req_data.payload)
    else:
        response_data = {
            "type": "error",
            "message": f"'{req_data.action}'은(는) 정의되지 않은 action입니다."
        }
        
    print(f"--- 전송할 응답 --- \n{response_data}\n--------------------")
    return response_data

# --- 서버 실행 ---
if __name__ == '__main__':
     # 이제 'config'가 정의되었으므로 정상적으로 작동합니다.
     uvicorn.run(app, host=config.SERVER_HOST, port=config.SERVER_PORT)