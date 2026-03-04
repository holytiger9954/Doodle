// 전역 변수 설정
let map, locMarker;
let isRegisterMode = false;

// 카카오맵 API 로드
kakao.maps.load(function () {
    var container = document.getElementById('map');
    var options = {
        center: new kakao.maps.LatLng(36.8115, 127.1462),
        level: 3
    };

    map = new kakao.maps.Map(container, options);
    locMarker = new kakao.maps.Marker();

    // [중요] 지도 클릭 이벤트 리스너 등록
    kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
        if (isRegisterMode) {
            const latlng = mouseEvent.latLng;
            openRegisterModal(latlng.getLat(), latlng.getLng());
        }
    });

    // 모든 버튼 이벤트 바인딩
    bindLocationEvent();
    bindRegisterEvent();
});

// 현위치 버튼 기능
function bindLocationEvent() {
    const locationBtn = document.getElementById('mylocation');
    if (!locationBtn) return;

    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const myLoc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                map.panTo(myLoc);
                locMarker.setPosition(myLoc);
                locMarker.setMap(map);
            });
        }
    });
}

// 장소 등록 버튼 모드 전환
function bindRegisterEvent() {
    const saveBtn = document.getElementById('savebtn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', () => {
        const rankingWrapper = document.getElementById('ranking-wrapper');//김민권
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            saveBtn.style.backgroundColor = "#e67e22";
            saveBtn.innerText = "📍 지도를 클릭하세요";
            map.setCursor('crosshair');
            rankingWrapper.classList.add('hide')//김민권
        } else {
            resetRegisterMode();
        }
    });
}

// 모달 열기 및 좌표 전달
function openRegisterModal(lat, lng) {
    const modal = document.getElementById('register-modal');
    const iframe = document.getElementById('register-iframe');
    if (modal && iframe) {
        iframe.src = `register.html?lat=${lat}&lng=${lng}`;
        modal.classList.remove('hidden');
    }
}

// 등록 모드 초기화
function resetRegisterMode() {
    isRegisterMode = false;
    const saveBtn = document.getElementById('savebtn');
    if (saveBtn) {
        saveBtn.style.backgroundColor = "";
        saveBtn.innerText = "📍 장소 등록";
    }
    if (map) map.setCursor('default');
}

// register.js로부터 닫기 메시지 수신
window.addEventListener('message', function (e) {
    if (e.data === 'closeRegister') {
        const modal = document.getElementById('register-modal');
        if (modal) modal.classList.add('hidden');
        resetRegisterMode();
    }
});

// 사이드바
function toggleSidebar() {
    document.getElementById('side-mypage').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// 랭킹
function toggleRanking(event) {
    if (event) {
        event.stopPropagation(); // 이벤트 버블링 방지
    }
    const ranking = document.getElementById('ranking-wrapper');
    ranking.classList.toggle('hide');
}

// [추가] 랭킹창이 hide 상태일 때, 삐져나온 영역을 클릭하면 열리도록 설정
document.addEventListener('DOMContentLoaded', () => {
    const rankingWrapper = document.getElementById('ranking-wrapper');
    if (rankingWrapper) {
        rankingWrapper.addEventListener('click', function (e) {
            // 1. 만약 hide 클래스가 있다면 (닫혀서 삐져나온 상태라면)
            if (this.classList.contains('hide')) {
                // 2. 창을 연다
                this.classList.remove('hide');
            }
        });
    }
});

//김민권
window.addEventListener('message',function(e){
    if(e.data.type === 'newMarker'){
        if(typeof markerData ==='function'){
            markerData([e.data.data],true)
        }
    }
    if(e.data.type === 'selectLocation'){
        if(typeof markerData === 'function'){
            markerData([e.data.data])
            document.getElementById('ranking-wrapper').classList.add('hide')
            toggleSidebar();
        }
    }
})
