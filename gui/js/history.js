import { sendApiRequest, showToast } from './common.js'; // ⬅️ 1. showToast 임포트 추가


// --- 시간 포맷 함수 (공통 사용) ---
function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${ampm} ${hours}:${minutes}`;
}

let historyInterval; // 주기적 업데이트를 제어하기 위한 변수


export async function loadHistoryList(containerId) { // ⬅️ containerId 인자 추가
  try {
    const request = {
      type: "request",
      action: "get_task_list",
      payload: {
        request_location: window.ROOM_ID
      }
    };
    
    // ⬅️ 3. API 전체 주소를 사용하도록 수정
    const result = await sendApiRequest(`${window.API_URL}/get_task_list`, request);

    if (result && result.payload && result.payload.order_details?.tasks) {
      localStorage.setItem("orderHistory", JSON.stringify(result.payload.order_details.tasks));
      renderHistoryList(containerId, result.payload.order_details.tasks);
    } else {
      showToast("assets/error_toast.png", "error");
    }
  } catch (err) {
    console.error("이력 조회 실패:", err);
    showToast("assets/error_toast.png", "error");
  }
}

function renderHistoryList(containerId, list) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = "<p style='text-align:center; color:#888;'>요청 이력이 없습니다.</p>";
    return;
  }
  
  // ⬅️ 4. CSS와 일치하도록 클래스 이름 수정
  container.innerHTML = list.map(item => `
    <div class="task-card" data-task-name="${item.task_name}" data-task-type="${item.task_type_name}">
      <strong class="task-title">${item.task_type_name}</strong>
      <span class="task-time">${formatTime(item.created_at)}</span>
      <button class="btn-detail">상세보기</button>
    </div>
  `).join("");

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-detail')) {
      const historyItem = e.target.closest('.task-card');
      const taskName = historyItem.dataset.taskName;
      const taskType = historyItem.dataset.taskType;
      
      localStorage.setItem("selectedTask", taskName);
      localStorage.setItem("selectedTaskType", taskType);
      location.hash = `history-detail`; 
    }
  });
}
export async function renderHistoryDetail(containerId) {
    // 다른 페이지로 이동 시, 이전에 실행되던 주기적 업데이트를 중지
    if (historyInterval) clearInterval(historyInterval);

    const container = document.getElementById(containerId);
    if (!container) return;
    
    const taskName = localStorage.getItem("selectedTask");
    const taskType = localStorage.getItem("selectedTaskType");
    if (!taskName || !taskType) {
        container.innerHTML = `<p>조회할 작업 정보가 없습니다.</p>`;
        return;
    }

    // 실제 API 호출 및 UI 업데이트를 수행하는 함수
    async function fetchAndUpdateStatus() {
        try {
            const isCall = taskType.includes("호출");
            const url = isCall ? `${window.API_URL}/get_call_history` : `${window.API_URL}/get_order_history`;
            const action = isCall ? "get_call_history" : "get_order_history";

            let payload;
            if (isCall) {
                payload = { location_name: window.ROOM_ID, task_name: taskName };
            } else {
                payload = { request_location: window.ROOM_ID, task_name: taskName, task_type_name: taskType };
            }
            const request = { type: "request", action, payload };

            const result = await sendApiRequest(url, request);
            updateUI(result.payload, isCall);

        } catch (err) {
            console.error("상세 이력 업데이트 실패:", err);
            // 에러 발생 시, 주기적 업데이트 중지
            if (historyInterval) clearInterval(historyInterval);
        }
    }

    // UI를 업데이트하는 함수
    function updateUI(p, isCall) {
        if (!p) return;

        // 헤더 정보 업데이트
        document.getElementById('task_type_name').textContent = isCall ? "로봇 호출" : p.task_type_name;
        document.getElementById('request_location_name').textContent = `목적지 ${p.request_location || p.location_name}`;
        
        // 타임라인 데이터 정의
        const timelineData = isCall ? [
            { id: 'status_creation', time: p.task_creation_time, text: '호출 접수됨' },
            { id: 'status_arrival', time: null, text: '로봇 도착' },
        ] : [
            { id: 'status_creation', time: p.task_creation_time, text: '주문 접수됨' },
            { id: 'status_assignment', time: p.robot_assignment_time, text: '로봇 배정됨' },
            { id: 'status_pickup', time: p.pickup_completion_time, text: '픽업 완료됨' },
            { id: 'status_arrival', time: p.delivery_arrival_time, text: '배달 완료됨' }
        ];
        
        // 도착 예정 시간 표시
        const lastCompleted = [...timelineData].reverse().find(s => s.time);
        if (lastCompleted && lastCompleted.id !== 'status_arrival' && p.estimated_time) {
             const arrivalTime = new Date(new Date(lastCompleted.time).getTime() + p.estimated_time * 1000);
             document.getElementById('estimated_time').textContent = `${formatTime(arrivalTime.toISOString())} 도착 예정`;
        } else {
             document.getElementById('estimated_time').textContent = '완료';
        }


        // 타임라인 HTML 생성
        const timelineContainer = document.getElementById('status-timeline');
        timelineContainer.innerHTML = ''; // 기존 타임라인 비우기
        
        timelineData.forEach(status => {
            const item = document.createElement('div');
            item.className = `timeline-item ${!status.time ? 'inactive' : ''}`;
            item.innerHTML = `
                <div class="timeline-point">
                    <div class="point"></div>
                    <div class="line"></div>
                </div>
                <div class="timeline-details">
                    <span class="status-text">${status.text}</span>
                    <span class="status-time">${formatTime(status.time)}</span>
                </div>`;
            timelineContainer.appendChild(item);
        });
    }

    // 최초 1회 즉시 실행 후, 15초마다 주기적으로 상태 업데이트
    fetchAndUpdateStatus();
    historyInterval = setInterval(fetchAndUpdateStatus, 15000);
}