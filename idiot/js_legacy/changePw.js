const authSubmitBtn = document.querySelector('.auth-submit-btn');
const changeId = document.querySelector('#input-dd-id');
const changePw = document.querySelector('#input-dd-pw');
const changePw1 = document.querySelector('#input-dd-new-pw1');
const changePw2 = document.querySelector('#input-dd-new-pw2');
const woId = document.querySelector('#wo-id');
const woPw = document.querySelector('#wo-pw');
const woPw1 = document.querySelector('#wo-pw1');
const woPw2 = document.querySelector('#wo-pw2');

changeId.addEventListener('input', function () {
    if ((changeId.value.length > 0 && !changeId.checkValidity())) {
        woId.innerHTML = "ID는 영문시작, 4~12자의 영문, 숫자만 가능합니다.";
    } else {
        woId.innerHTML = "";
    }
})
changePw.addEventListener('input', function () {
    if ((changePw.value.length > 0 && !changePw.checkValidity())) {
        woPw.innerHTML = "PW는 영문시작, 4~12자의 영문, 숫자만 가능합니다.";
    } else {
        woPw.innerHTML = "";
    }
})
changePw1.addEventListener('input', function () {
    if ((changePw1.value.length > 0 && !changePw1.checkValidity())) {
        woPw1.innerHTML = "PW는 영문시작, 4~12자의 영문, 숫자만 가능합니다.";
    } else {
        woPw1.innerHTML = "";
    }
})

changePw2.addEventListener('input', function () {
    if ((changePw1.value !== changePw2.value) && changePw2.value.length > 0) {
        woPw2.innerHTML = "비밀번호가 일치하지 않습니다. 다시 입력바랍니다.";
    } else {
        woPw2.innerHTML = "";
    }
})

const changeform = document.querySelector('form');
changeform.addEventListener('submit', function (evt) {
    evt.preventDefault();

    const savedId = localStorage.getItem('savedId');
    const savedPw = localStorage.getItem('savedPw');

    if (changePw1.value !== changePw2.value) {
        alert("새 비밀번호가 일치하지 않습니다.");
        return;
    }

    if ( savedId === changeId.value && savedPw === changePw.value) {
        localStorage.setItem('savedPw', changePw2.value);
        localStorage.removeItem('login')
        alert("비밀번호가 변경되었습니다")
        location.href = "./login.html"
    } else {
        woPw2.innerHTML = `변경하려는 아이디 혹은 비밀번호가 잘못되었습니다.<br>다시 확인 바랍니다.`;
    }
})