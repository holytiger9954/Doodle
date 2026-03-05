const authSubmitBtn = document.querySelector('.auth-submit-btn');
const joinId = document.querySelector('#input-dd-user-id');
const joinPw1 = document.querySelector('#input-dd-user-password1');
const joinPw2 = document.querySelector('#input-dd-user-password2');
const joinNn = document.querySelector('#input-dd-user-nickname');
const woId = document.querySelector('#wo-id');
const woPw1 = document.querySelector('#wo-pw1');
const woPw2 = document.querySelector('#wo-pw2');
const woNn = document.querySelector('#wo-nn');

joinId.addEventListener('input', function () {
    if ((joinId.value.length > 0 && !joinId.checkValidity()) || joinId.value.length > 12) {
        woId.innerHTML = "ID는 영문시작, 4~12자의 영문, 숫자만 가능합니다.";
    } else {
        woId.innerHTML = "";
    }
})
joinPw1.addEventListener('input', function () {
    if ((joinPw1.value.length > 0 && !joinPw1.checkValidity()) || joinPw1.value.length > 12) {
        woPw1.innerHTML = "PW는 영문시작, 4~12자의 영문, 숫자만 가능합니다.";
    } else {
        woPw1.innerHTML = "";
    }
})
joinPw2.addEventListener('input', function () {
    if ((joinPw1.value !== joinPw2.value)) {
        woPw2.innerHTML = "비밀번호가 일치하지 않습니다. 다시 입력바랍니다.";
    } else {
        woPw2.innerHTML = "";
    }
})

joinNn.addEventListener('input', function () {
    if ((joinNn.value.length > 0 && !joinNn.checkValidity()) || joinNn.value.length > 12) {
        woNn.innerHTML = "닉네임은 2 ~ 8 자만 가능합니다.";
    } else {
        woNn.innerHTML = "";
    }
})


const joinform = document.querySelector('form');
joinform.addEventListener('submit', function (evt) {
    evt.preventDefault();

    localStorage.setItem('savedId', joinId.value);
    localStorage.setItem('savedPw', joinPw1.value);
    localStorage.setItem('savedNn', joinNn.value);
    alert("회원가입이 완료되었습니다.")
    location.href = "./login.html"
})
// // [진짜 전송 시작!]// jemini.
// DD.V1.TB.Auth.signup({
//     loginId: userId,
//     password: userPw,
//     displayName: nickname
// })
// .done(function(res) {
//     // 서버가 "DB에 저장 완료!"라고 응답하면 실행됨
//     alert(nickname + "님, 회원가입이 완료되었습니다!");
//     location.href = "./login.html";
// })
// .fail(function(xhr) {
//     // 아이디 중복 등의 이유로 실패하면 실행됨
//     alert("가입 실패: " + (xhr.responseJSON?.message || "다시 시도해주세요."));
// });
