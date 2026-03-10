/** 비밀번호 변경 페이지/모달 컨트롤러. */
App.pageChangePassword = {
  /** DOM 요소 수집 */
  getElements: (root = document) => ({
    root,
    form: App.dom.qs('form', root),
    loginIdInput: App.dom.qs('#input-dd-id', root),
    currentPasswordInput: App.dom.qs('#input-dd-pw', root),
    newPasswordInput: App.dom.qs('#input-dd-new-pw1', root),
    newPasswordConfirmInput: App.dom.qs('#input-dd-new-pw2', root),
    loginIdMessage: App.dom.qs('#wo-id', root),
    currentPasswordMessage: App.dom.qs('#wo-pw', root),
    newPasswordMessage: App.dom.qs('#wo-pw1', root),
    newPasswordConfirmMessage: App.dom.qs('#wo-pw2', root),
  }),

  /** 초기화 */
  init: (root = document) => {
    const elements = App.pageChangePassword.getElements(root);
    if (!elements.form || elements.form.dataset.bound === 'true') return;
    elements.form.dataset.bound = 'true';
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
        App.uiAuth.showMessage(elements.newPasswordConfirmMessage, '새 비밀번호가 일치하지 않습니다.');
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

      if (App.uiModal) {
        App.uiModal.open('login');
        return;
      }
      alert(result.message);
      location.href = './login.html';
    });
  },
};

function view(id) {
  const password1 = document.getElementById(id);
  if (password1.type === 'password' && password1.value.length > 0) {
    password1.type = 'text';
  } else if (password1.type === 'text' && password1.value.length > 0) {
    password1.type = 'password';
  }
}

document.addEventListener('DOMContentLoaded', () => App.pageChangePassword.init());
