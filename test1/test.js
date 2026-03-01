let map, marker;
let spotMarkers = [];
let currentUser = null;

// 천안역 주변 가상 데이터
const mockSpots = [
    { id: 1, name: "천안역 서부광장 부스", lat: 36.8105, lng: 127.1450, category: "smoking" },
    { id: 2, name: "천안역 동부광장 화장실", lat: 36.8118, lng: 127.1472, category: "toilet" },
    { id: 3, name: "역전시장 숨은 맛집", lat: 36.8125, lng: 127.1485, category: "spot" },
    { id: 4, name: "천안역 지하상가 쉼터", lat: 36.8110, lng: 127.1465, category: "spot" }
];

kakao.maps.load(() => {
    const container = document.getElementById('map');
    const options = {
        center: new kakao.maps.LatLng(36.8115, 127.1462), // 천안역 중심
        level: 3
    };
    map = new kakao.maps.Map(container, options);
    marker = new kakao.maps.Marker();

    // 초기 로드 시 천안역 주변 마커 즉시 생성 (모든 레벨 노출을 위해 거리 체크 생략 가능)
    renderAllSpots();

    bindEvents();
    renderSidebar();
});

// 모든 레벨에서 보이도록 마커 렌더링
function renderAllSpots() {
    spotMarkers.forEach(m => m.setMap(null));
    spotMarkers = [];

    mockSpots.forEach(spot => {
        const spotLoc = new kakao.maps.LatLng(spot.lat, spot.lng);
        createCustomMarker(spot, spotLoc);
    });
}

function createCustomMarker(spot, loc) {
    let bgColor = "#3498DB"; // smoking
    if (spot.category === "toilet") bgColor = "#BDC3C7"; // toilet
    if (spot.category === "spot") bgColor = "#F39C12"; // spot

    // zIndex를 높게 설정하여 모든 레벨에서 가려지지 않게 함
    const content = `
        <div style="background:${bgColor}; color:white; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:bold; box-shadow:0 4px 8px rgba(0,0,0,0.4); border:2px solid white; white-space:nowrap; transform:translateY(-35px);">
            ${spot.name}
        </div>
    `;

    const overlay = new kakao.maps.CustomOverlay({
        position: loc,
        content: content,
        yAnchor: 1,
        zIndex: 100 // 모든 지도 요소 위에 표시
    });

    overlay.setMap(map);
    spotMarkers.push(overlay);
}

function bindEvents() {
    document.querySelector('#btn').addEventListener('click', () => {
        document.querySelector('#sidebar').classList.toggle('-open');
    });

    document.querySelector('#mylocation').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const myLoc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                map.panTo(myLoc);
                marker.setPosition(myLoc);
                marker.setMap(map);
                // 현위치 기준 1km 내 다시 스캔하고 싶다면 여기서 renderAllSpots 호출 가능
            });
        }
    });
}

// 인증/사이드바 렌더링 로직 (기존과 동일하되 버그 수정됨)
function renderSidebar() {
    const content = document.getElementById('sidebar-content');
    if (currentUser) {
        content.innerHTML = `<div style="padding:20px; text-align:center;"><h3>${currentUser.nickname}님</h3><button onclick="handleLogout()" style="margin-top:20px; width:100%; padding:10px; background:#E74C3C; border:none; color:white; border-radius:5px; cursor:pointer;">로그아웃</button></div>`;
    } else {
        content.innerHTML = `<div style="padding:20px;"><h3>Guest</h3><button onclick="openLogin()" style="margin-top:20px; width:100%; padding:10px; background:var(--neon-blue); border:none; color:white; border-radius:5px; cursor:pointer;">로그인</button></div>`;
    }
}

function openLogin() { document.getElementById('dd-overlay').style.display = 'flex'; }
function closeLogin() { document.getElementById('dd-overlay').style.display = 'none'; }
function handleLogin(e) { e.preventDefault(); currentUser = { nickname: "천안마스터" }; closeLogin(); renderSidebar(); }
function handleLogout() { currentUser = null; renderSidebar(); }