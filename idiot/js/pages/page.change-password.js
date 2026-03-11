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

      // [v20 인증 상태 변경 처리 보강]
      // 비밀번호 변경 후 세션이 종료되면 로그아웃과 같은 권한 재계산이 즉시 일어나야 한다.
      // changePassword 모달도 같은 창 위에서 열릴 수 있으므로,
      // parent postMessage뿐 아니라 same-window 직접 갱신도 함께 처리한다.
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'authChanged', reason: 'passwordChangedLogout' }, '*');
      } else if (App.pageMain?.handleAuthStateChanged) {
        // [v21 인증 갱신 보강]
        // 같은 창 모달 changePassword도 세션 종료 직후 한 프레임 뒤에 갱신한다.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await App.pageMain.handleAuthStateChanged();
      } else if (App.pageMain?.refreshVisibleMapStateAfterAuthChange) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await App.pageMain.refreshVisibleMapStateAfterAuthChange();
        await App.pageRanking?.render?.();
        App.pageMain.refreshMypageFrame?.();
        App.pageMain.updateAuthStateSnapshot?.();
      }

      App.toast.show(result.message);

      if (App.uiModal) {
        App.uiModal.open('login');
        return;
      }
      location.href = './login.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.pageChangePassword.init());
