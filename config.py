# 서버 및 애플리케이션 기본 설정
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 5001
TIMEZONE = "Asia/Seoul"

# 작업 관련 상수
DEFAULT_DELIVERY_TASK_NAME = "TASK_005"
DEFAULT_CALL_TASK_NAME = "TASK_006"

# 메뉴 데이터: 모든 메뉴 정보를 여기서 관리합니다.
FOOD_MENU = [
    {"food_name": "스파게티", "price": 15000, "image": "/images/spaghetti.jpg"},
    {"food_name": "피자", "price": 25000, "image": "/images/pizza.jpg"}
]

SUPPLY_MENU = [
    {"supply_name": "타월", "image": "/images/towel.jpg"},
    {"supply_name": "생수", "image": "/images/water.jpg"}
]