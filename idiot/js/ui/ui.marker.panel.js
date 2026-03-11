/**
 * 마이페이지 목록 패널.
 * 마이페이지에서는 로그인 사용자와 관련된 목록(찜/내 등록 장소/내 댓글)만 렌더링한다.
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

    window.addEventListener('storage', async (event) => {
      const watchedKeys = [
        App.storage?.keys?.spotComments,
        App.storage?.keys?.userSpots,
        App.storage?.keys?.favoriteSpotsByUser,
      ].filter(Boolean);

      if (!watchedKeys.includes(event.key || '')) return;
      await App.uiMarkerPanel.refreshOpenPanel();
    });

    window.addEventListener('focus', () => {
      App.uiMarkerPanel.refreshOpenPanel();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      App.uiMarkerPanel.refreshOpenPanel();
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
      case 'myComments':
        return App.commentApi?.listMyComments?.() || [];
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

  refreshOpenPanel: async () => {
    const markerContainer = App.dom.qs('#marker');
    if (!markerContainer) return;
    if (!App.storage.isLoggedIn()) return;
    if (!App.uiMarkerPanel.lastKey) return;
    if (markerContainer.style.display === 'none' || !markerContainer.childElementCount) return;

    const items = await App.uiMarkerPanel.resolvePanelItems(App.uiMarkerPanel.lastKey);
    App.uiMarkerPanel.renderItemList(items, markerContainer, App.uiMarkerPanel.lastKey);
  },

  renderEmptyState: (markerContainer, panelKey) => {
    const box = document.createElement('div');
    box.className = 'box is-empty';
    const message = panelKey === 'favorites'
      ? '아직 찜한 장소가 없습니다. 지도의 정보 팝업에서 찜하기를 눌러보세요.'
      : panelKey === 'myComments'
        ? '아직 작성한 댓글이 없습니다. 공개된 공유 스팟에 댓글을 남겨보세요.'
        : '아직 등록한 장소가 없습니다. 지도에서 장소를 등록하면 여기에 모입니다.';
    box.innerHTML = `<p>${message}</p>`;
    markerContainer.appendChild(box);
  },

  renderItemList: (items, markerContainer, panelKey) => {
    markerContainer.classList.remove('show');
    markerContainer.innerHTML = '';
    markerContainer.style.display = 'block';
    markerContainer.style.width = '100%';
    markerContainer.style.order = '0';

    if (!items.length) {
      App.uiMarkerPanel.renderEmptyState(markerContainer, panelKey);
      return;
    }

    items.forEach((item, itemIndex) => {
      const box = document.createElement('div');
      box.style.animationDelay = `${itemIndex * 0.05}s`;

      if (panelKey === 'myComments') {
        App.uiMarkerPanel.renderCommentBox(box, item, markerContainer, panelKey);
      } else if (panelKey === 'mySpots') {
        App.uiMarkerPanel.renderMySpotBox(box, item, markerContainer, panelKey);
      } else {
        App.uiMarkerPanel.renderFavoriteBox(box, item);
      }

      markerContainer.appendChild(box);
    });
  },

  renderFavoriteBox: (box, item) => {
    const categoryMeta = App.categoryData.findCategoryMeta(item);
    const categoryLabel = App.categoryData.normalizeCategoryLabel(item.Category || item.category || categoryMeta.label || '장소');

    box.className = 'box';
    box.innerHTML = `
      <div class="box-main box-main--simple">
        <span class="box-icon-badge"><img src="${categoryMeta.image}" alt=""></span>
        <div class="box-copy">
          <span class="box-chip">${categoryLabel}</span>
          <p>${item.title}</p>
        </div>
      </div>
    `;

    App.dom.on(box, 'click', () => {
      App.message.postToParent(App.const.messageType.SELECT_LOCATION, { data: item });
    });
  },

  renderMySpotBox: (box, item, markerContainer, panelKey) => {
    const categoryMeta = App.categoryData.findCategoryMeta(item);
    const categoryLabel = App.categoryData.normalizeCategoryLabel(item.Category || item.category || categoryMeta.label || '장소');

    box.className = 'box box--action';
    box.innerHTML = `
      <div class="box-main">
        <span class="box-icon-badge"><img src="${categoryMeta.image}" alt=""></span>
        <div class="box-copy">
          <span class="box-chip">${categoryLabel}</span>
          <p>${item.title}</p>
          <span class="box-sub">${item.address || '주소 정보 없음'}</span>
        </div>
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

    App.dom.on(box, 'click', () => {
      App.message.postToParent(App.const.messageType.SELECT_LOCATION, { data: item });
    });
  },

  renderCommentBox: (box, item, markerContainer, panelKey) => {
    const spot = item.spot || null;
    const categoryMeta = spot ? App.categoryData.findCategoryMeta(spot) : { image: './img/icons/all.svg' };
    const categoryLabel = spot
      ? App.categoryData.normalizeCategoryLabel(spot.Category || spot.category || '공유 스팟')
      : '연결 끊김';
    const title = spot?.title || '삭제되었거나 비공개로 전환된 장소';
    const address = spot?.address || (spot ? '주소 정보 없음' : '현재는 열 수 없는 장소예요.');

    box.className = 'box box--comment';
    box.innerHTML = `
      <div class="box-main box-main--comment">
        <span class="box-icon-badge"><img src="${categoryMeta.image}" alt=""></span>
        <div class="box-copy box-copy--comment">
          <div class="box-comment-topline">
            <span class="box-chip">${categoryLabel}</span>
            <span class="box-comment-date">${App.commentApi.formatCommentDate(item.createdAt) || ''}</span>
          </div>
          <p class="box-title">${title}</p>
          <p class="box-comment-body">${item.content || ''}</p>
          <span class="box-sub">${address}</span>
        </div>
      </div>
      <div class="box-actions box-actions--comment">
        <button type="button" class="box-delete" aria-label="댓글 삭제">삭제</button>
      </div>
    `;

    const deleteButton = box.querySelector('.box-delete');
    App.dom.on(deleteButton, 'click', async (event) => {
      event.stopPropagation();
      const ok = await App.confirm.open({
        title: '댓글을 삭제할까요?',
        message: '삭제 후 되돌릴 수 없어요.',
        confirmText: '삭제',
        cancelText: '취소',
        danger: true,
      });
      if (!ok) return;

      const result = App.commentApi.deleteMyComment(item.id);
      if (!result.success) {
        App.toast.show(result.message || '댓글을 삭제하지 못했어요.');
        return;
      }

      const nextItems = await App.uiMarkerPanel.resolvePanelItems(panelKey);
      App.uiMarkerPanel.renderItemList(nextItems, markerContainer, panelKey);
      App.toast.show(result.message || '댓글을 삭제했어요.');
    });

    App.dom.on(box, 'click', () => {
      if (!spot) {
        App.toast.show('이 댓글이 달린 장소는 현재 열 수 없어요.');
        return;
      }
      App.message.postToParent(App.const.messageType.SELECT_LOCATION, { data: spot });
    });
  },
};

document.addEventListener('DOMContentLoaded', App.uiMarkerPanel.init);
