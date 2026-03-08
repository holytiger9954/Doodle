/** 로그인 페이지 컨트롤러. */
App.pageLogin = {
  /** DOM 요소 수집 */
  getElements: () => ({
    form: App.dom.qs('form'),
    loginErrorMessage: App.dom.qs('#wo-login'),
    loginIdInput: App.dom.qs('#input-dd-id'),
    passwordInput: App.dom.qs('#input-dd-password'),
  }),

  /** 초기화 */
  init: () => {
    const elements = App.pageLogin.getElements();
    if (!elements.form) return;
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
        location.href = './main.html';
        return;
      }

      App.uiAuth.showMessage(elements.loginErrorMessage, '아이디 또는 비밀번호가 일치하지 않습니다.<br>다시 입력 바랍니다.');
      setTimeout(() => {
        App.uiAuth.clearMessage(elements.loginErrorMessage);
      }, 1500);
    });
  },
};

document.addEventListener('DOMContentLoaded', App.pageLogin.init);
