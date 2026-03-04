window.onload = init;
function init() {
    bind()
}

//x버튼
// closed.forEach(function (btn) {
//     btn.addEventListener('click', function () {
//         smokmake.classList.remove('-open');
//         mymake.classList.remove('-open');
//     })
// })

let allmarker = [];
let registermarker = [];
//정보 받기
function markerData(markersData, registersave = false) { //마크 관리 함수
    if (!registersave) {
        allmarker.forEach(function (d) {
            if (!registermarker.includes(d)) {
                d.setMap(null); //화면에 마크 초기화
            }
        })
        allmarker = [...registermarker]
    }
    allmarker = []; //배열로 담을 준비


    markersData.forEach(function (item) { //정보 배열만큼 생성
        const marker = new kakao.maps.Marker({//전달받은 좌표
            position: new kakao.maps.LatLng(item.latitude, item.longitude),
            map: map //이동
        })
        allmarker.push(marker);
    })
    if (markersData.length === 1) {//단일마크
        const onemarker = markersData[0];
        const onemarkerMove = new kakao.maps.LatLng(onemarker.latitude, onemarker.longitude);

        map.panTo(onemarkerMove)
        map.setLevel(1);
    }
}

function bind() {
    //임시좌표
    const testCoords = [
        { title: "천안시청 인근", latitude: 36.815129, longitude: 127.113894 },
        { title: "천안역", latitude: 36.808945, longitude: 127.149182 },
        { title: "천안터미널", latitude: 36.819443, longitude: 127.156557 },
        { title: "단국대 천안캠퍼스", latitude: 36.833917, longitude: 127.172467 },
        { title: "상명대 천안캠퍼스", latitude: 36.832968, longitude: 127.178121 },
        { title: "불당동 카페거리", latitude: 36.809311, longitude: 127.106294 },
        { title: "두정역", latitude: 36.832561, longitude: 127.149121 },
        { title: "백석대학교", latitude: 36.839444, longitude: 127.185556 },
        { title: "독립기념관", latitude: 36.783633, longitude: 127.223048 },
        { title: "천안삼거리공원", latitude: 36.789547, longitude: 127.164503 }
    ];
    const seoulCoords = [
        { title: "서울시청", latitude: 37.566535, longitude: 126.977969 },
        { title: "광화문 광장", latitude: 37.570975, longitude: 126.977759 },
        { title: "경복궁", latitude: 37.579617, longitude: 126.977041 },
        { title: "남산타워", latitude: 37.551169, longitude: 126.988227 },
        { title: "명동역", latitude: 37.560989, longitude: 126.986187 },
        { title: "강남역", latitude: 37.497942, longitude: 127.027621 },
        { title: "홍대입구역", latitude: 37.557192, longitude: 126.924311 },
        { title: "여의도 한강공원", latitude: 37.528430, longitude: 126.933074 },
        { title: "롯데월드타워", latitude: 37.512558, longitude: 127.102534 },
        { title: "동대문 디자인플라자(DDP)", latitude: 37.566524, longitude: 127.009224 }
    ];



    // let smokingBooth = []

    // smokdata.addEventListener('click', function () {
    //     markerData(smokingBooth);
    // })      //정보 날리기
    // mydata.addEventListener('click', function () {
    //     markerData(myMemory)
    // })

    // 마이페이지에서 저장된 마크 보기
    const menu = document.querySelectorAll('.category-list')
    const save = document.querySelectorAll('.side-btn')
    const make = document.querySelector('#marker')
    const ranking = document.querySelector('#ranking-wrapper')
    save.forEach(function (me, index) {
        me.addEventListener('click', function () {
            make.innerHTML = ''
            let select = []
            if (index === 0) {
                select = testCoords;
            } else if (index === 1) {
                select = seoulCoords;
            }
            select.forEach(function (item) {
                const box = document.createElement('div')
                box.className = 'box'
                box.innerHTML = `<p>${item.title}</p>`
                box.addEventListener('click', function () {
                    window.parent.postMessage({
                        type: 'selectLocation',
                        data: item
                    },'*')
                })
                make.appendChild(box)
            })
        })
    })


}