window.onload = init;
function init() {

    // 허성범 건드린거
    // URL에서 파라미터 추출
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');

    // 입력창에 값 세팅
    if (lat && lng) {
        document.querySelector('.register-lat').value = lat;
        document.querySelector('.register-long').value = lng;
    }

    bind()
}

function bind() {
    // 등록페이지
    let save = document.querySelectorAll('.register-content-btn')//등록 취소버튼
    save.forEach(function (btn, index) { //버튼 뭐눌럿는지 알려주기
        btn.addEventListener('click', function () {
            const titleInput = document.querySelector('.category')
            const latInput = document.querySelector('.register-lat')
            const longInput = document.querySelector('.register-long')
            const tagsInput = document.querySelector('.register-content')
            const private = document.querySelector('.register-private-btn')

            const allInput = !titleInput.value.trim() || !latInput.value.trim() || !longInput.value.trim() || !tagsInput.value.trim()
            if (index === 0) {//등록버튼인덱스
                if (!allInput) {
                    let tags = [tagsInput.value]
                    if (private.checked) {
                        tags.push("비공개");
                    } else if (!private.checked) {
                        tags.push("공개");
                    }
                    //필터로 비공개를 걸러야함
                    const savedata = { //서버에 보낼 데이터 양식
                        title: tagsInput.value,
                        latitude: Number(latInput.value),
                        longitude: Number(longInput.value),
                        Category: titleInput.value
                    }
                    window.parent.postMessage({ //메인js에 보내기
                        type: 'newMarker', //메인에서 구별하기 위한 별명
                        data: savedata //메인에서 받을 데이터
                    },'*');
                    
                    if (!private.checked) {
                        alert('공개 등록되었습니다')
                        window.parent.postMessage('closeRegister', '*');//아이프레임창 닫기
                    } if (private.checked) {
                        alert('비공개 등록되었습니다')
                        window.parent.postMessage('closeRegister', '*');
                    }
                } else if (allInput) {
                    alert('저장할 위치 정보를 입력해주세요')
                }
            } else if (index === 1) {
                alert('취소되었습니다')
                window.parent.postMessage('closeRegister', '*');
            }
        })
    })
}