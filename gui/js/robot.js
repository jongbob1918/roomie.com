// js/robot.js (수정 후)
import { showToast } from './common.js';

export async function callRobot() {
  // 1. 먼저 '호출 중' 화면으로 전환
  location.hash = 'call-robot-loading';

  const request = {
    type: "request",
    action: "create_call_task",
    payload: {
      location_name: window.ROOM_ID,
      task_type_id: 2 // API 명세에 따른 '호출' 타입
    }
  };

  try {
    // 2. API 명세에 맞는 올바른 주소로 API 호출
    const response = await fetch(`${window.API_URL}/create_call_task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const result = await response.json();
    
    if (result.payload && result.payload.success) {
      // 3. 성공 시, 작업 정보를 저장하고 '호출 성공' 화면으로 전환
      localStorage.setItem("selectedTask", result.payload.task_name);
      localStorage.setItem("selectedTaskType", "로봇호출");
      location.hash = `robot-success`;
    } else {
      showToast("./assets/images/error_toast.png", result.payload.error_message || "호출에 실패했습니다.");
      location.hash = "/"; // 실패 시 메인 화면으로 복귀
    }
  } catch (err) {
    console.error("로봇 호출 API 요청 실패:", err);
    showToast("./assets/images/error_toast.png", "오류가 발생했습니다.");
    location.hash = "/"; // 실패 시 메인 화면으로 복귀
  }
}