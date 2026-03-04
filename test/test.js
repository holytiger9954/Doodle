//x버튼
closed.forEach(function (btn) {
    btn.addEventListener('click', function () {
        smokmake.classList.remove('-open');
        mymake.classList.remove('-open');
    })
})
//마커 지우기

let smokemakers = [] //마크 배열
let mymakers = []

function clearMarkers(markerArray) { //마크 초기화 함수
    markerArray.forEach(function (clear) {
        clear.setMap(null);
    })
    markerArray.length = 0;
}
//마크삭제
function clearMarker(marker) {
    marker.setMap(null)
}

//마크 표시
function displayMarker(loc) {
    if (marker) {
        marker.setPosition(loc);
        marker.setMap(map);
        map.setCenter(loc);
    }
}

// 마이페이지에서 저장된 마크 보기
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
                    <p>${item.title}</p>
                `;//정보담긴 박스의 이미지와 텍스트 표시
                //box클릭이벤트
                //box는 me의 이벤트를 발생시켯을때만 발생하기에 me이벤트 안에서 행해야함
                box.addEventListener('click', function () {
                    clearMarkers(smokemakers)
                    clearMarkers(mymakers)
                    // btn.style.display='block' 버튼생성
                    sidebar.classList.remove('-open');//사이드바 내리기
                    sidebarFlag = true;//사이드바 내린상태의 플래그 만들기
                    //item에 담긴 위도 경도
                    const move = new kakao.maps.LatLng(item.latitude, item.longitude);
                    if (index === 0) {// 흡연마크 좌표이동
                        smokmaker.setPosition(move),
                            smokmaker.setMap(map),//마크 맵에 표시
                            smokmaker.setImage(smokmakerimg)//마크이미지

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

    // 장소 등록 이벤트
    const saveside = document.querySelector('#saveside')
    // 등록 사이드 바 닫기 버튼
    const saveclose = document.querySelector('#saveclose');
    saveclose.addEventListener('click', function () {
        saveside.classList.remove('-open')
        postflag = false;
        savebtn.value = "등록"
    })

    const save = document.querySelector('#savebtn')
    save.addEventListener('click', function () {
        postflag = true //클릭이벤트 안에 클릭이벤트를 넣으면 중첩이벤트발생 될수있어서
        // 이벤트 분리하고 연결지을 플래그
        save.value = "등록중"
        alert("등록할 좌표를 지정해주세요")
    })
    kakao.maps.event.addListener(map, 'click', function (saveEvent) {
        if (postflag) { //클릭을해서 플래그가 트루가 되면

            const savelat = saveEvent.latLng.getLat();//카카오맵 위도 경도 따기
            const savelng = saveEvent.latLng.getLng();

            document.querySelector("#savelat").value = savelat
            document.querySelector("#savelng").value = savelng

            saveside.classList.add('-open') //사이드바 열기
            postflag = false;// 플래그 초기화
        }
    })
    //최종등록확정
    const saveend = document.querySelector('#saveend')
    saveend.addEventListener('click', async function () {
        const savedata = { //서버에 보낼 데이터 양식
            authorNo: 1,
            title: document.querySelector('#hash').value,
            content: document.querySelector('#hash').value || "",
            latitude: Number(document.querySelector('#savelat').value),
            longitude: Number(document.querySelector('#savelng').value),
            tags: [document.querySelector('#category').value]
        }

        await DD.V1.Posts.create(savedata)
        alert("등록이 완료되었습니다")
        location.reload()//새로고침

    })
