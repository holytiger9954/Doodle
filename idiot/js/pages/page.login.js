/** 로그인 페이지/모달 컨트롤러. */
App.pageLogin = {
  /** DOM 요소 수집 */
  getElements: (root = document) => ({
    root,
    form: App.dom.qs('form', root),
    loginErrorMessage: App.dom.qs('#wo-login', root),
    loginIdInput: App.dom.qs('#input-dd-id', root),
    passwordInput: App.dom.qs('#input-dd-password', root),
  }),

  /** 초기화 */
  init: (root = document) => {
    const elements = App.pageLogin.getElements(root);
    if (!elements.form || elements.form.dataset.bound === 'true') return;
    elements.form.dataset.bound = 'true';
    App.pageLogin.bindSubmit(elements);
  },

  /** submit 처리 */
  bindSubmit: (elements) => {
    App.dom.on(elements.form, 'submit', async (event) => {
      event.preventDefault();
      const result = await App.authApi.login({
        loginId: elements.loginIdInput.value,
        password: elements.passwordInput.value,
      });

      if (result.success) {
        if (App.uiModal) {
          App.uiModal.close();
        }

        // [v20 인증 상태 변경 처리 보강]
        // 로그인 모달은 메인 페이지 같은 창 위에서 열릴 수도 있고,
        // iframe/서브창 안에서 열릴 수도 있다.
        // 따라서 parent postMessage에만 의존하면 같은 창 모달 로그인에서는
        // 마커/권한 상태가 즉시 갱신되지 않을 수 있다.
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'authChanged', reason: 'login' }, '*');
        } else if (App.pageMain?.handleAuthStateChanged) {
          // [v21 인증 갱신 보강]
          // 같은 창 모달 로그인에서는 모달이 닫힌 직후 한 프레임 뒤에 갱신해야
          // 지도/오버레이 상태가 안정적으로 반영된다.
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await App.pageMain.handleAuthStateChanged();
        } else if (App.pageMain?.refreshVisibleMapStateAfterAuthChange) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await App.pageMain.refreshVisibleMapStateAfterAuthChange();
          await App.pageRanking?.render?.();
          App.pageMain.refreshMypageFrame?.();
          App.pageMain.updateAuthStateSnapshot?.();
        }

        if (App.pageMain?.refreshMypageFrame) {
          App.pageMain.refreshMypageFrame();
        }
        return;
      }

      App.uiAuth.showMessage(elements.loginErrorMessage, '아이디 또는 비밀번호가 일치하지 않습니다.<br>다시 입력 바랍니다.');
      setTimeout(() => {
        App.uiAuth.clearMessage(elements.loginErrorMessage);
      }, 1500);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.pageLogin.init());
