/**
 * 마이페이지 카테고리별 목록 패널.
 * 버튼을 누르면 해당 카테고리의 장소 목록을 렌더링한다.
 */
App.uiMarkerPanel = {
  /** 마지막으로 열려 있던 카테고리 index */
  lastIndex: -1,

  /** 패널 초기화 */
  init: () => {
    const buttons = App.dom.qsa('.side-btn');
    const markerContainer = App.dom.qs('#marker');
    buttons.forEach((button, index) => {
      App.dom.on(button, 'click', () => {
        App.uiMarkerPanel.toggleCategory(button, index, markerContainer);
      });
    });
  },

  /** 같은 버튼이면 닫고, 다른 버튼이면 새 목록을 연다. */
  toggleCategory: (button, index, markerContainer) => {
    if (!markerContainer) return;

    if (App.uiMarkerPanel.lastIndex === index) {
      App.uiMarkerPanel.hideContainer(markerContainer);
      App.uiMarkerPanel.lastIndex = -1;
      return;
    }

    App.uiMarkerPanel.lastIndex = index;
    const items = App.categoryData.resolveItemsByIndex({ index });
    App.uiMarkerPanel.renderItemList(items, markerContainer);
    button.insertAdjacentElement('afterend', markerContainer);

    setTimeout(() => {
      markerContainer.classList.add('show');
    }, 10);
  },

  /** 목록 컨테이너를 닫는다. */
  hideContainer: (markerContainer) => {
    markerContainer.classList.remove('show');
    setTimeout(() => {
      markerContainer.style.display = 'none';
      markerContainer.innerHTML = '';
    }, 400);
  },

  /** 카테고리 목록 DOM 생성 */
  renderItemList: (items, markerContainer) => {
    markerContainer.classList.remove('show');
    markerContainer.innerHTML = '';
    markerContainer.style.display = 'block';
    markerContainer.style.width = '100%';
    markerContainer.style.order = '0';

    items.forEach((item, itemIndex) => {
      const box = document.createElement('div');
      box.className = 'box';
      box.style.animationDelay = `${itemIndex * 0.05}s`;
      box.innerHTML = `<p>${item.title}</p>`;
      App.dom.on(box, 'click', () => {
        App.message.postToParent(App.const.messageType.SELECT_LOCATION, { data: item });
      });
      markerContainer.appendChild(box);
    });
  },
};

document.addEventListener('DOMContentLoaded', App.uiMarkerPanel.init);
