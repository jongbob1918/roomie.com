// common.js

// DOM이 완전히 로드된 후에 실행되도록 합니다.
document.addEventListener('DOMContentLoaded', () => {
    
    // 헤더의 방 번호를 동적으로 설정하는 기능
    // config.js에 정의된 방 번호를 가져와서 헤더에 삽입합니다.
    const roomNumberElement = document.querySelector('.room-number') || document.querySelector('.header');
    if (roomNumberElement && typeof CONFIG !== 'undefined' && CONFIG.DEFAULT_ROOM_ID) {
        // textContent를 사용하여 해당 요소의 텍스트만 변경합니다.
        // 일부 페이지는 '201호', 다른 페이지는 'ROOMIE 201호'와 같이 포맷이 다르므로,
        // 마지막 자식 텍스트 노드를 업데이트하거나, 적절한 span 태그를 사용하도록 HTML을 통일하는 것이 좋습니다.
        // 여기서는 .room-number 클래스를 가진 요소의 텍스트를 변경하는 것으로 통일합니다.
        if (roomNumberElement.classList.contains('room-number')) {
            roomNumberElement.textContent = CONFIG.DEFAULT_ROOM_ID;
        }
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