/** 카테고리 선택 UI 제어.
 * iframe 과 include 구조를 모두 지원한다.
 */
App.uiCategorySelector = {
  /**
   * @param {HTMLElement} root include slot root. 없으면 document 사용
   */
  init: (root = document) => {
    const buttons = App.dom.qsa('.ui', root);
    App.uiCategorySelector.buttons = buttons;
    buttons.forEach((button, index) => {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';

      App.dom.on(button, 'click', () => {
        App.uiCategorySelector.setActive(index);
        // 1) 기존 iframe 호환
        if (window.parent && window.parent !== window) {
          App.message.postToParent(App.const.messageType.SELECT_CATEGORY, { index });
          return;
        }

        // 2) include 구조에서는 main 컨트롤러를 직접 호출
        if (window.App?.pageMain?.handleCategorySelect) {
          window.App.pageMain.handleCategorySelect(index);
        }
      });
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.uiCategorySelector.init());


App.uiCategorySelector.setActive = (index) => {
  const buttons = App.uiCategorySelector.buttons || [];
  buttons.forEach((button, buttonIndex) => {
    const isActive = buttonIndex === index;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

App.uiCategorySelector.clearActive = () => {
  const buttons = App.uiCategorySelector.buttons || [];
  buttons.forEach((button) => {
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  });
};
