let map;
let marker; // 여기서 생성하지 않고 선언만 합니다.

// 1. 카카오 맵 API 로드 보장
kakao.maps.load(() => {
    const mapbox = document.getElementById('map');
    if (!mapbox) {
        console.error("지도를 담을 div(#map)를 찾을 수 없습니다.");
        return;
    }
    
    const options = {
        center: new kakao.maps.LatLng(37.5668, 126.9786),
        level: 3
    };
    map = new kakao.maps.Map(mapbox, options);
    
    // API 로드 완료 후 마커 생성
    marker = new kakao.maps.Marker(); 

    // 초기 위치 시도
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            displayMarker(loc);
        });
    }
    
    // 사이드바 이벤트 연결
    bindEvents(); 
});

// 2. 마커 표시 함수
function displayMarker(loc) {
    if (marker) {
        marker.setPosition(loc);
        marker.setMap(map);
        map.setCenter(loc);
    }
}

// 3. 이벤트 바인딩 (HTML에 이미 버튼이 있으므로 중복 생성하지 않음)
function bindEvents() {
    const sidebar = document.querySelector('#sidebar');
    const btn = document.querySelector('#btn');
    const me = document.querySelector('#mylocation');

    // [사이드바 열기/닫기]
    if (btn && sidebar) {
        let sidebarFlag = true;
        btn.addEventListener('click', () => {
            if (sidebarFlag) {
                sidebar.classList.add('-open');
            } else {
                sidebar.classList.remove('-open');
            }
            sidebarFlag = !sidebarFlag;
        });
    }

    // [내 위치 찾기]
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

// [로그인 오버레이 제어]
function openLogin() { document.getElementById('dd-overlay').style.display = 'flex'; }
function closeLogin() { document.getElementById('dd-overlay').style.display = 'none'; }