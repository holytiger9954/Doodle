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
                // btn.style.display='none' //버튼삭제 김민권
            } else {
                sidebar.classList.remove('-open');

            }
            sidebarFlag = !sidebarFlag;
        });
    }

    //////////////////////////////////////////////////////////////////////////////////////
    //임시로 넣을 저장된 마크 //김민권

    // 저장한 장소에 찍히는 마크
    // 마크 이미지와 구별을 위해 생성
    const imageSize = new kakao.maps.Size(35, 35);
    const smokmakerimg = new kakao.maps.MarkerImage("화면 캡처 2026-03-01 102417.png", imageSize);
    const mymakerimg = new kakao.maps.MarkerImage("화면 캡처 2026-03-01 102914.png", imageSize);
    const smokmaker = new kakao.maps.Marker();
    const mymaker = new kakao.maps.Marker();

    //임시 랜덤 좌표
    function ranLocation() {
        return { //서울의 위도와 경도 서버에서 받아오면 삭제해도됨
            lat: Math.random() * (37.6 - 37.4) + 37.4,
            lng: Math.random() * (127.1 - 126.9) + 126.9
        }
    }



    //임시로 만든 마이페이지 저장된 배열                                     //...전개연산자 함수안의 데이터만 넣어줌
    const smokingBooth = [ // db의 데이터가 들어가야함 패치                 //...을 안붙히면 함수 자체가 들어감
        { text: "장소1", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png", ...ranLocation() },
        { text: "장소2", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png", ...ranLocation() },
        { text: "장소3", img: "https://cdn-icons-png.flaticon.com/512/1085/1085388.png", ...ranLocation() }
    ];
    const myMemory = [
        { text: "등록1", img: "화면 캡처 2026-02-28 170902.png", ...ranLocation() },
        { text: "등록2", img: "화면 캡처 2026-02-28 170902.png", ...ranLocation() },
        { text: "등록3", img: "화면 캡처 2026-02-28 170902.png", ...ranLocation() }
    ];
    const comment = [

    ];

    const my = document.querySelectorAll('.my') //버튼들
    const make = document.querySelector('#make')//생성될 박스 부모 역할
    my.forEach(function (me, index) {  //버튼구분

        me.addEventListener('click', function () {
            make.innerHTML = ''
            my.forEach(function (font) {
                font.style.fontWeight = 'normal'
            })
            let select; //정보담을 변수
            if (index === 0) { //1번박스에 정보담기
                me.style.fontWeight = 'bold';
                select = smokingBooth;
            } else if (index === 1) {
                me.style.fontWeight = 'bold';
                select = myMemory;
            } else {
                me.style.fontWeight = 'bold';
                select = comment;
            }
            select.forEach(function (item) { //정보담긴 변수를 item라 명함
                const box = document.createElement('div');
                box.className = 'box'//정보를 보여줄 박스들
                box.innerHTML = `
                    <img src = "${item.img}">
                    <p>${item.text}</p>
                `;//정보담긴 박스의 이미지와 텍스트 표시
                //box클릭이벤트
                //box는 me의 이벤트를 발생시켯을때만 발생하기에 me이벤트 안에서 행해야함
                box.addEventListener('click', function () {
                    // btn.style.display='block' 버튼생성
                    sidebar.classList.remove('-open');//사이드바 내리기
                    sidebarFlag = true;//사이드바 내린상태의 플래그 만들기
                    const move = new kakao.maps.LatLng(item.lat, item.lng);
                    if (index === 0) {
                        smokmaker.setPosition(move),
                            smokmaker.setMap(map),
                            smokmaker.setImage(smokmakerimg)

                    } else if (index === 1) {
                        mymaker.setPosition(move),
                            mymaker.setMap(map),
                            mymaker.setImage(mymakerimg)
                    }
                    map.panTo(move);
                })
                make.appendChild(box);//box를 make자식으로
            })
        })
    })

    const smokmake = document.querySelector('#smokmake')
    const mymake = document.querySelector('#mymake')
    kakao.maps.event.addListener(smokmaker, 'click', function () {
        smokmake.classList.add('-open')
    })
    kakao.maps.event.addListener(mymaker, 'click', function () {
        smokmake.classList.add('-open')
    })


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