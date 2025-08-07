// order.js
import { showToast } from './common.js';

export async function loadAndRenderMenu(orderType, containerId) {
    const isFood = orderType === 'food';
    const apiUrl = isFood ? `${window.API_URL}/get_food_menu` : `${window.API_URL}/get_supply_menu`;
    const action = isFood ? 'get_food_menu' : 'get_supply_menu';
    const container = document.getElementById(containerId);

    if (!container) return;
    container.innerHTML = '<p>메뉴를 불러오는 중입니다...</p>';

    try {
        const request = { type: "request", action, payload: { location_name: window.ROOM_ID } };
        const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
        const result = await response.json();
        const items = isFood ? result.payload.food_items : result.payload.supply_items;

        if (items && items.length > 0) {
            renderMenu(items, orderType, container);
            updateTotalPrice(orderType);
        } else {
            container.innerHTML = '<p>메뉴 정보를 불러오는 데 실패했습니다.</p>';
        }
    } catch (error) {
        console.error(`${orderType} 메뉴 로딩 실패:`, error);
        container.innerHTML = '<p>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>';
    }
}

function renderMenu(items, orderType, container) {
    container.innerHTML = '';
    const isFood = orderType === 'food';
    items.forEach((item, index) => {
        const menuItemElement = document.createElement('div');
        menuItemElement.className = 'menu-item';
        
        // --- ✅ 수정된 부분 ---
        // 음식(isFood)인 경우에만 가격(menu-price)이 이름 옆에 표시되도록 수정
        menuItemElement.innerHTML = `
            <div class="menu-image" style="background-image: url('${item.image || 'assets/images/default.png'}');"></div>
            <div class="menu-details">
                <div class="menu-info-top">
                    <span class="menu-name">${item.food_name || item.supply_name}</span>
                    ${isFood ? `<span class="menu-price">${item.price.toLocaleString()}원</span>` : ''}
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn minus-btn"></button>
                    <span class="quantity">1</span>
                    <button class="quantity-btn plus-btn"></button>
                </div>
                <button class="select-button" data-index="${index}">선택</button>
            </div>`;
        // -------------------
        container.appendChild(menuItemElement);
    });
    addMenuEventListeners(orderType, items);
}

function addMenuEventListeners(orderType, items) {
    document.querySelectorAll('.menu-item').forEach((menuItem) => {
        const index = parseInt(menuItem.querySelector('.select-button').dataset.index);
        const item = items[index];
        const qtySpan = menuItem.querySelector('.quantity');
        
        menuItem.querySelector('.plus-btn').addEventListener('click', () => {
            let qty = parseInt(qtySpan.textContent);
            qtySpan.textContent = Math.min(10, qty + 1);
        });
        menuItem.querySelector('.minus-btn').addEventListener('click', () => {
            let qty = parseInt(qtySpan.textContent);
            qtySpan.textContent = Math.max(1, qty - 1);
        });
        menuItem.querySelector('.select-button').addEventListener('click', (e) => {
            const quantity = parseInt(qtySpan.textContent);
            addToCart(item, quantity, orderType);
        });
    });
}

function addToCart(item, quantity, orderType) {
    const isFood = orderType === 'food';
    const cartKey = isFood ? 'cartData' : 'supplyCartData';
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const itemName = isFood ? item.food_name : item.supply_name;
    const existingItem = cart.find(cartItem => cartItem.name === itemName);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ name: itemName, quantity, price: item.price || 0, image: item.image });
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // --- ✅ 수정된 부분 ---
    updateCartButton(orderType);
    updateTotalPrice(orderType); // 장바구니에 아이템 추가 후, 총액을 다시 계산하여 업데이트
    // -------------------
}


// ✅ 메뉴 화면 하단 총액 업데이트 함수
function updateTotalPrice(orderType) {
    const isFood = orderType === 'food';
    if (!isFood) return; // 비품은 총액 표시 안함

    const cartKey = 'cartData';
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const totalPriceElement = document.getElementById('total_price_footer');
    if (totalPriceElement) {
        totalPriceElement.textContent = `총 ${totalPrice.toLocaleString()}원`;
    }
}

export function updateCartButton(orderType) {
    const cartKey = orderType === 'food' ? 'cartData' : 'supplyCartData';
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const cartButton = document.getElementById('button_cart');
    if (cartButton) {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartButton.textContent = itemCount > 0 ? `장바구니 보기 (${itemCount})` : '장바구니 보기';
    }
}

export function renderCartContents(containerId, orderType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const isFood = orderType === 'food';
    const cartKey = isFood ? 'cartData' : 'supplyCartData';
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">장바구니가 비어 있습니다.</p>';
        if (isFood) { document.getElementById('total-price-display').textContent = '0원'; }
        document.getElementById('btn-order').disabled = true;
        return;
    }

    container.innerHTML = '';
    let totalPrice = 0;
    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <div class="item-image" style="background-image: url('${item.image}')"></div>
            <div class="item-details">
                <span class="item-name">${item.name}</span>
                <div class="quantity-control">
                    <button class="quantity-btn minus-btn" data-index="${index}"></button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus-btn" data-index="${index}"></button>
                </div>
                ${isFood ? `<span class="item-price">${(item.price * item.quantity).toLocaleString()}원</span>` : ''}
            </div>
            <button class="delete-btn" data-index="${index}">삭제</button>`;
        container.appendChild(itemElement);
        if (isFood) { totalPrice += item.price * item.quantity; }
    });

    if (isFood) { document.getElementById('total-price-display').textContent = `${totalPrice.toLocaleString()}원`; }
    document.getElementById('btn-order').disabled = false;
    addCartEventListeners(containerId, orderType);
}

function addCartEventListeners(containerId, orderType){
    const cartKey = orderType === 'food' ? 'cartData' : 'supplyCartData';
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const updateAndSaveCart = () => {
        localStorage.setItem(cartKey, JSON.stringify(cart));
        renderCartContents(containerId, orderType);
    };

    document.querySelectorAll('.item .plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            cart[index].quantity = Math.min(10, cart[index].quantity + 1);
            updateAndSaveCart();
        });
    });
    document.querySelectorAll('.item .minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                updateAndSaveCart();
            }
        });
    });
    document.querySelectorAll('.item .delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            cart.splice(index, 1);
            updateAndSaveCart();
        });
    });
}

export async function createOrder(orderType) {
    const isFood = orderType === 'food';
    const cartKey = isFood ? 'cartData' : 'supplyCartData';
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (cart.length === 0) { return alert("장바구니가 비어 있습니다."); }

    const request = {
        type: "request", action: "create_delivery_task",
        payload: {
            location_name: window.ROOM_ID,
            task_type_name: isFood ? "음식배송" : "비품배송",
            order_details: { items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })) }
        }
    };
    try {
        const response = await fetch(`${window.API_URL}/create_delivery_task`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
        const result = await response.json();
        if (result.payload && result.payload.success) {
            localStorage.setItem("selectedTask", result.payload.task_name);
            localStorage.setItem("selectedTaskType", isFood ? "음식배송" : "비품배송");
            // ✅ 아래 줄 추가
            if (result.payload.estimated_time) {
                localStorage.setItem("estimatedTime", result.payload.estimated_time);
            }
            localStorage.removeItem(cartKey);
            location.hash = `order-success`;
        } 
        else 
        {
            showToast("../assets/images/error_toast.png");
        }
    } catch (err) {
        console.error("주문 요청 실패:", err);
        showToast("../assets/images/error_toast.png");
    }
}