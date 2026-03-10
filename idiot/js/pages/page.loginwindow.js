/** 로그인 확인용 서브창 컨트롤러. */
App.pageLoginWindow = {
  /** 로그인 상태를 검사하고 닉네임/로그아웃을 처리한다. */
  init: () => {
    const loginWindow = App.dom.qs('#login-window');
    const logoutButton = App.dom.qs('#logout');
    const nickname = App.storage.get(App.storage.keys.savedNickname);

    if (!App.storage.isLoggedIn() || !nickname) {
      alert('로그인이 필요한 기능입니다.');
      location.href = './login.html';
      return;
    }

    App.dom.setText(loginWindow, `${nickname}님`);
    App.dom.on(logoutButton, 'click', () => {
      App.authApi.logout();
      location.href = './login.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', App.pageLoginWindow.init);
