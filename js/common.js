// common.js app.js와 중복되는 초기화 로직을 제거하고, 순수한 유틸리티와 WebSocket 모듈
// API 요청을 보내는 범용 함수

let toastTimer; // 타이머 ID를 저장할 변수

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


export function showToast(imageSrc) { // 두 번째 인자로 메시지를 받도록 수정
    const globalToast = document.getElementById('global-toast');
    const toastImage = document.getElementById('toast-full-image');
    const toastMessage = document.getElementById('toast-message'); // 메시지를 표시할 요소 추가 (HTML에도 추가 필요)

    if (!globalToast || !toastImage || !toastMessage) {
        console.error("알림창을 위한 HTML 요소를 찾을 수 없습니다.");
        return;
    }

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastImage.src = imageSrc;
    globalToast.classList.remove('hidden');

    toastTimer = setTimeout(() => {
        globalToast.classList.add('hidden');
    }, 2000);
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
            if (eventData.type !== "event") return;

            switch (eventData.action) {
                case "call_request_acceptance":
                    // ...
                    break;

                // ✅ showToast 호출 시 상대경로가 아닌, 웹 루트 기준 절대경로로 변경
                case "robot_arrival_completion":
                    showToast("/assets/images/robot_arrived_pickup.png", "로봇이 문 앞에 도착했습니다.");
                    break;
                    
                case "delivery_completion":
                    showToast("/assets/images/delivery_completed_notification.png", "요청하신 물품의 배송이 완료되었습니다.");
                    break;

                case "task_timeout_return":
                    showToast("/assets/images/timeout_return_notification.png", "시간이 초과되어 로봇이 복귀합니다.");
                    break;

                default:
                    console.warn("알 수 없는 WebSocket 이벤트 액션:", eventData.action);
                    return; 
            }

        } catch (error) {
            console.error("WebSocket 메시지 처리 중 오류 발생:", error);
        }
    };


    ws.onclose = () => {
        console.log("WebSocket 연결이 종료되었습니다. 5초 후 재연결을 시도합니다.");
        // 안정성을 위해 재연결 로직 추가를 고려할 수 있습니다.
        // setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error("WebSocket 오류 발생:", error);
    };
}
