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
    //////////////////////////////////////////////////////////////////////////////////////
    //임시로 넣을 저장된 마크 //김민권
    //임시로 만든 마이페이지 저장된 배열
    const smokingBooth = [ // db의 데이터가 들어가야함 패치
        { text: "장소1", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png" },
        { text: "장소2", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png" },
        { text: "장소3", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png" }
    ];
    const myMemory = [
        { text: "등록1", img: "./img/화면 캡처 2026-02-28 171041.png"},
        { text: "등록2", img: "./img/화면 캡처 2026-02-28 171041.png"},
        { text: "등록3", img: "./img/화면 캡처 2026-02-28 171041.png"}
    ];
    const comment = [
        { text: "댓글1", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png" },
        { text: "댓글2", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png" },
        { text: "댓글3", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png" }
    ];

    const my = document.querySelectorAll('.my') //버튼들
    const make = document.querySelector('#make')//생성될 박스 부모 역할
    my.forEach(function (me,index) {  //버튼구분
        me.addEventListener('click', function () {
            make.innerHTML = ''
            my.forEach(function(font){
                font.style.fontWeight='normal'
            })
            let select; //정보담을 변수
            if(index === 0){ //1번박스에 정보담기
                me.style.fontWeight='bold';
                select = smokingBooth;
            } else if (index === 1) {
                me.style.fontWeight='bold';
                select = myMemory;
            } else {
                me.style.fontWeight='bold';
                 select = comment;
            }
            select.forEach(function(item){ //정보담긴 변수를 item라 명함
                const box = document.createElement('div');
                box.className = 'box'//정보를 보여줄 박스들
                box.innerHTML = `
                    <img src = "${item.img}">
                    <p>${item.text}</p>
                `;//정보담긴 박스의 이미지와 텍스트 표시
                make.appendChild(box);//box를 make자식으로
            })
        })
    })
    // 클릭 이벤트 하나 더 만들어서 이미지 클릭하면 해당 마크로 이동하는 로직 짜야함
    //////////////////////////////////////////////////////////////////////////////////////
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