window.onload = init;
function init() {

    bind()
}

function bind() {




    let save = document.querySelectorAll('.register-content-btn')
    save.forEach(function (btn, index) {
        btn.addEventListener('click', function () {
            const titleInput = document.querySelector('.category')
            const latInput = document.querySelector('.register-lat')
            const longInput = document.querySelector('.register-long')
            const tagsInput = document.querySelector('.register-content')
            const private = document.querySelector('.register-private-btn')

            const allInput = !titleInput.value.trim() || !latInput.value.trim() || !longInput.value.trim() || !tagsInput.value.trim()
            if (index === 0) {
                if (!allInput) {
                    let tags = [tagsInput.value]
                    if (private.checked) {
                        tags.push("비공개");
                    } else if (!private.checked) {
                        tags.push("공개");
                    }
                    //필터로 비공개를 걸러야함
                    const savedata = { //서버에 보낼 데이터 양식
                        authorNo: 1,
                        title: titleInput.value,
                        content: titleInput.value || "",
                        latitude: Number(latInput.value),
                        longitude: Number(longInput.value),
                        tags: [tagsInput.value]
                    }

                    if (!private.checked) {
                        alert('공개 등록되었습니다')
                        window.parent.postMessage('closeRegister', '*');
                    } if (private.checked) {
                        alert('비공개 등록되었습니다')
                        window.parent.postMessage('closeRegister', '*');
                    }
                } else if (allInput) {
                    alert('저장하실 위치의 정보를 정해주세요')
                }
            } else if (index === 1) {
                alert('취소되었습니다')
                window.parent.postMessage('closeRegister', '*');
            }

        })
    })
}