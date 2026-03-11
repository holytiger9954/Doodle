/**
 * 검색 UI 컨트롤러.
 * 포커스 시 결과 오버레이를 먼저 띄우고, 그 안에서 안내 문구 -> 실제 검색 결과로 전환한다.
 */
App.pageSearch = {
  // [v15 더보기 수정]
  // maxResults: 내부 검색 총 상한
  // pageSize: 오버레이에 한 번에 보여줄 개수
  maxResults: 30,
  pageSize: 6,
  visibleCount: 6,
  activeIndex: -1,
  currentResults: [],
  currentKeyword: '',

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
    const moreButton = App.dom.qs('#search-more', root);
    const footerElement = App.dom.qs('.search-dropdown-footer', root);

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
      moreButton,
      footerElement,
    };

    const runSearch = async () => {
      // [v11 검색 UX 수정]
      // 엔터/검색 버튼은 "특정 결과 상세 바로 열기"가 아니라
      // "검색 결과 마커만 지도에 표시"하는 동작으로 통일한다.
      const keywords = App.pageSearch.parseKeywords(searchInput.value);
      const displayKeyword = searchInput.value.trim();

      if (!keywords.length) {
        App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
        searchInput.focus();
        return;
      }

      App.pageSearch.setSearching(true);
      try {
        const results = await App.pageSearch.search(keywords);
        App.pageSearch.renderResults(results, displayKeyword);

        // [v21 인증 갱신 보강]
        // 실제로 엔터/검색 버튼으로 지도에 적용된 검색어만 activeSearchKeyword로 기록한다.
        App.state.activeSearchKeyword = displayKeyword;

        App.pageSearch.applySearchResultsToMap(results);

        // [v13 검색 UX 수정]
        // 검색 실행 후에는 입력창 내용은 유지하되,
        // 결과 드롭다운만 닫아서 지도 시야를 확보한다.
        App.pageSearch.hideDropdown();
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

        // [v12 엔터 동작 수정]
        // 엔터는 검색 실행 전용으로 고정한다.
        // 드롭다운이 열려 있고 첫 결과가 선택된 상태여도
        // 자동으로 selectResult()를 호출하지 않는다.
        // 사용자가 결과를 직접 클릭할 때만 정보창이 열린다.
        runSearch();
      }

      if (event.key === 'Escape') {
        App.pageSearch.hideDropdown();
      }
    });

    App.dom.on(searchInput, 'input', async () => {
      // [v9 검색 수정] 단일 검색/다중 검색 모두 동일한 파서 사용.
      const keywords = App.pageSearch.parseKeywords(searchInput.value);
      const displayKeyword = searchInput.value.trim();
      const hasValue = keywords.length > 0;
      if (clearButton) clearButton.classList.toggle('visible', hasValue);

      if (!hasValue) {
        App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
        return;
      }

      App.pageSearch.setSearching(true);
      try {
        const results = await App.pageSearch.search(keywords);
        App.pageSearch.renderResults(results, displayKeyword);
      } finally {
        App.pageSearch.setSearching(false);
      }
    });

    App.dom.on(submitButton, 'click', runSearch);

    App.dom.on(clearButton, 'click', async () => {
      searchInput.value = '';
      clearButton.classList.remove('visible');

      // [v21 인증 갱신 보강]
      // 검색창 비우기는 적용된 검색 상태도 함께 해제한다.
      App.state.activeSearchKeyword = '';

      App.pageSearch.showGuideMessage('검색어를 입력해 원하는 장소를 찾아보세요.');
      if (window.App?.pageMain?.clearSearchState) {
        await window.App.pageMain.clearSearchState();
      }
      searchInput.focus();
    });

    App.dom.on(moreButton, 'click', () => {
      // [v17 더보기 스크롤 수정]
      // 더보기를 누르면 "다음 6개만 교체"가 아니라
      // 기존 6개 + 새 6개가 누적된 목록이 되도록 유지한다.
      // 그리고 사용자가 바로 새로 추가된 결과를 이어서 볼 수 있게
      // 현재 스크롤 위치를 자연스럽게 이어준다.
      const allExpanded = App.pageSearch.visibleCount >= App.pageSearch.currentResults.length;

      if (allExpanded) {
        App.pageSearch.hideDropdown();
        return;
      }

      const listElement = App.pageSearch.elements?.resultList;
      const previousScrollTop = listElement ? listElement.scrollTop : 0;
      const previousScrollHeight = listElement ? listElement.scrollHeight : 0;

      App.pageSearch.visibleCount = Math.min(
        App.pageSearch.visibleCount + App.pageSearch.pageSize,
        App.pageSearch.currentResults.length
      );
      App.pageSearch.renderResults(App.pageSearch.currentResults, App.pageSearch.currentKeyword);

      requestAnimationFrame(() => {
        const nextListElement = App.pageSearch.elements?.resultList;
        if (!nextListElement) return;

        const heightDelta = nextListElement.scrollHeight - previousScrollHeight;
        nextListElement.scrollTop = Math.max(0, previousScrollTop + heightDelta - 8);
      });
    });

    App.dom.on(document, 'click', (event) => {
      if (!App.pageSearch.elements?.root?.contains(event.target)) {
        App.pageSearch.hideDropdown();
      }
    });
  },

  // [v9 검색 수정] 공백으로 여러 검색어를 받을 수 있게 통합 파서 추가
  // 예: "비공개 카페" -> ["비공개", "카페"]
  parseKeywords: (raw = '') => String(raw)
    .trim()
    .split(/\s+/)
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean),

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
      // 내부 검색에서도 다른 사람의 비공개 스팟이 섞이면 안 되므로
      // raw 전체 목록이 아니라 '현재 사용자에게 보이는 스팟'만 가져온다.
      registeredItems = await App.spotApi.listVisibleUserSpots();
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

  searchInternalItems: async (keywords = []) => {
    const normalizedKeywords = Array.isArray(keywords)
      ? keywords.map((keyword) => String(keyword).trim().toLowerCase()).filter(Boolean)
      : App.pageSearch.parseKeywords(keywords);

    const items = await App.pageSearch.getInternalItems();

    return items
      .filter((item) => {
        // [v10 권한 수정]
        // 검색 결과는 "현재 사용자에게 보여도 되는 스팟"만 포함해야 한다.
        // base 데이터는 공개 데이터로 취급하고,
        // 사용자 등록 스팟은 canViewSpot()으로 한 번 더 검증한다.
        const isRegisteredSpot = item.source === 'registered';
        if (isRegisteredSpot && !App.spotApi.canViewSpot(item)) {
          return false;
        }

        const searchText = [
          item.title,
          item.Category,
          item.category,
          item.address,
          item.description,
          item.content,
          ...(item.hashtags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        // [v9 검색 수정] 모든 검색어가 부분 일치하면 결과로 포함한다.
        // 예: "비공개" -> "#비공개5", "#비공개6" 매칭
        // 예: "카페 데이트" -> 두 키워드를 모두 포함한 결과만 매칭
        return normalizedKeywords.every((keyword) => searchText.includes(keyword));
      })
      .map((item) => ({ ...item, matchType: 'internal' }))
      .slice(0, App.pageSearch.maxResults);
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
        resolve(data.map(App.pageSearch.normalizeExternalResult).slice(0, App.pageSearch.maxResults));
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

  search: async (keywords) => {
    const normalizedKeywords = Array.isArray(keywords)
      ? keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
      : App.pageSearch.parseKeywords(keywords);

    const displayKeyword = normalizedKeywords.join(' ').trim();
    const isHashQuery = displayKeyword.startsWith('#');
    const internalResults = await App.pageSearch.searchInternalItems(normalizedKeywords);

    if (isHashQuery || normalizedKeywords.length > 1) {
      // [v9 검색 수정] 해시태그 다중 검색은 내부 스팟 결과 중심으로 처리한다.
      return App.pageSearch.dedupeResults(internalResults).slice(0, App.pageSearch.maxResults);
    }

    const externalResults = await App.pageSearch.searchExternalPlaces(displayKeyword);
    return App.pageSearch.dedupeResults([
      ...internalResults,
      ...externalResults,
    ]).slice(0, App.pageSearch.maxResults);
  },

  showGuideMessage: (message) => {
    const elements = App.pageSearch.elements;
    if (!elements) return;
    App.pageSearch.currentResults = [];
    App.pageSearch.currentKeyword = '';
    App.pageSearch.visibleCount = App.pageSearch.pageSize;
    App.pageSearch.activeIndex = -1;
    elements.resultList.innerHTML = '';
    elements.titleElement.textContent = '검색 안내';
    elements.countElement.textContent = '';
    elements.emptyElement.textContent = message;
    elements.emptyElement.classList.remove('hidden');
    elements.dropdown.classList.remove('hidden');
    elements.root.classList.remove('is-searching');
    if (elements.moreButton) elements.moreButton.classList.add('hidden');
    if (elements.footerElement) elements.footerElement.classList.add('hidden');
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

    const allResults = Array.isArray(results) ? results : [];
    const normalizedKeyword = String(keyword || '').trim();
    const previousKeyword = App.pageSearch.currentKeyword;

    App.pageSearch.currentResults = allResults;
    App.pageSearch.currentKeyword = normalizedKeyword;

    // [v15 더보기 수정]
    // 검색어가 바뀌면 다시 6개부터 보여준다.
    if (previousKeyword !== normalizedKeyword) {
      App.pageSearch.visibleCount = App.pageSearch.pageSize;
    }

    const visibleResults = allResults.slice(0, App.pageSearch.visibleCount);
    App.pageSearch.activeIndex = visibleResults.length ? 0 : -1;
    elements.resultList.innerHTML = '';
    elements.countElement.textContent = `${allResults.length}건`;
    elements.emptyElement.classList.toggle('hidden', allResults.length > 0);
    elements.dropdown.classList.remove('hidden');
    elements.titleElement.textContent = '검색 결과';

    if (!allResults.length) {
      if (elements.moreButton) elements.moreButton.classList.add('hidden');
      if (elements.footerElement) elements.footerElement.classList.add('hidden');
      App.dom.setText(elements.emptyElement, `"${normalizedKeyword}" 검색 결과가 없습니다.`);
      return;
    }

    const fragment = document.createDocumentFragment();
    visibleResults.forEach((item, index) => {
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

    const hasMoreSection = allResults.length > App.pageSearch.pageSize;
    const allExpanded = App.pageSearch.visibleCount >= allResults.length;

    if (elements.moreButton) {
      elements.moreButton.classList.toggle('hidden', !hasMoreSection);
      if (hasMoreSection) {
        elements.moreButton.textContent = allExpanded
          ? '접기'
          : `더보기 (${visibleResults.length}/${allResults.length})`;
      }
    }

    if (elements.footerElement) {
      elements.footerElement.classList.toggle('hidden', !hasMoreSection);
    }

    App.pageSearch.syncActiveResult();
  },

  applySearchResultsToMap: (results = []) => {
    const { mainPage } = App.pageSearch.getHostContext();
    if (!mainPage) return;

    // [v11 검색 UX 수정]
    // 검색 실행(엔터/검색 버튼)은 자동 정보창을 열지 않는다.
    // 검색에 맞는 마커만 지도에 그리고, 결과가 있으면 그 범위로 이동한다.
    mainPage.renderMarkers(results);

    if (results.length === 1) {
      mainPage.focusSpotOnMap?.(results[0]);
      return;
    }

    if (results.length > 1 && typeof mainPage.fitMapToSpots === 'function') {
      mainPage.fitMapToSpots(results);
    }
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

    // [v21 인증 갱신 보강]
    // 특정 결과를 직접 클릭해 단일 마커 보기로 들어간 경우도
    // "현재 적용된 검색 문맥"으로 기록해 인증 상태 변화 시 재계산할 수 있게 한다.
    App.state.activeSearchKeyword = App.pageSearch.elements?.input?.value?.trim?.() || item.title || '';

    // [v11 검색 UX 수정]
    // 드롭다운에서 특정 결과를 직접 클릭한 경우에만
    // 해당 마커로 이동하고 정보창까지 연다.
    mainPage.renderMarkers([item]);
    mainPage.focusSpotOnMap?.(item);
    mainPage.openInfoSheet(item);
  },

  hideDropdown: () => {
    const elements = App.pageSearch.elements;
    if (!elements) return;
    elements.dropdown.classList.add('hidden');
    elements.root.classList.remove('is-searching');
    if (elements.moreButton) elements.moreButton.classList.add('hidden');
    if (elements.footerElement) elements.footerElement.classList.add('hidden');
    App.pageSearch.currentResults = [];
    App.pageSearch.activeIndex = -1;
  },
};
