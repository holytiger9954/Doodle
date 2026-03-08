/**
 * 검색 UI 컨트롤러.
 *
 * 개선 포인트:
 * 1) 입력만 하면 끝나는 단순 panTo 가 아니라 검색 결과 드롭다운을 보여준다.
 * 2) 프로젝트 내부 데이터(카테고리 + 사용자 등록 스팟)를 먼저 검색한다.
 * 3) 내부 결과가 부족하면 카카오 장소검색 결과를 함께 섞어 보여준다.
 * 4) 결과 클릭 시 지도 이동 + 상세 바텀시트까지 연결한다.
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
    const feedback = App.dom.qs('#search-feedback', root);
    const resultList = App.dom.qs('#search-result-list', root);
    const emptyElement = App.dom.qs('#search-empty', root);
    const countElement = App.dom.qs('#search-result-count', root);

    if (!searchInput || !submitButton || !dropdown || !resultList || !emptyElement || !countElement) return;
    if (searchInput.dataset.bound === 'true') return;
    searchInput.dataset.bound = 'true';

    App.pageSearch.elements = {
      root: searchRoot,
      input: searchInput,
      submitButton,
      clearButton,
      dropdown,
      feedback,
      resultList,
      emptyElement,
      countElement,
    };

    const runSearch = async () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        App.pageSearch.hideDropdown();
        App.pageSearch.showFeedback('검색어를 입력해주세요.');
        searchInput.focus();
        return;
      }

      App.pageSearch.hideFeedback();

      App.pageSearch.setSearching(true);
      try {
        const results = await App.pageSearch.search(keyword);
        App.pageSearch.renderResults(results, keyword);
      } finally {
        App.pageSearch.setSearching(false);
      }
    };

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
        App.pageSearch.hideFeedback();
      }
    });

    App.dom.on(searchInput, 'input', () => {
      const hasValue = searchInput.value.trim().length > 0;
      if (clearButton) clearButton.classList.toggle('visible', hasValue);
      if (hasValue) App.pageSearch.hideFeedback();
      if (!hasValue) {
        App.pageSearch.hideDropdown();
        App.pageSearch.showFeedback('검색어를 입력하면 장소 추천이 표시됩니다.');
      }
    });

    App.dom.on(submitButton, 'click', runSearch);

    App.dom.on(clearButton, 'click', () => {
      searchInput.value = '';
      clearButton.classList.remove('visible');
      App.pageSearch.hideDropdown();
      App.pageSearch.showFeedback('검색이 초기화되었습니다.');
      if (window.App?.pageMain?.clearSearchState) {
        window.App.pageMain.clearSearchState();
      }
      searchInput.focus();
    });

    App.pageSearch.showFeedback('검색어를 입력하면 장소 추천이 표시됩니다.');

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
    const categoryCollections = [
      ...(App.categoryData.favoriteItems || []),
      ...(App.categoryData.hospitalItems || []),
      ...(App.categoryData.gymItems || []),
      ...(App.categoryData.policeItems || []),
      ...(App.categoryData.smokingItems || []),
      ...(App.categoryData.toiletItems || []),
    ].map((item) => ({
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

  showFeedback: (message) => {
    const feedback = App.pageSearch.elements?.feedback;
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove('hidden');
  },

  hideFeedback: () => {
    const feedback = App.pageSearch.elements?.feedback;
    if (!feedback) return;
    feedback.classList.add('hidden');
    feedback.textContent = '';
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

    if (!results.length) {
      App.pageSearch.showFeedback(`"${keyword}" 검색 결과가 없습니다.`);
      App.dom.setText(elements.emptyElement, `"${keyword}" 검색 결과가 없습니다.`);
      return;
    }

    App.pageSearch.hideFeedback();
    const fragment = document.createDocumentFragment();
    results.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result-item';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      button.innerHTML = `
        <span class="search-result-text">
          <strong>${item.title || '장소 이름'}</strong>
          <small>${item.address || item.description || item.Category || '상세 정보 없음'}</small>
        </span>
        <span class="search-result-badge ${item.source === 'external' ? 'external' : 'internal'}">
          ${item.source === 'external' ? '장소 검색' : '등록 스팟'}
        </span>
      `;
      button.addEventListener('click', () => App.pageSearch.selectResult(item));
      const listItem = document.createElement('li');
      listItem.appendChild(button);
      fragment.appendChild(listItem);
    });
    elements.resultList.appendChild(fragment);
    App.pageSearch.syncActiveResult();
  },

  selectResult: (item) => {
    const { kakaoMapObject, map, mainPage } = App.pageSearch.getHostContext();
    if (!kakaoMapObject || !map) return;

    const target = new kakaoMapObject.maps.LatLng(item.latitude, item.longitude);
    map.panTo(target);
    map.setLevel(App.config.singleMarkerZoomLevel);

    if (mainPage?.renderMarkers) {
      mainPage.renderMarkers([item], { preserveRegistered: true });
    }
    if (window.App?.uiCategorySelector?.clearActive) {
      window.App.uiCategorySelector.clearActive();
    }
    if (mainPage?.openInfoSheet) {
      mainPage.openInfoSheet(item);
    }

    if (App.pageSearch.elements?.input) {
      App.pageSearch.elements.input.value = item.title || '';
    }
    App.pageSearch.hideDropdown();
    App.pageSearch.showFeedback(`"${item.title || '선택한 장소'}" 상세 정보를 열었습니다.`);
  },

  hideDropdown: () => {
    const elements = App.pageSearch.elements;
    if (!elements) return;
    elements.dropdown.classList.add('hidden');
    elements.resultList.innerHTML = '';
    elements.countElement.textContent = '0건';
    App.pageSearch.currentResults = [];
    App.pageSearch.activeIndex = -1;
  },
};

document.addEventListener('DOMContentLoaded', () => App.pageSearch.init());
