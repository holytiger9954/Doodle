// 1. 천안 범위 랜덤 좌표 생성 함수 (한 번 선언해두기)
function getRandomCheonanCoords() {
    const minLat = 36.75;
    const maxLat = 36.85;
    const minLng = 127.10;
    const maxLng = 127.20;

    return {
        latitude: Number((Math.random() * (maxLat - minLat) + minLat).toFixed(6)),
        longitude: Number((Math.random() * (maxLng - minLng) + minLng).toFixed(6))
    };
}

// 2. smokingBooth 배열에 랜덤 데이터 10개 채우기
for (let i = 0; i < 10; i++) {
    const coords = getRandomCheonanCoords();
    smokingBooth.push({
        title: `랜덤 흡연구역 ${i + 1}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        img: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png", // 테스트용 이미지
        tags: ["흡연부스"]
    });
}


//x버튼
closed.forEach(function (btn) {
    btn.addEventListener('click', function () {
        smokmake.classList.remove('-open');
        mymake.classList.remove('-open');
    })
})

//마커 지우기
let allmarker = [];
//정보 받기
function markerData(markersData, markerImg) { //마크 관리 함수

    allmarker.forEach(function (d) {
        d.setMap(null); //화면에 마크 초기화
    })
    allmarker = []; //배열로 담을 준비
    markersData.forEach(function (item) { //정보 배열만큼 생성
        const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(item.latitude, item.longitude),
            map: map,
            image: markerImg
        })
        allmarker.push(marker);
    })
    if (markersData.length === 1) {//단일마크
        const onemarker = markersData[0];
        const onemarkerMove = new kakao.maps.LatLng(onemarker.latitude, onemarker.longitude);

        map.panTo(onemarkerMove)
        map.setLevel(3);
    }
}

let smokingBooth = []
//배열 뿌리기
smokdata.addEventListener('click', function () {
    markerData(smokingBooth, smokmakeimg);
})      //정보 날리기
mydata.addEventListener('click', function () {
    markerData(myMemory, mymakeimg)
})

// 마이페이지에서 저장된 마크 보기
my.forEach(function (me, index) {  //버튼구분
    me.addEventListener('click', function () {
        make.innerHTML = ''
        my.forEach(function (font) {
            font.style.fontWeight = 'normal'
        })
        let select; //정보담을 변수
        let currentImg;
        if (index === 0) { //1번박스에 정보담기
            me.style.fontWeight = 'bold';
            select = smokingBooth;
            currentImg = smokmakeimg
        } else if (index === 1) {
            me.style.fontWeight = 'bold';
            select = myMemory;
            currentImg = mymakeimg
        } else {
            me.style.fontWeight = 'bold';
            select = comment;
        }
        select.forEach(function (item) { //정보담긴 변수를 item라 명함
            const box = document.createElement('div');
            box.className = 'box'//정보를 보여줄 박스들
            box.innerHTML = `
                    <img src = "${item.img}">
                    <p>${item.title}</p>
                `;//정보담긴 박스의 이미지와 텍스트 표시
            //box클릭이벤트
            //box는 me의 이벤트를 발생시켯을때만 발생하기에 me이벤트 안에서 행해야함
            box.addEventListener('click', function () {
                if (index === 0) {
                    markerData([item], smokmakeimg);
                } else if (index === 1) {
                    markerData([item], mymakeimg)

                }
            })
            make.appendChild(box);//box를 make자식으로
        })
    })
})