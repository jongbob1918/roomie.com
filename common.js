//공통 기능 도구함 
// DOM이 완전히 로드된 후에 실행되도록 합니다.
document.addEventListener('DOMContentLoaded', () => {
    
    // 헤더의 방 번호를 동적으로 설정하는 기능
    const roomNumberElement = document.querySelector('.header');
    if (roomNumberElement) {
        // config.js에 정의된 방 번호를 가져와서 헤더에 삽입합니다.
        roomNumberElement.textContent = CONFIG.DEFAULT_ROOM_ID;
    }

    // 뒤로가기 버튼 기능 (모든 페이지에서 공통으로 사용 가능)
    const backButton = document.getElementById('back_button_1');
    if(backButton) {
        backButton.addEventListener('click', () => {
            // 이전 페이지로 이동
            window.history.back(); 
        });
    }

    // 여기에 앞으로 만들 페이지들에서 공통으로 사용할 다른 함수들을 추가할 수 있습니다.
});