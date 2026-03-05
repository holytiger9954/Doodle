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
//다른파일에서 사용해야할 함수라 전역변수로 뺌
let mapInformation
let allmarker = [];
let registermarker = [];//등록마커
//마커를 삭제 생성 필터역할을 다하는 함수
//정보 받기[마크핵심]               //register구별메인.js에서 true보내줌
function markerData(markersData, registersave = false) {
    console.log("전달받은 데이터:", markersData);//마크 관리 함수
    var bounds = new kakao.maps.LatLngBounds();
    //동록마커유지
    if (!registersave) {//등록엔 반응안함 메인.js확인
        allmarker.forEach(function (d) {//지도에서 지우려는 마크에 등록 마크가 포람 되어있는지 확인        
            if (!registermarker.includes(d)) {//이게 없으면 펄스가 왔을때 등록한 마커를 다 지움
                d.setMap(null); //화면에 마크 초기화
            }
        })
        allmarker = [...registermarker]//등록된 마커를 새로운 배열 남긴다
    }
    allmarker = []; //배열로 담을 준비


    markersData.forEach(function (item) { //배열 만큼 반복
        const position = new kakao.maps.LatLng(item.latitude, item.longitude);//전달받은 좌표
        const marker = new kakao.maps.Marker({//좌표와 마커를 띄우기
            position: position,
            map: map //이동
        })

        kakao.maps.event.addListener(marker, 'click', function () {
            if (mapInformation) {//맵에 정보창이 하나만 있을수있게
                mapInformation.setMap(null);
            }
            //받은정보가 뭐에 관한 정본지 카테고리로 구분
            let mapMarker = 'info.html';
            if (item.Category.includes('찜')) {
                mapMarker = 'infoC.html';
            } else if (item.Category.includes('병원')) {
                mapMarker = 'infoG.html';
            } else if (item.Category.includes('체육관')) {
                mapMarker = 'infoH.html';
            } else if (item.Category.includes('경찰서')) {
                mapMarker = 'infom.html';
            } else if (item.Category.includes('흡연부스')) {
                mapMarker = 'infoT.html';
            } else if (item.Category.includes('공중화장실')) {
                mapMarker = 'info.html';
            }
            /////////////////////여기부터이해못함///////////////////////////////////
            //다른파일에 있는 창을 가져오기 위해 fetch사용
            fetch(`./${mapMarker}`)
                .then(function (response) {
                    return response.text();
                })
                .then(function (html) {
                    const overlay = new kakao.maps.CustomOverlay({
                        content: html,
                        map: map,
                        position: marker.getPosition(),
                        yAnchor: 1.2
                    });

                    mapInformation = overlay;

                    const contentNode = document.createElement('div');
                    contentNode.innerHTML = html;
                    const CategoryEl = contentNode.querySelector('#info-title')
                    if (CategoryEl) {
                        CategoryEl.innerText = item.title;
                    }
                    const addrEl = contentNode.querySelector('#info-address')
                    if (addrEl && item.address) {
                        addrEl.innerText = '주소 : ' + item.address
                    }
                    overlay.setContent(contentNode);
                })
        })
        allmarker.push(marker);//배열로저장

        bounds.extend(position);
    })

    window.closeOverlay = function () {
        if (mapInformation) {
            mapInformation.setMap(null);
            mapInformation = null;
        }
    };
////////////////////////////////여기까지 이해못함/////////////////////////////////
    //여기까지가 데이터를 넣는과정
    if (markersData.length > 0) {
        map.setBounds(bounds);
    }
    if (markersData.length === 1) {//마크가 하나만 찍히면
        const onemarker = markersData[0];
        const onemarkerMove = new kakao.maps.LatLng(onemarker.latitude, onemarker.longitude);

        map.panTo(onemarkerMove)
        map.setLevel(1);
    }
}


//임시좌표
const testCoords = [
    { title: "천안시청 인근", latitude: 36.815129, longitude: 127.113894, Category: '찜' },
    { title: "천안역", latitude: 36.808945, longitude: 127.149182, Category: '찜' },
    { title: "천안터미널", latitude: 36.819443, longitude: 127.156557, Category: '찜' },
    { title: "단국대 천안캠퍼스", latitude: 36.833917, longitude: 127.172467, Category: '찜' },
    { title: "상명대 천안캠퍼스", latitude: 36.832968, longitude: 127.178121, Category: '찜' },
    { title: "불당동 카페거리", latitude: 36.809311, longitude: 127.106294, Category: '찜' },
    { title: "두정역", latitude: 36.832561, longitude: 127.149121, Category: '찜' },
    { title: "백석대학교", latitude: 36.839444, longitude: 127.185556, Category: '찜' },
    { title: "독립기념관", latitude: 36.783633, longitude: 127.223048, Category: '찜' },
    { title: "천안삼거리공원", latitude: 36.789547, longitude: 127.164503, Category: '찜' }
];
const hospitalCoords = [
    { title: "단국대학교의과대학부속병원", latitude: 36.8405, longitude: 127.1731, Category: '병원' },
    { title: "순천향대학교부속천안병원", latitude: 36.7990, longitude: 127.1352, Category: '병원' },
    { title: "천안충무병원", latitude: 36.8016, longitude: 127.1394, Category: '병원' },
    { title: "천안의료원", latitude: 36.7801, longitude: 127.1751, Category: '병원' },
    { title: "혜성산부인과병원", latitude: 36.8118, longitude: 127.1517, Category: '병원' },
    { title: "대전대천안한방병원", latitude: 36.8242, longitude: 127.1475, Category: '병원' },
    { title: "천안자생한방병원", latitude: 36.8091, longitude: 127.1065, Category: '병원' },
    { title: "천안우리병원", latitude: 36.8153, longitude: 127.1128, Category: '병원' },
    { title: "리앤리병원", latitude: 36.8105, longitude: 127.1082, Category: '병원' },
    { title: "천안센텀정형외과", latitude: 36.8202, longitude: 127.1054, Category: '병원' }
];
const gymCoords = [
    { title: "천안종합운동장", latitude: 36.8214, longitude: 127.1082, Category: '체육관' },
    { title: "유관순체육관", latitude: 36.8205, longitude: 127.1089, Category: '체육관' },
    { title: "천안실내배드민턴장", latitude: 36.8235, longitude: 127.1068, Category: '체육관' },
    { title: "남서울대학교 성암문화체육관", latitude: 36.9102, longitude: 127.1338, Category: '체육관' },
    { title: "상명대학교 천안캠퍼스 체육관", latitude: 36.8335, longitude: 127.1795, Category: '체육관' },
    { title: "단국대학교 천안캠퍼스 체육관", latitude: 36.8358, longitude: 127.1705, Category: '체육관' },
    { title: "북천안자 자전거공원", latitude: 36.8612, longitude: 127.1534, Category: '체육관' },
    { title: "백석대학교 체육관", latitude: 36.8415, longitude: 127.1822, Category: '체육관' },
    { title: "태조산 청소년수련관 체육관", latitude: 36.8188, longitude: 127.1954, Category: '체육관' },
    { title: "천안축구센터", latitude: 36.8239, longitude: 127.1472, Category: '체육관' }
];
const policeCoords = [
    { title: "천안서북경찰서", latitude: 36.8488, longitude: 127.1195, Category: '경찰서' },
    { title: "천안동남경찰서", latitude: 36.7844, longitude: 127.1706, Category: '경찰서' },
    { title: "두정지구대", latitude: 36.8288, longitude: 127.1356, Category: '경찰서' },
    { title: "성정지구대", latitude: 36.8184, longitude: 127.1369, Category: '경찰서' },
    { title: "불당지구대", latitude: 36.8105, longitude: 127.1031, Category: '경찰서' },
    { title: "신안파출소", latitude: 36.8197, longitude: 127.1565, Category: '경찰서' },
    { title: "문성파출소", latitude: 36.8082, longitude: 127.1485, Category: '경찰서' },
    { title: "쌍용지구대", latitude: 36.8005, longitude: 127.1189, Category: '경찰서' },
    { title: "남산파출소", latitude: 36.8011, longitude: 127.1511, Category: '경찰서' },
    { title: "백석파출소", latitude: 36.8228, longitude: 127.1242, Category: '경찰서' }
];
const smokingCoords = [
    { title: "천안역 동부광장 흡연부스", latitude: 36.8090, longitude: 127.1495, Category: '흡연부스' },
    { title: "천안역 서부광장 흡연부스", latitude: 36.8088, longitude: 127.1480, Category: '흡연부스' },
    { title: "천안종합버스터미널 흡연구역", latitude: 36.8198, longitude: 127.1558, Category: '흡연부스' },
    { title: "두정역 1번출구 인근 흡연부스", latitude: 36.8328, longitude: 127.1488, Category: '흡연부스' },
    { title: "천안시청 야외 휴게공간", latitude: 36.8153, longitude: 127.1132, Category: '흡연부스' },
    { title: "동남구청 별관 인근", latitude: 36.8068, longitude: 127.1515, Category: '흡연부스' },
    { title: "신세계백화점 천안아산점 후문", latitude: 36.8189, longitude: 127.1568, Category: '흡연부스' },
    { title: "천안아산역 KTX 광장", latitude: 36.7946, longitude: 127.1042, Category: '흡연부스' },
    { title: "단국대병원 장례식장 앞", latitude: 36.8412, longitude: 127.1725, Category: '흡연부스' },
    { title: "불당동 상업지구 공용부스", latitude: 36.8102, longitude: 127.1075, Category: '흡연부스' }
];
const toiletCoords = [
    { title: "천안역 동부광장 공중화장실", latitude: 36.8089, longitude: 127.1501, Category: '공중 화장실' },
    { title: "천안역 서부광장 공중화장실", latitude: 36.8085, longitude: 127.1475, Category: '공중 화장실' },
    { title: "천안종합버스터미널 공중화장실", latitude: 36.8195, longitude: 127.1562, Category: '공중 화장실' },
    { title: "두정역 공중화장실", latitude: 36.8326, longitude: 127.1495, Category: '공중 화장실' },
    { title: "천안시청 공중화장실", latitude: 36.8155, longitude: 127.1135, Category: '공중 화장실' },
    { title: "천안삼거리공원 공중화장실", latitude: 36.7890, longitude: 127.1640, Category: '공중 화장실' },
    { title: "신안동 행정복지센터 공중화장실", latitude: 36.8210, longitude: 127.1550, Category: '공중 화장실' },
    { title: "방아다리공원 공중화장실", latitude: 36.8120, longitude: 127.1090, Category: '공중 화장실' },
    { title: "불당동 유적공원 화장실", latitude: 36.8080, longitude: 127.1045, Category: '공중 화장실' },
    { title: "태조산공원 공중화장실", latitude: 36.8190, longitude: 127.1945, Category: '공중 화장실' }
];


function bind() {

    // 마이페이지에서 저장된 마크 보기
    const save = document.querySelectorAll('.side-btn')
    const make = document.querySelector('#marker')
    let lastindex = -1; //초기화 버튼
    save.forEach(function (me, index) {
        me.addEventListener('click', function () {
            if (lastindex === index) {//인덱스가 다르면 box 초기화
                make.innerHTML = ''
                make.style.display = 'none'
                lastindex = -1;
                return;
            }
            make.innerHTML = ''
            make.style.display = 'block'
            let select = []
            if (index === 0) {
                select = testCoords;
            } else if (index === 1) {
                select = hospitalCoords;
            } else if (index === 2) {
                select = gymCoords;
            } else if (index === 3) {
                select = policeCoords;
            } else if (index === 4) {
                select = smokingCoords;
            } else if (index === 5) {
                select = toiletCoords;
            }
            select.forEach(function (item) {
                const box = document.createElement('div')
                box.className = 'box'
                me.insertAdjacentElement('afterend', make)
                lastindex = index; //인덱스를 같게해줌
                box.innerHTML = `<p>${item.title}</p>`

                box.addEventListener('click', function () {
                    window.parent.postMessage({
                        type: 'selectLocation',//메인에서 구별하기 위한 별명
                        data: item//메인에서 받을 데이터
                    }, '*')
                })
                make.appendChild(box)
                makeflag = true;
            })
        })
    })
}