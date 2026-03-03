let map, marker;
let spotMarkers = []; // 서버에서 불러온 장소 마커 배열
let currentUser = null;
let postFlag = false; // 등록 모드 체크

// 1. 카카오 맵 로드 및 초기화
kakao.maps.load(() => {
    const container = document.getElementById('map');
    map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(36.8115, 127.1462), // 천안역 기준
        level: 3
    });
    marker = new kakao.maps.Marker(); // 위치 선택용 마커

    initApp();
    bindEvents();
});

// 2. 초기 데이터 로드 (팀원 서버 API 연동)
async function initApp() {
    try {
        // 서버에서 게시글 리스트 가져오기
        const response = await DD.V1.Posts.list();
        if (response && response.data) {
            renderMarkers(response.data);
        }
    } catch (e) {
        console.error("서버 데이터 로딩 실패:", e);
    }
    renderSidebar();
}

// 3. 서버 데이터를 지도에 마커로 표시
function renderMarkers(spots) {
    // 기존 마커 삭제
    spotMarkers.forEach(m => m.setMap(null));

    spotMarkers = spots.map(spot => {
        const m = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(spot.latitude, spot.longitude),
            map: map,
            title: spot.title
        });

        // 마커 클릭 이벤트
        kakao.maps.event.addListener(m, 'click', () => {
            alert(`[${spot.tags[0] || '장소'}] ${spot.title}\n${spot.content || ''}`);
        });
        return m;
    });
}

// 4. 이벤트 바인딩
function bindEvents() {
    // 등록 버튼 클릭 시
    document.querySelector('#savebtn').onclick = () => {
        postFlag = true;
        alert("지도를 클릭해 등록할 위치를 선택해주세요.");
    };

    // 지도 클릭 시
    kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
        if (postFlag) {
            const latlng = mouseEvent.latLng;
            // 위도 경도 입력창에 자동 입력
            document.querySelector('#savelat').value = latlng.getLat();
            document.querySelector('#savelng').value = latlng.getLng();
            toggleSaveSide(true); // 등록 폼 열기
            postFlag = false;
        } else {
            toggleSidebar(false);
            toggleSaveSide(false);
        }
    });

    // 서버 저장 버튼 클릭 시 (팀원 로직 반영)
    document.querySelector('#saveend').onclick = async () => {
        const titleText = document.querySelector('#hash').value;
        if (!titleText) return alert("장소 설명을 입력해주세요.");

        const saveData = {
            authorNo: 1, // 테스트용 번호
            title: titleText.split('\n')[0], // 첫 줄을 제목으로
            content: titleText,
            latitude: Number(document.querySelector('#savelat').value),
            longitude: Number(document.querySelector('#savelng').value),
            tags: [document.querySelector('#category').value]
        };

        try {
            await DD.V1.Posts.create(saveData);
            alert("서버에 등록되었습니다!");
            location.reload(); // 성공 후 새로고침
        } catch (e) {
            alert("등록 실패: " + e.message);
        }
    };

    // 현위치 버튼
    document.querySelector('#mylocation').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                map.panTo(loc);
                marker.setPosition(loc);
                marker.setMap(map);
            });
        }
    };

    document.querySelector('#btn').onclick = () => toggleSidebar(true);
}

// 5. UI 제어 함수
function toggleSidebar(open) { document.getElementById('sidebar').classList.toggle('-open', open); }
function toggleSaveSide(open) { document.getElementById('saveside').classList.toggle('-open', open); }
function openLogin() { document.getElementById('dd-overlay').style.display = 'flex'; }
function closeLogin() { document.getElementById('dd-overlay').style.display = 'none'; }

function renderSidebar() {
    const content = document.getElementById('sidebar-content');
    if (currentUser) {
        content.innerHTML = `<h3>${currentUser.nickname}님</h3><button onclick="handleLogout()" class="auth-submit-btn" style="margin-top:20px; background:#e74c3c;">로그아웃</button>`;
    } else {
        content.innerHTML = `<h3>Guest</h3><p style="margin: 15px 0;">로그인하여 장소를 공유해보세요.</p><button onclick="openLogin()" class="auth-submit-btn">로그인</button>`;
    }
}

async function handleLogin(event) {
    event.preventDefault();

    // 1. 입력창에서 사용자가 친 아이디, 비번 가져오기
    const typedId = document.querySelector('#input-dd-user-id').value;
    const typedPw = document.querySelector('#input-dd-password').value;

    // 2. 서버에 보낼 데이터 포장 (아이디와 비번)
    const loginBody = { loginId: typedId, password: typedPw };
    const loginUrl = "/api/v1/dd/auth/login"; // 팀원 예시 코드에 있던 주소

    try {
        // 3. 찾으신 ddAjax 비서를 시켜서 서버에 보내기!
        const response = await ddAjax("POST", loginUrl, loginBody);

        // 4. 성공 시 처리 (서버 응답 구조에 따라 조금 다를 수 있음)
        currentUser = { 
            userId: typedId, 
            nickname: response.data?.nickname || "사용자" 
        };
        
        alert(currentUser.nickname + "님, 환영합니다!");
        closeLogin();    // 팝업 닫기
        renderSidebar(); // 사이드바 이름 변경
    } catch (e) {
        // 5. 실패 시 처리 (아이디/비번 틀림 등)
        console.error("로그인 에러:", e);
        alert("아이디 또는 비밀번호를 확인해주세요.");
    }
    currentUser = { userId: "tester", nickname: "팀장님" };
    closeLogin();
    renderSidebar();
}

function handleLogout() {
    currentUser = null;
    renderSidebar();
}