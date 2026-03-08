/** 비밀번호 변경 페이지 컨트롤러. */
App.pageChangePassword = {
  /** DOM 요소 수집 */
  getElements: () => ({
    form: App.dom.qs('form'),
    loginIdInput: App.dom.qs('#input-dd-id'),
    currentPasswordInput: App.dom.qs('#input-dd-pw'),
    newPasswordInput: App.dom.qs('#input-dd-new-pw1'),
    newPasswordConfirmInput: App.dom.qs('#input-dd-new-pw2'),
    loginIdMessage: App.dom.qs('#wo-id'),
    currentPasswordMessage: App.dom.qs('#wo-pw'),
    newPasswordMessage: App.dom.qs('#wo-pw1'),
    newPasswordConfirmMessage: App.dom.qs('#wo-pw2'),
  }),

  /** 초기화 */
  init: () => {
    const elements = App.pageChangePassword.getElements();
    if (!elements.form) return;
    App.pageChangePassword.bindValidation(elements);
    App.pageChangePassword.bindSubmit(elements);
  },

  /** 실시간 검증 처리 */
  bindValidation: (elements) => {
    const passwordRuleMessage = 'PW는 영문시작, 4~12자의 영문, 숫자만 가능합니다.';
    App.uiAuth.bindValidationMessage(elements.loginIdInput, elements.loginIdMessage, 'ID는 영문시작, 4~12자의 영문, 숫자만 가능합니다.');
    App.uiAuth.bindValidationMessage(elements.currentPasswordInput, elements.currentPasswordMessage, passwordRuleMessage);
    App.uiAuth.bindValidationMessage(elements.newPasswordInput, elements.newPasswordMessage, passwordRuleMessage);

    App.dom.on(elements.newPasswordConfirmInput, 'input', () => {
      const isMatched = elements.newPasswordInput.value === elements.newPasswordConfirmInput.value;
      App.uiAuth.showMessage(elements.newPasswordConfirmMessage, isMatched ? '' : '비밀번호가 일치하지 않습니다. 다시 입력바랍니다.');
    });
  },

  /** submit 처리 */
  bindSubmit: (elements) => {
    App.dom.on(elements.form, 'submit', async (event) => {
      event.preventDefault();
      if (elements.newPasswordInput.value !== elements.newPasswordConfirmInput.value) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
      }

      const result = await App.authApi.changePassword({
        loginId: elements.loginIdInput.value,
        currentPassword: elements.currentPasswordInput.value,
        newPassword: elements.newPasswordInput.value,
      });

      if (!result.success) {
        App.uiAuth.showMessage(elements.newPasswordConfirmMessage, '변경하려는 아이디 혹은 비밀번호가 잘못되었습니다.<br>다시 확인 바랍니다.');
        return;
      }

      alert(result.message);
      location.href = './login.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', App.pageChangePassword.init);
