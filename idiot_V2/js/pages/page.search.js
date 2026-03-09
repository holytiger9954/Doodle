/**
 * 검색 UI 컨트롤러.
 * 포커스 시 결과 오버레이를 먼저 띄우고, 그 안에서 안내 문구 -> 실제 검색 결과로 전환한다.
 */
App.pageSearch = {
  maxResults: 6,
  activeIndex: -1,
  currentResults: [],

  init: (root = document) => {
    const searchRoot = App.dom.qs('.search-inline-root', root) || root;
    const searchInput = App.dom.qs('#search', root);
    const submitButton = App.dom.qs('#search-submit', root) || App.dom.qs('.cursor-pointer', root);
    const clearButton = App.dom.qs('#search-clear', root);
    const dropdown = App.dom.qs('#search-dropdown', root);
    const resultList = App.dom.qs('#search-result-list', root);
    const emptyElement = App.dom.qs('#search-empty', root);
    const countElement = App.dom.qs('#search-result-count', root);
    const titleElement = App.dom.qs('#search-dropdown-title', root);

    if (!searchInput || !submitButton || !dropdown || !resultList || !emptyElement || !countElement || !titleElement) return;
    if (searchInput.dataset.bound === 'true') return;
    searchInput.dataset.bound = 'true';

    App.pageSearch.elements = {
      root: searchRoot,
      input: searchInput,
      submitButton,
      clearButton,
      dropdown,
      resultList,
      emptyElement,
      countElement,
      titleElement,
    };

    const runSearch = async () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
        searchInput.focus();
        return;
      }

      App.pageSearch.setSearching(true);
      try {
        const results = await App.pageSearch.search(keyword);
        App.pageSearch.renderResults(results, keyword);
      } finally {
        App.pageSearch.setSearching(false);
      }
    };

    const openGuideOverlay = () => {
      if (!searchInput.value.trim()) {
        App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
      }
    };

    const focusAndOpenGuide = (event) => {
      if (event?.target?.closest && event.target.closest('#search-clear, #search-submit')) return;
      if (document.activeElement !== searchInput) {
        searchInput.focus();
      }
      openGuideOverlay();
    };

    App.dom.on(searchInput, 'focus', openGuideOverlay);
    App.dom.on(searchInput, 'click', openGuideOverlay);
    App.dom.on(searchInput, 'focusin', openGuideOverlay);
    App.dom.on(searchRoot, 'click', focusAndOpenGuide);
    const parentBox = App.dom.qs('#search-parent', root);
    if (parentBox) {
      App.dom.on(parentBox, 'click', focusAndOpenGuide);
      App.dom.on(parentBox, 'mousedown', (event) => {
        if (event?.target?.closest && event.target.closest('#search-clear, #search-submit')) return;
        event.preventDefault();
      });
    }

    App.dom.on(searchInput, 'keydown', (event) => {
      if (event.key === 'ArrowDown') {
        if (!dropdown.classList.contains('hidden') && App.pageSearch.currentResults.length) {
          event.preventDefault();
          App.pageSearch.moveActive(1);
        }
        return;
      }

      if (event.key === 'ArrowUp') {
        if (!dropdown.classList.contains('hidden') && App.pageSearch.currentResults.length) {
          event.preventDefault();
          App.pageSearch.moveActive(-1);
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (!dropdown.classList.contains('hidden') && App.pageSearch.activeIndex >= 0 && App.pageSearch.currentResults[App.pageSearch.activeIndex]) {
          App.pageSearch.selectResult(App.pageSearch.currentResults[App.pageSearch.activeIndex]);
          return;
        }
        runSearch();
      }

      if (event.key === 'Escape') {
        App.pageSearch.hideDropdown();
      }
    });

    App.dom.on(searchInput, 'input', async () => {
      const keyword = searchInput.value.trim();
      const hasValue = keyword.length > 0;
      if (clearButton) clearButton.classList.toggle('visible', hasValue);

      if (!hasValue) {
        App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
        return;
      }

      App.pageSearch.setSearching(true);
      try {
        const results = await App.pageSearch.search(keyword);
        App.pageSearch.renderResults(results, keyword);
      } finally {
        App.pageSearch.setSearching(false);
      }
    });

    App.dom.on(submitButton, 'click', runSearch);

    App.dom.on(clearButton, 'click', async () => {
      searchInput.value = '';
      clearButton.classList.remove('visible');
      App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
      if (window.App?.pageMain?.clearSearchState) {
        await window.App.pageMain.clearSearchState();
      }
      searchInput.focus();
    });

    App.dom.on(document, 'click', (event) => {
      if (!App.pageSearch.elements?.root?.contains(event.target)) {
        App.pageSearch.hideDropdown();
      }
    });
  },

  setSearching: (isSearching) => {
    const elements = App.pageSearch.elements;
    if (!elements) return;

    elements.root.classList.toggle('is-searching', isSearching);
    elements.submitButton.disabled = isSearching;
    elements.titleElement.textContent = isSearching ? '검색 중' : '검색 결과';
    if (elements.input) {
      elements.input.setAttribute('aria-busy', isSearching ? 'true' : 'false');
    }
  },

  getHostContext: () => {
    const hasParentHost = window.parent && window.parent !== window && window.parent.kakao;
    if (hasParentHost) {
      return {
        kakaoMapObject: window.parent.kakao,
        map: window.parent.App?.state?.map || window.parent.map,
        mainPage: window.parent.App?.pageMain,
      };
    }

    return {
      kakaoMapObject: window.kakao,
      map: window.App?.state?.map || window.map,
      mainPage: window.App?.pageMain,
    };
  },

  getInternalItems: async () => {
    const categoryCollections = App.categoryData.getAllBaseItems().map((item) => ({
      ...item,
      source: 'internal',
      address: item.address || '',
      description: item.description || item.content || `${item.Category || item.category || '장소'} 정보`,
    }));

    let registeredItems = [];
    try {
      registeredItems = await App.spotApi.listUserSpots();
    } catch (error) {
      console.warn('등록 스팟 조회 실패:', error);
    }

    return [...categoryCollections, ...registeredItems.map((item) => ({ ...item, source: 'registered' }))];
  },

  normalizeExternalResult: (place) => ({
    id: `external-${place.id || `${place.x}-${place.y}`}`,
    title: place.place_name,
    latitude: Number(place.y),
    longitude: Number(place.x),
    address: place.road_address_name || place.address_name || '',
    description: place.category_name || place.phone || '카카오 장소 검색 결과',
    category: place.category_group_name || place.category_name || '검색 결과',
    Category: place.category_group_name || place.category_name || '검색 결과',
    placeUrl: place.place_url || '',
    source: 'external',
  }),

  searchInternalItems: async (keyword) => {
    const loweredKeyword = keyword.toLowerCase();
    const items = await App.pageSearch.getInternalItems();

    return items
      .filter((item) => {
        const searchText = [
          item.title,
          item.Category,
          item.category,
          item.address,
          item.description,
          item.content,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchText.includes(loweredKeyword);
      })
      .slice(0, App.pageSearch.maxResults)
      .map((item) => ({ ...item, matchType: 'internal' }));
  },

  searchExternalPlaces: (keyword) => new Promise((resolve) => {
    const { kakaoMapObject, map } = App.pageSearch.getHostContext();
    if (!kakaoMapObject || !map) {
      resolve([]);
      return;
    }

    const placesService = new kakaoMapObject.maps.services.Places();
    placesService.keywordSearch(keyword, (data, status) => {
      if (status === kakaoMapObject.maps.services.Status.OK) {
        resolve(data.slice(0, App.pageSearch.maxResults).map(App.pageSearch.normalizeExternalResult));
        return;
      }
      resolve([]);
    }, {
      location: map.getCenter(),
      radius: 20000,
    });
  }),

  dedupeResults: (items) => {
    const usedKeys = new Set();
    return items.filter((item) => {
      const key = `${item.title}-${item.latitude}-${item.longitude}`;
      if (usedKeys.has(key)) return false;
      usedKeys.add(key);
      return true;
    });
  },

  search: async (keyword) => {
    const [internalResults, externalResults] = await Promise.all([
      App.pageSearch.searchInternalItems(keyword),
      App.pageSearch.searchExternalPlaces(keyword),
    ]);

    return App.pageSearch.dedupeResults([
      ...internalResults,
      ...externalResults,
    ]).slice(0, App.pageSearch.maxResults);
  },

  showGuideMessage: (message) => {
    const elements = App.pageSearch.elements;
    if (!elements) return;
    App.pageSearch.currentResults = [];
    App.pageSearch.activeIndex = -1;
    elements.resultList.innerHTML = '';
    elements.titleElement.textContent = '검색 안내';
    elements.countElement.textContent = '';
    elements.emptyElement.textContent = message;
    elements.emptyElement.classList.remove('hidden');
    elements.dropdown.classList.remove('hidden');
    elements.root.classList.remove('is-searching');
  },

  moveActive: (step) => {
    const total = App.pageSearch.currentResults.length;
    if (!total) return;
    App.pageSearch.activeIndex = (App.pageSearch.activeIndex + step + total) % total;
    App.pageSearch.syncActiveResult();
  },

  syncActiveResult: () => {
    const buttons = App.pageSearch.elements?.resultList?.querySelectorAll('.search-result-item') || [];
    buttons.forEach((button, index) => {
      const isActive = index === App.pageSearch.activeIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) button.scrollIntoView({ block: 'nearest' });
    });
  },

  renderResults: (results, keyword) => {
    const elements = App.pageSearch.elements;
    if (!elements) return;

    App.pageSearch.currentResults = results;
    App.pageSearch.activeIndex = results.length ? 0 : -1;
    elements.resultList.innerHTML = '';
    elements.countElement.textContent = `${results.length}건`;
    elements.emptyElement.classList.toggle('hidden', results.length > 0);
    elements.dropdown.classList.remove('hidden');
    elements.titleElement.textContent = '검색 결과';

    if (!results.length) {
      App.dom.setText(elements.emptyElement, `"${keyword}" 검색 결과가 없습니다.`);
      return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result-item';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

      const isExternal = item.source === 'external';
      button.innerHTML = `
        <span class="search-result-text">
          <strong>${item.title || '이름 없음'}</strong>
          <small>${item.address || item.description || '상세 정보 없음'}</small>
        </span>
        <span class="search-result-badge ${isExternal ? 'external' : 'internal'}">
          ${isExternal ? '장소 검색' : '등록 스팟'}
        </span>
      `;

      App.dom.on(button, 'mouseenter', () => {
        App.pageSearch.activeIndex = index;
        App.pageSearch.syncActiveResult();
      });

      App.dom.on(button, 'click', () => {
        App.pageSearch.selectResult(item);
      });

      fragment.appendChild(button);
    });

    elements.resultList.appendChild(fragment);
    App.pageSearch.syncActiveResult();
  },

  selectResult: (item) => {
    const { mainPage } = App.pageSearch.getHostContext();
    if (!mainPage) return;

    App.pageSearch.hideDropdown();
    if (App.pageSearch.elements?.input) {
      App.pageSearch.elements.input.value = item.title || '';
    }
    if (App.pageSearch.elements?.clearButton) {
      App.pageSearch.elements.clearButton.classList.toggle('visible', Boolean(item.title));
    }

    mainPage.renderMarkers([item]);
    mainPage.openInfoSheet(item);
  },

  hideDropdown: () => {
    const elements = App.pageSearch.elements;
    if (!elements) return;
    elements.dropdown.classList.add('hidden');
    elements.root.classList.remove('is-searching');
    App.pageSearch.currentResults = [];
    App.pageSearch.activeIndex = -1;
  },
};
