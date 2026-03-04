const authSubmitBtn = document.querySelector('.auth-submit-btn');
const joinform = document.querySelector('form');
joinform.addEventListener('submit', function (evt) {
    evt.preventDefault();
    const loginId = document.querySelector('#input-dd-id').value;
    const loginPw = document.querySelector('#input-dd-password').value;
    alert("GUEST님 환영합니다!")
    location.href = "./main.html"

})
