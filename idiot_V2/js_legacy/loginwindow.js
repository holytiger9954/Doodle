function bind() {
    const login = localStorage.getItem('login');
    const lWindow = document.querySelector('#login-window');
    const logoutBtn = document.querySelector('#logout')
    const nickName = localStorage.getItem('savedNn');
    if(login && nickName) {
        lWindow.innerHTML = `${nickName}님`;
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('login');
            location.href = './login.html';
        })
    } else {
        alert('로그인이 필요한 기능입니다.')
        location.href = './login.html';
        return;
    }
}
window.onload = function() {
    bind();
}


    