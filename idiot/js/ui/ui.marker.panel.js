/**
 * 마이페이지 목록 패널.
 * 마이페이지에서는 로그인 사용자와 관련된 목록(찜/내 등록 장소)만 렌더링한다.
 */
App.uiMarkerPanel = {
  /** 마지막으로 열려 있던 패널 key */
  lastKey: '',

  init: () => {
    const buttons = App.dom.qsa('.side-btn');
    const markerContainer = App.dom.qs('#marker');
    buttons.forEach((button) => {
      App.dom.on(button, 'click', async () => {
        await App.uiMarkerPanel.togglePanel(button, markerContainer);
      });
    });
  },

  togglePanel: async (button, markerContainer) => {
    if (!markerContainer) return;

    const panelKey = button.dataset.panel || '';
    if (App.uiMarkerPanel.lastKey === panelKey) {
      App.uiMarkerPanel.hideContainer(markerContainer);
      App.uiMarkerPanel.lastKey = '';
      return;
    }

    App.uiMarkerPanel.lastKey = panelKey;
    const items = await App.uiMarkerPanel.resolvePanelItems(panelKey);
    App.uiMarkerPanel.renderItemList(items, markerContainer, panelKey);
    button.insertAdjacentElement('afterend', markerContainer);

    setTimeout(() => {
      markerContainer.classList.add('show');
    }, 10);
  },

  resolvePanelItems: async (panelKey) => {
    switch (panelKey) {
      case 'favorites':
        return App.spotApi.listFavoriteSpots();
      case 'mySpots':
        return App.spotApi.listMySpots();
      default:
        return [];
    }
  },

  hideContainer: (markerContainer) => {
    markerContainer.classList.remove('show');
    setTimeout(() => {
      markerContainer.style.display = 'none';
      markerContainer.innerHTML = '';
    }, 400);
  },

  renderItemList: (items, markerContainer, panelKey) => {
    markerContainer.classList.remove('show');
    markerContainer.innerHTML = '';
    markerContainer.style.display = 'block';
    markerContainer.style.width = '100%';
    markerContainer.style.order = '0';

    if (!items.length) {
      const box = document.createElement('div');
      box.className = 'box is-empty';
      const message = panelKey === 'favorites'
        ? '아직 찜한 장소가 없습니다. 지도의 정보 팝업에서 찜하기를 눌러보세요.'
        : '아직 등록한 장소가 없습니다. 지도에서 장소를 등록하면 여기에 모입니다.';
      box.innerHTML = `<p>${message}</p>`;
      markerContainer.appendChild(box);
      return;
    }

    items.forEach((item, itemIndex) => {
      const box = document.createElement('div');
      box.className = `box${panelKey === 'mySpots' ? ' box--action' : ''}`;
      box.style.animationDelay = `${itemIndex * 0.05}s`;

      if (panelKey === 'mySpots') {
        box.innerHTML = `
          <div class="box-main">
            <p>${item.title}</p>
            <span class="box-sub">${item.address || '주소 정보 없음'}</span>
          </div>
          <div class="box-actions">
            <button type="button" class="box-edit" aria-label="장소 수정">수정</button>
            <button type="button" class="box-delete" aria-label="장소 삭제">삭제</button>
          </div>
        `;

        const editButton = box.querySelector('.box-edit');
        const deleteButton = box.querySelector('.box-delete');

        App.dom.on(editButton, 'click', (event) => {
          event.stopPropagation();
          App.message.postToParent(App.const.messageType.OPEN_EDIT_SPOT, {
            data: item,
            source: 'mypage',
            openInfo: false,
          });
        });

        App.dom.on(deleteButton, 'click', async (event) => {
          event.stopPropagation();
          const ok = await App.confirm.open({
            title: '장소를 삭제할까요?',
            message: '삭제 후 되돌릴 수 없어요.',
            confirmText: '삭제',
            cancelText: '취소',
            danger: true,
          });
          if (!ok) return;
          const result = await App.spotApi.deleteMySpot(item);
          if (!result.success) {
            App.toast.show(result.message || '삭제하지 못했습니다.');
            return;
          }
          const nextItems = await App.uiMarkerPanel.resolvePanelItems(panelKey);
          App.uiMarkerPanel.renderItemList(nextItems, markerContainer, panelKey);
          App.message.postToParent(App.const.messageType.SPOTS_CHANGED, { removedSpotId: result.removedSpotId, message: result.message || '삭제되었습니다.' });
        });
      } else {
        box.innerHTML = `<p>${item.title}</p>`;
      }

      App.dom.on(box, 'click', () => {
        App.message.postToParent(App.const.messageType.SELECT_LOCATION, { data: item });
      });
      markerContainer.appendChild(box);
    });
  },
};

document.addEventListener('DOMContentLoaded', App.uiMarkerPanel.init);
