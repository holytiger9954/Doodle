/** 해시태그 랭킹 컨트롤러. */
App.pageRanking = {
  limit: 10,

  init: async (root = document) => {
    const host = App.dom.qs('.ranking-container', root) || root;
    App.pageRanking.elements = {
      root: host,
      list: App.dom.qs('#ranking-list', root),
      empty: App.dom.qs('#ranking-empty', root),
      subtitle: App.dom.qs('#ranking-subtitle', root),
      filterBar: App.dom.qs('#ranking-filter-bar', root),
      filterText: App.dom.qs('#ranking-filter-text', root),
      clearButton: App.dom.qs('#ranking-filter-clear', root),
    };

    if (App.pageRanking.elements.clearButton && App.pageRanking.elements.clearButton.dataset.bound !== 'true') {
      App.pageRanking.elements.clearButton.dataset.bound = 'true';
      App.dom.on(App.pageRanking.elements.clearButton, 'click', async (event) => {
        event.stopPropagation();
        await App.pageRanking.clearFilter();
      });
    }

    await App.pageRanking.render();
  },

  render: async () => {
    const elements = App.pageRanking.elements;
    if (!elements?.list) return;

    const rankings = await App.spotApi.getTagRanking(App.pageRanking.limit);
    elements.list.innerHTML = '';
    elements.empty?.classList.toggle('hidden', rankings.length > 0);

    const maxCount = rankings[0]?.count || 1;
    const fragment = document.createDocumentFragment();

    rankings.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ranking-item';
      button.innerHTML = `
        <span class="rank-number">${index + 1}</span>
        <span class="hashtag-info">
          <span class="hashtag-name">${entry.tag}</span>
          <span class="count-bar"><span class="count-fill" style="width:${Math.max(18, (entry.count / maxCount) * 100)}%;"></span></span>
        </span>
        <span class="count-text">${entry.count}</span>
      `;
      App.dom.on(button, 'click', async (event) => {
        event.stopPropagation();
        await App.pageRanking.applyTagFilter(entry.tag);
      });
      fragment.appendChild(button);
    });

    elements.list.appendChild(fragment);
    App.pageRanking.syncFilterState();
  },

  applyTagFilter: async (tag) => {
    App.state.activeTagFilter = tag;
    const items = await App.spotApi.filterSpotsByTag(tag);
    App.pageMain?.closeBottomSheet?.();
    App.pageMain?.renderMarkers?.(items, { source: 'tag' });
    App.pageMain?.showToast?.(`${tag} 태그 장소만 표시합니다.`);
    App.pageRanking.syncFilterState();
  },

  clearFilter: async () => {
    App.state.activeTagFilter = '';
    await App.pageMain?.renderDefaultMarkers?.();
    App.pageRanking.syncFilterState();
  },

  syncFilterState: () => {
    const elements = App.pageRanking.elements;
    if (!elements?.filterBar) return;
    const activeTag = App.state.activeTagFilter || '';
    const isActive = Boolean(activeTag);
    elements.filterBar.classList.toggle('hidden', !isActive);
    if (elements.filterText) {
      elements.filterText.textContent = isActive ? `현재 필터: ${activeTag}` : '';
    }
    if (elements.subtitle) {
      elements.subtitle.textContent = isActive
        ? '전체 보기 버튼을 누르면 전체 마커로 돌아갑니다.'
        : '해시태그를 클릭하면 해당 태그가 있는 장소만 볼 수 있어요.';
    }
  },
};
