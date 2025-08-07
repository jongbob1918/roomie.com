// common.js app.js와 중복되는 초기화 로직을 제거하고, 순수한 유틸리티와 WebSocket 모듈
// API 요청을 보내는 범용 함수
export function sendApiRequest(url, data) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

/**
 * 이미지 경로를 받아 화면에 알림창(토스트)을 표시하는 함수
 * @param {string} imageSrc - 표시할 이미지의 경로
 */
export function showToast(imageSrc) {
    const globalToast = document.getElementById('global-toast');
    const toastImage = document.getElementById('toast-full-image'); // index.html의 이미지 태그 ID

    // HTML 요소가 없으면 함수를 중단하여 오류를 방지합니다.
    if (!globalToast || !toastImage) {
        console.error("알림창을 위한 HTML 요소를 찾을 수 없습니다.");
        return;
    }

    // 이전에 표시된 알림이 있다면, 숨김 타이머를 취소합니다.
    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    // 새 이미지로 교체하고 알림창을 화면에 표시합니다.
    toastImage.src = imageSrc;
    globalToast.classList.remove('hidden');

    // 3초 뒤에 알림창을 자동으로 숨깁니다.
    toastTimer = setTimeout(() => {
        globalToast.classList.add('hidden');
    }, 3000);
}


// --- 웹소켓 초기화 함수 (이미지 경로만 전달하도록 수정) ---
export function initWebSocket() {
    const ws = new WebSocket(window.WS_URL);

    ws.onopen = () => {
        console.log("WebSocket 연결 성공");
    };

    ws.onmessage = (event) => {
        try {
            const eventData = JSON.parse(event.data);
            if (eventData.type !== "event") return; // 이벤트가 아니면 무시

            let imagePath = "";
            // 서버로부터 받은 이벤트 종류에 따라, 보여줄 알림 이미지 경로를 결정합니다.
            // (참고: 아래 이미지 경로는 예시이며, 실제 보유한 파일 경로에 맞게 수정해야 합니다.)
            switch (eventData.action) {
                case "call_request_acceptance":
                    break;
                case "robot_arrival_completion":
                    imagePath = "../assets/images/assets/images/delivery_completed_notification.png.png";
                    break;
                case "delivery_completion":
                    imagePath = "../assets/images/robot_arrived_pickup.png";
                    break;
                case "task_timeout_return":
                    imagePath = "../assets/images/timeout_return_notification.png";
                    break;
                default:
                    return; // 정의되지 않은 이벤트는 무시
            }
            
            // 결정된 이미지로 알림을 띄웁니다.
            showToast(imagePath);

        } catch (error) {
            console.error("WebSocket 메시지 처리 중 오류 발생:", error);
        }
    };

    ws.onclose = () => {
        console.log("WebSocket 연결이 종료되었습니다.");
    };

    ws.onerror = (error) => {
        console.error("WebSocket 오류 발생:", error);
    };
}
// WebSocket 메시지 처리 로직
function handleWebSocketMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("WebSocket 메시지 수신:", data);

        if (data.type === "event") {
            switch (data.action) {
                case "task_timeout_return":
                    showToast('../assets/images/timeout_return_notification.png');
                    break;
                case "delivery_completion":
                    showToast('../assets/images/delivery_completed_notification.png');
                    // 필요 시, 특정 주문 상세 페이지로 이동하거나 상태를 업데이트하는 로직 추가
                    break;
                case "robot_arrival_completion":
                    showToast('../assets/images/robot_arrived_pickup.png');
                    location.hash = 'robot-success'; // 로봇 도착 시 성공 화면으로 자동 전환
                    break;
                case "call_request_acceptance":
                    showToast('../assets/images/call_accepted.png');
                    break;
                default:
                    console.warn("알 수 없는 이벤트 액션:", data.action);
            }
        }
    } catch (e) {
        console.error("WebSocket 메시지 파싱 오류:", e);
    }
}