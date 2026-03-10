/** 회원가입 페이지/모달 컨트롤러. */
App.pageJoin = {
  /** 페이지 DOM 요소를 한 번에 수집한다. */
  getElements: (root = document) => ({
    root,
    form: App.dom.qs('form', root),
    loginIdInput: App.dom.qs('#input-dd-user-id', root),
    passwordInput: App.dom.qs('#input-dd-user-password1', root),
    passwordConfirmInput: App.dom.qs('#input-dd-user-password2', root),
    nicknameInput: App.dom.qs('#input-dd-user-nickname', root),
    loginIdMessage: App.dom.qs('#wo-id', root),
    passwordMessage: App.dom.qs('#wo-pw1', root),
    passwordConfirmMessage: App.dom.qs('#wo-pw2', root),
    nicknameMessage: App.dom.qs('#wo-nn', root),
  }),

  /** 초기 진입점 */
  init: (root = document) => {
    const elements = App.pageJoin.getElements(root);
    if (!elements.form || elements.form.dataset.bound === 'true') return;
    elements.form.dataset.bound = 'true';
    App.pageJoin.bindValidation(elements);
    App.pageJoin.bindSubmit(elements);
  },

  /** 실시간 입력 검증 이벤트 등록 */
  bindValidation: (elements) => {
    App.uiAuth.bindValidationMessage(elements.loginIdInput, elements.loginIdMessage, 'ID는 영문시작, 4~12자의 영문, 숫자만 가능합니다.');
    App.uiAuth.bindValidationMessage(elements.passwordInput, elements.passwordMessage, 'PW는 영문시작, 4~12자의 영문, 숫자만 가능합니다.');
    App.uiAuth.bindValidationMessage(elements.nicknameInput, elements.nicknameMessage, '닉네임은 2 ~ 8 자만 가능합니다.');

    App.dom.on(elements.passwordConfirmInput, 'input', () => {
      const isMatched = elements.passwordInput.value === elements.passwordConfirmInput.value;
      App.uiAuth.showMessage(elements.passwordConfirmMessage, isMatched ? '' : '비밀번호가 일치하지 않습니다. 다시 입력바랍니다.');
    });
  },

  /** submit 처리 */
  bindSubmit: (elements) => {
    App.dom.on(elements.form, 'submit', async (event) => {
      event.preventDefault();
      if (elements.passwordInput.value !== elements.passwordConfirmInput.value) {
        App.uiAuth.showMessage(elements.passwordConfirmMessage, '비밀번호가 일치하지 않습니다.');
        return;
      }

      const result = await App.authApi.signup({
        loginId: elements.loginIdInput.value,
        password: elements.passwordInput.value,
        nickname: elements.nicknameInput.value,
      });

      if (!result.success) {
        App.uiAuth.showMessage(elements.nicknameMessage, result.message || '회원가입에 실패했습니다.');
        return;
      }

      if (App.uiModal) {
        App.uiModal.open('login');
        return;
      }

      alert('회원가입이 완료되었습니다.');
      location.href = './login.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.pageJoin.init());
