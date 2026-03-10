/**
 * 인증 화면 공통 UI.
 * 메시지 출력/초기화/실시간 검증을 공통화한다.
 */
App.uiAuth = {
  /** 유효성 문구 출력 */
  showMessage: (target, message) => {
    App.dom.setHtml(target, message);
  },
  /** 문구 제거 */
  clearMessage: (target) => {
    App.dom.setHtml(target, '');
  },
  /** input validity를 기준으로 안내 문구를 자동 처리 */
  bindValidationMessage: (input, target, invalidMessage) => {
    App.dom.on(input, 'input', () => {
      if (!input) return;
      const shouldShow = input.value.length > 0 && !input.checkValidity();
      if (shouldShow) {
        App.uiAuth.showMessage(target, invalidMessage);
        return;
      }
      App.uiAuth.clearMessage(target);
    });
  },
};
