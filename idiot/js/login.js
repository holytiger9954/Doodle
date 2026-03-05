const authSubmitBtn = document.querySelector('.auth-submit-btn');
const loginform = document.querySelector('form');
const woLogin = document.querySelector('#wo-login');
loginform.addEventListener('submit', function (evt) {
    evt.preventDefault();
    const loginId = document.querySelector('#input-dd-id').value;
    const loginPw = document.querySelector('#input-dd-password').value;

    const savedId = localStorage.getItem('savedId');
    const savedPw1 = localStorage.getItem('savedPw1');
    const savedNn = localStorage.getItem('savedNn');

    if (loginId === savedId && loginPw === savedPw1) {
    //    alert(`${savedNn}님. 환영합니다!`);
        location.href = "./main.html"
    } else {
        woLogin.innerHTML = '아이디 또는 비밀번호가 일치하지 않습니다.<br>다시 입력 바랍니다.';
        setTimeout(function () {
            woLogin.innerHTML = '';
        }, 1500)
    }

})
// async function handleLogin(event) {
//     event.preventDefault(); // 폼 제출 방지

//     // 1. 데이터 수집
//     const loginData = {
//         loginId: $('#input-dd-user-id').val(),
//         password: $('#input-dd-password').val()
//     };

//     try {
//         // 2. 로그인 API 호출 (라이브러리의 ajax 활용)
//         const res = await DD.V1.ajax({
//             method: "POST",
//             url: DD.V1.url(DD.V1.API.TB_AUTH_LOGIN),
//             json: loginData
//         });

//         // 3. 성공 시 처리 (서버에서 토큰이나 유저정보를 준다고 가정)
//         alert(res.displayName + '님, 환영합니다!');
//         localStorage.setItem('isLoggedIn', 'true'); // 간단한 로그인 상태 저장
//         location.href = './index.html'; // 메인 페이지로 이동

//     } catch (err) {
//         console.error(err);
//         alert('아이디 또는 비밀번호를 확인해주세요.');
//     }
// }

// function closeLogin() {
//     $('#dd-overlay').hide();
// }
