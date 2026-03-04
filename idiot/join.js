const authSubmitBtn = document.querySelector('.auth-submit-btn');
const joinform = document.querySelector('form');
joinform.addEventListener('submit', function (evt) {
    evt.preventDefault();
    const nickname = document.querySelector('#input-dd-user-nickname').value;
    const userId = document.querySelector('#input-dd-user-id').value;
    const userPw = document.querySelector('#input-dd-user-password').value;

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
    alert("회원가입이 완료되었습니다.")
    location.href = "./login.html"

})
