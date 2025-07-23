from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import pytz
import time
import config as config # 1. config 파일 불러오기

# --- Flask 앱 생성 및 설정 ---
app = Flask(__name__)
# 모든 도메인에서의 요청을 허용하는 CORS 설정 (테스트용)
CORS(app)

# --- API 엔드포인트 ---
@app.route('/api', methods=['POST'])
def handle_request():
    """ 클라이언트로부터 오는 모든 POST 요청을 처리합니다. """
    
    # 1. 클라이언트가 보낸 JSON 데이터 파싱
    try:
        req_data = request.get_json()
        action = req_data.get('action')
        payload = req_data.get('payload', {})
    except Exception as e:
        return jsonify({"type": "error", "message": f"잘못된 요청 형식입니다: {e}"}), 400

    # 2. 수신된 요청을 서버 콘솔에 기록
    print("\n--- 클라이언트로부터 메시지 수신 ---")
    print(req_data)
    print("------------------------------------")
    
    # 가상 네트워크 지연시간 (1초)
    time.sleep(1)

    response_data = {}

    # 3. 요청 'action'에 따라 분기 처리
    
    # init_room_201.html에서 '음식주문' 버튼 클릭 시
    if action == "get_food_menu":
        response_data = {
            "type": "response",
            "action": "get_food_menu",
            "payload": {
                "food_items": config.FOOD_MENU
            }
        }
    
    # init_room_201.html에서 '비품주문' 버튼 클릭 시
    elif action == "get_supply_menu":
        response_data = {
            "type": "response",
            "action": "get_supply_menu",
            "payload": {
                "supply_items": config.SUPPLY_MENU
            }
        }
        
    # page_callfood_2.html에서 '주문하기' 버튼 클릭 시
    elif action == "create_delivery_task":
        print("요청된 주문 내역:", payload.get("order_details", {}).get("items"))
        korea_time = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()
        response_data = {
            "type": "response",
            "action": "create_delivery_task",
            "payload": {
                "location_name": payload.get("location_name"),
                "task_name": "TASK_005",  # 예시 작업 이름
                "success": True,
                "error_code": None,
                "error_message": None,
                "task_creation_time": korea_time
            }
        }
        
    # 기타 다른 action들에 대한 응답
    elif action == "create_call_task":
        korea_time = datetime.now(pytz.timezone('Asia/Seoul')).isoformat()
        response_data = {
            "type": "response",
            "action": "create_call_task",
            "payload": {
                "location_name": payload.get("location"),
                "task_name": config.DEFAULT_DELIVERY_TASK_NAME,
                "success": True,
                "error_code": None,
                "error_message": None,
                "task_creation_time": korea_time
            }
        }
        
    # 정의되지 않은 action이 들어올 경우
    else:
        response_data = {
            "type": "error",
            "message": f"'{action}'은(는) 정의되지 않은 action입니다."
        }

    # 4. 최종 응답 데이터를 클라이언트로 전송
    print("--- 클라이언트로 응답 전송 ---")
    print(response_data)
    print("---------------------------------")
    return jsonify(response_data)

# --- 서버 실행 ---
if __name__ == '__main__':
    # host='0.0.0.0'으로 설정 시, 같은 네트워크의 다른 기기에서 접속 가능
    app.run(host=config.SERVER_HOST, port=config.SERVER_PORT, debug=True)