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
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'authChanged' }, '*');
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
