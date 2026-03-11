/** 카테고리 선택 UI 제어.
 * iframe 과 include 구조를 모두 지원한다.
 */
App.uiCategorySelector = {
  /**
   * @param {HTMLElement} root include slot root. 없으면 document 사용
   */
  init: (root = document) => {
    const buttons = App.dom.qsa('.ui', root);
    const scroller = root.querySelector?.('.ui-inline-scroller, .ui-page-scroller') || document.querySelector('.ui-inline-scroller, .ui-page-scroller');
    App.uiCategorySelector.buttons = buttons;
    App.uiCategorySelector.bindScroller(scroller);

    buttons.forEach((button, index) => {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';

      App.dom.on(button, 'click', () => {
        const selectedIndex = Number(button.dataset.index ?? index);
        App.uiCategorySelector.setActive(selectedIndex);
        // 1) 기존 iframe 호환
        if (window.parent && window.parent !== window) {
          App.message.postToParent(App.const.messageType.SELECT_CATEGORY, { index: selectedIndex });
          return;
        }

        // 2) include 구조에서는 main 컨트롤러를 직접 호출
        if (window.App?.pageMain?.handleCategorySelect) {
          window.App.pageMain.handleCategorySelect(selectedIndex);
        }
      });
    });
  },

  bindScroller: (scroller) => {
    if (!scroller || scroller.dataset.scrollBound === 'true') return;
    scroller.dataset.scrollBound = 'true';

    scroller.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      scroller.scrollLeft += event.deltaY;
      event.preventDefault();
    }, { passive: false });

    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    scroller.addEventListener('pointerdown', (event) => {
      isPointerDown = true;
      startX = event.clientX;
      startScrollLeft = scroller.scrollLeft;
      scroller.classList.add('is-dragging');
    });

    const stopDragging = () => {
      isPointerDown = false;
      scroller.classList.remove('is-dragging');
    };

    scroller.addEventListener('pointermove', (event) => {
      if (!isPointerDown) return;
      const deltaX = event.clientX - startX;
      scroller.scrollLeft = startScrollLeft - deltaX;
    });

    scroller.addEventListener('pointerup', stopDragging);
    scroller.addEventListener('pointercancel', stopDragging);
    scroller.addEventListener('pointerleave', stopDragging);
  },
};

document.addEventListener('DOMContentLoaded', () => App.uiCategorySelector.init());


App.uiCategorySelector.setActive = (index) => {
  const buttons = App.uiCategorySelector.buttons || [];
  let activeButton = null;
  buttons.forEach((button, buttonIndex) => {
    const isActive = buttonIndex === index;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    if (isActive) activeButton = button;
  });
  App.uiCategorySelector.ensureButtonVisible(activeButton);
};

App.uiCategorySelector.clearActive = () => {
  const buttons = App.uiCategorySelector.buttons || [];
  buttons.forEach((button) => {
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  });
};


App.uiCategorySelector.ensureButtonVisible = (button) => {
  const scroller = document.querySelector('.ui-inline-scroller, .ui-page-scroller');
  if (!scroller || !button) return;
  const scrollerRect = scroller.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const deltaLeft = buttonRect.left - scrollerRect.left;
  const deltaRight = buttonRect.right - scrollerRect.right;
  if (deltaLeft < 0) {
    scroller.scrollLeft += deltaLeft - 12;
  } else if (deltaRight > 0) {
    scroller.scrollLeft += deltaRight + 12;
  }
};
