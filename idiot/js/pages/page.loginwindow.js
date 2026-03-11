/** 로그인 확인용 서브창 컨트롤러. */
App.pageLoginWindow = {
  /** 로그인 상태를 검사하고 닉네임/로그아웃을 처리한다. */
  init: () => {
    const loginWindow = App.dom.qs('#login-window');
    const logoutButton = App.dom.qs('#logout');
    const nickname = App.storage.get(App.storage.keys.savedNickname);

    if (!App.storage.isLoggedIn() || !nickname) {
      App.toast.show('로그인이 필요한 기능입니다.');
      window.setTimeout(() => {
        location.href = './login.html';
      }, 350);
      return;
    }

    App.dom.setText(loginWindow, `${nickname}님`);
    App.dom.on(logoutButton, 'click', async () => {
      const ok = await App.confirm.open({
        title: '로그아웃할까요?',
        message: '현재 계정에서 로그아웃합니다.',
        confirmText: '로그아웃',
        cancelText: '취소',
      });
      if (!ok) return;

      App.authApi.logout();
      App.toast.show('로그아웃되었습니다.');
      // [v18 인증 후 마커 갱신]
      // 별도 로그인 확인 창에서도 부모가 있다면 즉시 갱신 신호를 보낸다.
      if (window.parent && window.parent !== window) {
        // [v19 인증 상태 변경 보강]
        // 별도 로그인 확인 창에서 로그아웃해도 부모(main) 화면이 즉시 갱신되게 한다.
        window.parent.postMessage({ type: 'authChanged', reason: 'logout' }, '*');
      }
      window.setTimeout(() => {
        location.href = './login.html';
      }, 180);
    });
  },
};

document.addEventListener('DOMContentLoaded', App.pageLoginWindow.init);
