let map;
let marker;
let currentUser = null; // 서버에서 받아올 유저 정보 객체

// 1. 카카오 맵 초기화
kakao.maps.load(() => {
    const mapbox = document.getElementById('map');
    if (!mapbox) return;

    const options = {
        center: new kakao.maps.LatLng(37.5668, 126.9786),
        level: 3
    };
    map = new kakao.maps.Map(mapbox, options);
    marker = new kakao.maps.Marker();

    // 초기 위치 잡기
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            displayMarker(loc);
        });
    }

    bindEvents();
    renderSidebar(); // 초기 사이드바 렌더링
});

function displayMarker(loc) {
    if (marker) {
        marker.setPosition(loc);
        marker.setMap(map);
        map.setCenter(loc);
    }
}

// 2. 사이드바 동적 렌더링 (핵심)
function renderSidebar() {
    const sidebarContent = document.getElementById('sidebar-content');
    if (!sidebarContent) return;

    if (currentUser) {
        // 로그인 상태
        sidebarContent.innerHTML = `
            <div class="user-profile">
                <h3>마이메뉴</h3>
                <p class="welcome-msg"><strong>${currentUser.nickname}</strong>님, 환영합니다!</p>
                <p class="user-id-sub">@${currentUser.userId}</p>
            </div>
            <ul class="my-list">
                <li><a href="javascript:void(0)">📍 내가 등록한 장소</a></li>
                <li><a href="javascript:void(0)">👤 회원 정보 수정</a></li>
            </ul>
            <button class="logout-btn" onclick="handleLogout()">로그아웃</button>
        `;
        document.getElementById('login-open-btn').style.display = 'none';
    } else {
        // 로그아웃 상태
        sidebarContent.innerHTML = `
            <h3>마이메뉴</h3>
            <div class="guest-msg">
                <p>로그인이 필요한 서비스입니다.</p>
                <p>나만의 스팟을 저장해보세요!</p>
            </div>
            <button class="side-login-btn" onclick="openLogin()">로그인 / 회원가입</button>
        `;
        document.getElementById('login-open-btn').style.display = 'block';
    }
}

// 3. 이벤트 바인딩
function bindEvents() {
    const sidebar = document.querySelector('#sidebar');
    const btn = document.querySelector('#btn');
    const me = document.querySelector('#mylocation');

    if (btn) {
        let sidebarFlag = true;
        btn.addEventListener('click', () => {
            if (sidebarFlag) {
                renderSidebar(); // 열 때 최신 상태 반영
                sidebar.classList.add('-open');
            } else {
                sidebar.classList.remove('-open');
            }
            sidebarFlag = !sidebarFlag;
        });
    }

    if (me) {
        me.addEventListener('click', () => {
            navigator.geolocation.getCurrentPosition((pos) => {
                const myLoc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                map.panTo(myLoc);
                map.setLevel(2);
            });
        });
    }
}

// 4. 인증 관련 로직
function openLogin() { document.getElementById('dd-overlay').style.display = 'flex'; }
function closeLogin() { document.getElementById('dd-overlay').style.display = 'none'; }

function toggleAuth(isSignup) {
    document.getElementById('login-section').style.display = isSignup ? 'none' : 'block';
    document.getElementById('signup-section').style.display = isSignup ? 'block' : 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const id = document.getElementById('input-dd-user-id').value;

    // [서버 통신 구간]
    // 실제 서버 구축 시 fetch()를 사용해 id/pw를 검증하고 아래 객체를 채웁니다.
    currentUser = {
        userId: id,
        nickname: "테스트유저",
        level: "common"
    };

    alert(`${currentUser.nickname}님 접속 성공!`);
    closeLogin();
    renderSidebar();
}

function handleLogout() {
    currentUser = null;
    alert("로그아웃 되었습니다.");
    renderSidebar();
    // 만약 사이드바를 닫고 싶다면 아래 추가
    document.querySelector('#sidebar').classList.remove('-open');
}

async function handleSignup(event) {
    event.preventDefault();
    // TODO: 서버로 회원가입 데이터 전송
    alert("회원가입이 완료되었습니다. 로그인 해주세요!");
    toggleAuth(false);
}