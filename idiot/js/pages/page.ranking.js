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
      button.dataset.tag = entry.tag;
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
    const nextTags = new Set(App.state.activeTagFilters || []);
    if (nextTags.has(tag)) {
      nextTags.delete(tag);
    } else {
      nextTags.add(tag);
    }

    App.state.activeTagFilters = Array.from(nextTags);
    App.state.activeTagFilter = App.state.activeTagFilters[0] || '';

    if (!App.state.activeTagFilters.length) {
      await App.pageRanking.clearFilter();
      return;
    }

    const items = await App.spotApi.filterSpotsByTag(App.state.activeTagFilters);
    App.pageMain?.closeBottomSheet?.();
    App.pageMain?.renderMarkers?.(items, { source: 'tag' });
    App.pageMain?.showToast?.(`${App.state.activeTagFilters.join(', ')} 태그 필터 적용`);
    App.pageRanking.syncFilterState();
  },

  clearFilter: async () => {
    App.state.activeTagFilter = '';
    App.state.activeTagFilters = [];
    await App.pageMain?.renderDefaultMarkers?.();
    App.pageRanking.syncFilterState();
  },

  syncFilterState: () => {
    const elements = App.pageRanking.elements;
    if (!elements?.filterBar) return;
    const activeTags = App.state.activeTagFilters || [];
    const isActive = activeTags.length > 0;
    elements.filterBar.classList.toggle('hidden', !isActive);
    if (elements.filterText) {
      elements.filterText.innerHTML = '';
      activeTags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'ranking-filter-chip';
        chip.innerHTML = `${tag} <button type="button" aria-label="${tag} 제거">×</button>`;
        const removeButton = chip.querySelector('button');
        if (removeButton) {
          App.dom.on(removeButton, 'click', async (event) => {
            event.stopPropagation();
            await App.pageRanking.applyTagFilter(tag);
          });
        }
        elements.filterText.appendChild(chip);
      });
    }
    App.dom.qsa('.ranking-item', elements.root).forEach((item) => {
      item.classList.toggle('active', activeTags.includes(item.dataset.tag));
    });
    if (elements.subtitle) {
      elements.subtitle.textContent = isActive
        ? '여러 해시태그를 함께 선택해 필터링할 수 있어요.'
        : '해시태그를 클릭하면 해당 태그가 있는 장소만 볼 수 있어요.';
    }
  },
};
