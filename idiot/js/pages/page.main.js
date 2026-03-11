/**
 * main.html 핵심 컨트롤러.
 * 지도, 마커, 메시지, 랭킹/사이드바 토글을 모두 담당한다.
 */
App.pageMain = {
  init: () => {
    if (!window.kakao?.maps) return;

    kakao.maps.load(async () => {
      App.pageMain.createMap();
      App.pageMain.bindMapClickForRegister();
      App.pageMain.bindLocationButton();
      App.pageMain.bindRegisterButton();
      App.pageMain.syncRegisterButtonState();
      App.pageMain.bindRankingWrapperClick();
      App.pageMain.bindBottomSheetClose();

      // [v19 인증 상태 변경 보강]
      // 초기 진입 시점의 인증 상태를 스냅샷으로 저장해 두고,
      // 이후 로그인/로그아웃/재로그인/비밀번호 변경 로그아웃까지
      // "상태가 실제로 바뀌었는지"를 비교하는 기준으로 사용한다.
      App.pageMain.updateAuthStateSnapshot();

      await App.pageMain.renderDefaultMarkers();
      await App.pageRanking?.render?.();
    });

    App.pageMain.bindWindowMessages();
    App.pageMain.bindAuthStateObservers();
  },

  createMap: () => {
    const container = App.dom.qs('#map');
    const options = {
      center: new kakao.maps.LatLng(App.config.defaultCenter.lat, App.config.defaultCenter.lng),
      level: App.config.categoryOverviewMinLevel,
    };
    App.state.map = new kakao.maps.Map(container, options);
    App.state.locationMarker = new kakao.maps.Marker();
    window.map = App.state.map;
  },

  bindMapClickForRegister: () => {
    kakao.maps.event.addListener(App.state.map, 'click', (mouseEvent) => {
      if (!App.state.isRegisterMode) return;
      const latlng = mouseEvent.latLng;
      App.pageMain.openRegisterModal(latlng.getLat(), latlng.getLng());
    });
  },

  bindLocationButton: () => {
    const locationButton = App.dom.qs('#mylocation');
    App.dom.on(locationButton, 'click', () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((position) => {
        const currentLatLng = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);
        App.state.map.panTo(currentLatLng);
        App.state.locationMarker.setPosition(currentLatLng);
        App.state.locationMarker.setMap(App.state.map);
      });
    });
  },

  bindRegisterButton: () => {
    const saveButton = App.dom.qs('#savebtn');
    App.dom.on(saveButton, 'click', () => {
      if (!App.storage.isLoggedIn()) {
        App.pageMain.resetRegisterMode();
        App.uiModal?.open('login');
        App.pageMain.showToast('로그인 후 장소를 등록할 수 있어요.');
        return;
      }

      App.state.isRegisterMode = !App.state.isRegisterMode;
      if (App.state.isRegisterMode) {
        App.dom.qs('#ranking-wrapper')?.classList.add('hide');
        saveButton.style.backgroundColor = '#e67e22';
        saveButton.innerText = '📍 지도를 클릭하세요';
        saveButton.classList.remove('is-locked');
        saveButton.removeAttribute('aria-disabled');
        saveButton.title = '지도에서 원하는 위치를 클릭해 등록하세요';
        App.state.map.setCursor('crosshair');
        return;
      }
      App.pageMain.resetRegisterMode();
    });

    App.dom.on(window, 'focus', () => {
      App.pageMain.syncRegisterButtonState();
    });

    App.dom.on(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        App.pageMain.syncRegisterButtonState();
      }
    });
  },

  syncRegisterButtonState: () => {
    const saveButton = App.dom.qs('#savebtn');
    if (!saveButton) return;

    const isLoggedIn = App.storage.isLoggedIn();
    saveButton.classList.toggle('is-locked', !isLoggedIn && !App.state.isRegisterMode);
    saveButton.setAttribute('aria-disabled', String(!isLoggedIn));
    saveButton.title = isLoggedIn
      ? '장소를 등록하려면 눌러주세요'
      : '로그인 후 장소를 등록할 수 있어요';

    if (!isLoggedIn) {
      App.pageMain.resetRegisterMode();
    }
  },

  openRegisterModal: (lat, lng, options = {}) => {
    const modal = App.dom.qs('#register-modal');
    const iframe = App.dom.qs('#register-iframe');
    if (!modal || !iframe) return;

    const params = new URLSearchParams({
      lat: String(lat ?? ''),
      lng: String(lng ?? ''),
    });

    if (options.mode) params.set('mode', options.mode);
    if (options.spotId) params.set('spotId', options.spotId);
    if (options.source) params.set('source', options.source);
    if (options.openInfo) params.set('openInfo', 'true');

    iframe.src = `register.html?${params.toString()}`;
    modal.classList.remove('hidden');
  },

  openEditSpotModal: (spot, options = {}) => {
    if (!spot || !App.spotApi.isOwnedByCurrentUser(spot)) {
      App.pageMain.showToast('내가 등록한 장소만 수정할 수 있어요.');
      return;
    }

    // [v24 수정 기능]
    // 수정 모달은 기존 등록 모달을 재사용한다.
    // 정보창에서 진입한 경우에는 먼저 바텀시트를 닫아 오버레이 겹침을 막는다.
    App.state.activeEditingSpotId = App.spotApi.getSpotStableId(spot);
    App.pageMain.closeBottomSheet();

    window.requestAnimationFrame(() => {
      App.pageMain.openRegisterModal(spot.latitude, spot.longitude, {
        mode: 'edit',
        spotId: App.state.activeEditingSpotId,
        source: options.source || 'info',
        openInfo: options.openInfo === true,
      });
    });
  },

  resetRegisterMode: () => {
    const saveButton = App.dom.qs('#savebtn');
    App.state.isRegisterMode = false;
    if (saveButton) {
      saveButton.style.backgroundColor = '';
      saveButton.innerText = '📍 장소 등록';
      const isLoggedIn = App.storage.isLoggedIn();
      saveButton.classList.toggle('is-locked', !isLoggedIn);
      saveButton.setAttribute('aria-disabled', String(!isLoggedIn));
      saveButton.title = isLoggedIn
        ? '장소를 등록하려면 눌러주세요'
        : '로그인 후 장소를 등록할 수 있어요';
    }
    App.state.map?.setCursor('default');
  },


  getAuthStateSnapshot: () => {
    // [v19 인증 상태 변경 보강]
    // 단순 로그인 여부뿐 아니라 "누가 로그인했는지"까지 함께 본다.
    // 그래야 A -> 로그아웃 -> B 로그인뿐 아니라
    // A -> B 바로 재로그인처럼 사용자 자체가 바뀌는 경우도 감지할 수 있다.
    const savedUser = App.storage.getSavedUser?.() || {};
    const isLoggedIn = App.storage.isLoggedIn?.() === true;
    const loginId = savedUser?.loginId || '';
    return `${isLoggedIn ? '1' : '0'}::${loginId}`;
  },

  updateAuthStateSnapshot: () => {
    App.state.lastAuthStateSnapshot = App.pageMain.getAuthStateSnapshot();
  },

  handleAuthStateChanged: async () => {
    // [v19 인증 상태 변경 보강]
    // 인증 상태가 바뀌면 현재 화면 문맥(검색/카테고리/태그)을 최대한 유지하면서
    // 지도, 랭킹, 마이페이지 iframe을 함께 다시 맞춘다.
    await App.pageMain.refreshVisibleMapStateAfterAuthChange();
    await App.pageRanking?.render?.();
    App.pageMain.refreshMypageFrame();
    App.pageMain.updateAuthStateSnapshot();
  },

  bindAuthStateObservers: () => {
    // [v19 인증 상태 변경 보강]
    // postMessage가 빠지더라도 브라우저 포커스 복귀/탭 재활성화 시
    // 실제 인증 상태 변화가 있었는지 다시 확인한다.
    const checkAuthStateChange = async () => {
      const previousSnapshot = App.state.lastAuthStateSnapshot || '';
      const currentSnapshot = App.pageMain.getAuthStateSnapshot();

      if (previousSnapshot === currentSnapshot) return;
      await App.pageMain.handleAuthStateChanged();
    };

    App.dom.on(window, 'focus', checkAuthStateChange);
    App.dom.on(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAuthStateChange();
      }
    });
    App.dom.on(window, 'pageshow', checkAuthStateChange);
  },

  renderDefaultMarkers: async () => {
    App.state.activeCategoryIndex = -1;
    App.state.activeTagFilter = "";
    App.state.activeTagFilters = [];
    App.pageRanking?.syncFilterState?.();
    App.pageMain.closeBottomSheet();
    App.pageMain.clearMarkers({ preserveRegistered: false });
    const defaultItems = await App.spotApi.listDefaultVisibleSpots();
    App.pageMain.renderMarkers(defaultItems, { keepExisting: false, preserveRegistered: false, source: 'overview' });
  },

  /**
   * [v18 인증 후 마커 갱신]
   * 로그인/로그아웃 직후 현재 화면 문맥을 최대한 유지하면서
   * 공개/비공개 정책이 다시 반영되도록 마커를 재계산한다.
   *
   * 중요:
   * - 무조건 초기 화면으로 돌리지 않는다.
   * - 현재 검색 / 태그 필터 / 카테고리 선택 상태를 우선 복원한다.
   * - 그래야 기존 잘 되던 UX를 망가뜨리지 않고 권한만 갱신할 수 있다.
   */
  refreshVisibleMapStateAfterAuthChange: async () => {
    App.pageMain.syncRegisterButtonState();
    App.pageMain.closeBottomSheet();

    // 1) "실제로 적용된 검색 상태"가 있을 때만 현재 검색 결과를 다시 계산한다.
    // [v21 인증 갱신 보강]
    // 입력창에 글자만 남아 있다고 해서 무조건 검색 상태로 보면,
    // 로그인 직후 기본 마커 대신 예전 검색 결과가 계속 남아 있을 수 있다.
    // 그래서 단순 input 값이 아니라 activeSearchKeyword 기준으로만 복원한다.
    const activeSearchKeyword = String(App.state.activeSearchKeyword || '').trim();
    if (activeSearchKeyword) {
      const keywords = App.pageSearch.parseKeywords(activeSearchKeyword);
      if (keywords.length) {
        const results = await App.pageSearch.search(keywords);
        App.pageSearch.applySearchResultsToMap(results);
        return;
      }
    }

    // 2) 태그 필터가 켜져 있으면 현재 사용자 기준으로 다시 필터링한다.
    if (Array.isArray(App.state.activeTagFilters) && App.state.activeTagFilters.length) {
      const items = await App.spotApi.filterSpotsByTag(App.state.activeTagFilters);
      App.pageMain.renderMarkers(items, { source: 'tag' });
      App.pageRanking?.syncFilterState?.();
      return;
    }

    // 3) 카테고리 선택 중이면 같은 카테고리를 다시 렌더링한다.
    if (typeof App.state.activeCategoryIndex === 'number' && App.state.activeCategoryIndex >= 0) {
      if (App.state.activeCategoryIndex === 6 && !App.storage.isLoggedIn()) {
        // '나만의 스팟' 상태에서 로그아웃한 경우는 기본 화면으로 안전하게 복귀한다.
        await App.pageMain.renderDefaultMarkers();
        await App.pageRanking?.render?.();
        return;
      }

      await App.pageMain.handleCategorySelect(App.state.activeCategoryIndex, { keepActive: true });
      return;
    }

    // 4) 별도 상태가 없으면 기본 공개/비공개 정책만 다시 반영한다.
    await App.pageMain.renderDefaultMarkers();
  },

  bindWindowMessages: () => {
    App.dom.on(window, 'message', async (event) => {
      if (event.data === App.const.messageType.CLOSE_REGISTER) {
        App.dom.qs('#register-modal')?.classList.add('hidden');
        App.pageMain.resetRegisterMode();
        return;
      }

      const payload = event.data || {};
      if (payload.type === App.const.messageType.NEW_MARKER) {
        // 등록 직후에도 공개/비공개 정책을 한 번 더 통과시킨다.
        // 예: 저장은 되었지만 현재 사용자 기준으로 보이면 안 되는 데이터라면 지도에 바로 뿌리지 않는다.
        const newSpot = payload.data;
        if (App.spotApi.canViewSpot(newSpot)) {
          App.pageMain.renderMarkers([newSpot], { keepExisting: true, preserveRegistered: false });
        }
        App.pageMain.refreshMypageFrame();
        await App.pageRanking?.render?.();
        return;
      }
      if (payload.type === App.const.messageType.SELECT_LOCATION) {
        App.pageMain.renderMarkers([payload.data]);
        App.dom.qs('#ranking-wrapper')?.classList.add('hide');
        App.pageMain.toggleSidebar();
        return;
      }
      if (payload.type === App.const.messageType.SELECT_CATEGORY) {
        App.pageMain.handleCategorySelect(payload.index);
        return;
      }
      if (payload.type === App.const.messageType.OPEN_MODAL) {
        App.uiModal?.openFromMessage(payload);
        return;
      }
      if (payload.type === App.const.messageType.OPEN_EDIT_SPOT) {
        App.pageMain.openEditSpotModal(payload.data, {
          source: payload.source || 'mypage',
          openInfo: payload.openInfo === true,
        });
        return;
      }
      if (payload.type === App.const.messageType.UPDATE_SPOT) {
        App.pageMain.closeBottomSheet();
        await App.pageMain.refreshVisibleMapStateAfterSpotMutation();

        if (payload.message) {
          App.pageMain.showToast(payload.message);
        }

        if (payload.openInfo && payload.data && App.spotApi.canViewSpot(payload.data)) {
          App.pageMain.focusSpotOnMap(payload.data);
          await App.pageMain.openInfoSheet(payload.data);
        }
        return;
      }
      if (payload.type === 'authChanged') {
        // [v19 인증 상태 변경 보강]
        // 로그인 -> 로그아웃, 로그아웃 -> 로그인, A -> B 재로그인,
        // 비밀번호 변경 후 세션 종료까지 모두 같은 "인증 상태 변경"으로 본다.
        await App.pageMain.handleAuthStateChanged();
        return;
      }
      if (payload.type === App.const.messageType.SPOTS_CHANGED) {
        App.pageMain.closeBottomSheet();
        await App.pageMain.refreshVisibleMapStateAfterSpotMutation();
        if (payload.message) {
          App.pageMain.showToast(payload.message);
        }
      }
    });
  },

  handleCategorySelect: async (index, options = {}) => {
    const { keepActive = false } = options;
    // [v21 인증 갱신 보강]
    // 카테고리 선택은 검색 문맥을 끝내고 새 문맥으로 들어가는 동작이다.
    App.state.activeSearchKeyword = '';
    App.state.activeTagFilter = '';
    App.state.activeTagFilters = [];
    App.pageRanking?.syncFilterState?.();

    let items = [];
    if (index === 6) {
      if (!App.storage.isLoggedIn()) {
        if (!keepActive) {
          App.uiCategorySelector?.clearActive?.();
        }
        App.uiModal?.open('login');
        App.pageMain.showToast('로그인 후 나만의 스팟을 볼 수 있어요.');
        return;
      }
      items = await App.spotApi.listMySpots();
    } else {
      items = App.categoryData.resolveItemsByIndex({ index });
    }

    App.state.activeCategoryIndex = index;
    App.pageMain.closeBottomSheet();
    App.pageMain.renderMarkers(items, { source: 'category' });
  },

  clearSearchState: async () => {
    // [v21 인증 갱신 보강]
    // 검색 해제 시에는 입력값과 별개로 "실제로 적용된 검색 상태"도 함께 비운다.
    App.state.activeSearchKeyword = '';
    await App.pageMain.renderDefaultMarkers();
  },

  renderMarkers: (items, options = {}) => {
    const { preserveRegistered = false, keepExisting = false, source = 'default' } = options;
    const bounds = new kakao.maps.LatLngBounds();

    if (!keepExisting) {
      App.pageMain.clearMarkers({ preserveRegistered });
    }

    const createdMarkers = items.map((item) => {
      const position = new kakao.maps.LatLng(item.latitude, item.longitude);
      const marker = new kakao.maps.Marker({ position, map: App.state.map });
      kakao.maps.event.addListener(marker, 'click', () => {
        App.pageMain.openInfoSheet(item);
      });
      bounds.extend(position);
      return { marker, item };
    });

    App.state.markers.push(...createdMarkers);
    if (preserveRegistered) {
      App.state.registeredMarkers.push(...createdMarkers);
    }

    if (!items.length) return;

    if (items.length === 1) {
      const singleSpotLevel = source === 'category' || source === 'overview'
        ? App.config.categorySingleSpotZoomLevel
        : App.config.singleMarkerZoomLevel;
      App.pageMain.focusSpotOnMap(items[0], { level: singleSpotLevel });
      return;
    }

    App.state.map.setBounds(bounds);

    if (source === 'category' || source === 'overview') {
      window.setTimeout(() => {
        const currentLevel = App.state.map.getLevel();
        if (currentLevel < App.config.categoryOverviewMinLevel) {
          App.state.map.setLevel(App.config.categoryOverviewMinLevel);
        }
      }, 120);
    }
  },

  clearMarkers: (options = {}) => {
    const { preserveRegistered = false } = options;
    App.state.markers.forEach(({ marker }) => {
      const isRegisteredMarker = App.state.registeredMarkers.some((saved) => saved.marker === marker);
      if (preserveRegistered && isRegisteredMarker) return;
      marker.setMap(null);
    });
    App.state.markers = preserveRegistered ? [...App.state.registeredMarkers] : [];
    if (!preserveRegistered) {
      App.state.registeredMarkers = [];
    }
  },

  /**
   * 상세 팝업은 단일 info.html 템플릿만 사용한다.
   * 카테고리별 차이는 이미지/문구만 동적으로 채운다.
   */
  openInfoSheet: async (item) => {
    // 상세 팝업 단계에서도 한 번 더 확인한다.
    // 지도/검색에서 필터가 누락되더라도 최종 진입 지점에서 비공개 우회를 줄이기 위함이다.
    if (!App.spotApi.canViewSpot(item)) {
      App.pageMain.showToast('이 장소는 현재 사용자에게 공개되지 않았습니다.');
      return;
    }

    const categoryMeta = App.categoryData.findCategoryMeta(item);
    try {
      const response = await fetch('./info.html');
      const html = await response.text();
      const sheet = App.dom.qs('#bottom-sheet');
      const dataContainer = App.dom.qs('#sheet-data');
      if (!sheet || !dataContainer) return;

      const parser = new DOMParser();
      const parsed = parser.parseFromString(html, 'text/html');
      const contentNode = document.createElement('div');
      contentNode.innerHTML = (parsed.body && parsed.body.innerHTML ? parsed.body.innerHTML : html).trim();

      const title = contentNode.querySelector('#info-title');
      const category = contentNode.querySelector('#info-category');
      const address = contentNode.querySelector('#info-address');
      const description = contentNode.querySelector('#info-desc');
      const image = contentNode.querySelector('#info-image');
      const owner = contentNode.querySelector('#info-owner');
      const tagsBox = contentNode.querySelector('#info-tags');
      const resolvedAddress = await App.pageMain.ensureSpotAddress(item);
      const safeAddress = String(resolvedAddress || item.address || '').trim();
      const descriptionText = String(item.description || item.content || '').trim();
      const visibleTitle = String(item.title || '').trim() || `${item.Category || categoryMeta.label || '장소'} 정보`;

      if (title) title.textContent = visibleTitle;
      if (category) category.textContent = item.Category || item.category || categoryMeta.label || '카테고리 정보 없음';
      if (address) address.textContent = safeAddress ? `📍 ${safeAddress}` : '📍 주소 정보가 없습니다.';
      if (description) {
        const fallbackDescription = descriptionText || `카테고리 : ${item.Category || categoryMeta.label || '미분류'}`;
        description.textContent = fallbackDescription;
      }
      if (image) {
        image.src = item.image || categoryMeta.image || './img/marker.png';
        image.alt = `${categoryMeta.label || '장소'} 이미지`;
      }
      if (owner) {
        if (item.ownerNickname) {
          owner.textContent = `등록자 : ${item.ownerNickname}`;
          owner.classList.remove('hidden');
        } else {
          owner.classList.add('hidden');
        }
      }
      if (tagsBox) {
        const tags = App.spotApi.normalizeHashtags(item.hashtags || []);
        tagsBox.innerHTML = '';
        if (tags.length) {
          tagsBox.classList.remove('hidden');
          tags.forEach((tag) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'info-tag-chip';
            chip.textContent = tag;
            chip.addEventListener('click', async () => {
              App.state.activeTagFilters = [tag];
              App.state.activeTagFilter = tag;
              const items = await App.spotApi.filterSpotsByTag([tag]);
              App.pageMain.renderMarkers(items, { source: 'tag' });
              App.pageRanking?.syncFilterState?.();
              App.pageMain.closeBottomSheet();
            });
            tagsBox.appendChild(chip);
          });
        } else {
          tagsBox.classList.add('hidden');
        }
      }

      const closeButton = contentNode.querySelector('.close-btn');
      if (closeButton) closeButton.addEventListener('click', App.pageMain.closeBottomSheet);

      const reportButton = contentNode.querySelector('#report');
      if (reportButton) {
        reportButton.addEventListener('click', () => {
          App.uiModal?.open('report', { item });
        });
      }

      const favoriteButton = contentNode.querySelector('#favorite-toggle');
      const editButton = contentNode.querySelector('#edit-spot');
      const deleteButton = contentNode.querySelector('#delete-spot');
      const isOwnedSpot = App.spotApi.isOwnedByCurrentUser(item);

      if (favoriteButton) {
        if (isOwnedSpot) {
          favoriteButton.classList.add('hidden');
        } else {
          const syncFavoriteButton = async () => {
            const isFavorite = await App.spotApi.isFavoriteSpot(item);
            favoriteButton.textContent = isFavorite ? '찜해제' : '찜하기';
            favoriteButton.classList.toggle('is-favorite', isFavorite);
          };

          await syncFavoriteButton();

          favoriteButton.addEventListener('click', async () => {
            if (!App.storage.isLoggedIn()) {
              App.uiModal?.open('login');
              return;
            }
            const result = await App.spotApi.toggleFavoriteSpot(item);
            if (!result.success) return;
            await syncFavoriteButton();
            App.pageMain.refreshMypageFrame();
          });
        }
      }

      if (editButton) {
        if (!isOwnedSpot) {
          editButton.classList.add('hidden');
        } else {
          editButton.classList.remove('hidden');
          editButton.addEventListener('click', () => {
            App.pageMain.openEditSpotModal(item, { source: 'info', openInfo: true });
          });
        }
      }

      if (deleteButton) {
        if (!isOwnedSpot) {
          deleteButton.classList.add('hidden');
        } else {
          deleteButton.classList.remove('hidden');
          deleteButton.addEventListener('click', async () => {
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
            App.pageMain.closeBottomSheet();
            await App.pageMain.renderDefaultMarkers();
      await App.pageRanking?.render?.();
            App.pageMain.refreshMypageFrame();
            App.pageMain.showToast(result.message || '삭제되었습니다.');
          });
        }
      }

      const detailsBox = contentNode.querySelector('#info-details');
      const detailCategory = contentNode.querySelector('#detail-category');
      const detailAddress = contentNode.querySelector('#detail-address');
      const detailVisibility = contentNode.querySelector('#detail-visibility');
      const detailCoords = contentNode.querySelector('#detail-coords');
      const detailOwner = contentNode.querySelector('#detail-owner');
      const detailCreated = contentNode.querySelector('#detail-created');
      const detailTags = contentNode.querySelector('#detail-tags');

      if (detailCategory) detailCategory.textContent = item.Category || item.category || categoryMeta.label || '-';
      if (detailAddress) detailAddress.textContent = safeAddress || '주소 정보가 없습니다.';
      if (detailVisibility) {
        const isPrivate = App.spotApi.isPrivateSpot(item);
        detailVisibility.textContent = isPrivate ? '비공개 (등록자만 확인 가능)' : '공개';
      }
      if (detailCoords) detailCoords.textContent = `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}`;
      if (detailOwner) detailOwner.textContent = item.ownerNickname || '공용 기본 데이터';
      if (detailCreated) {
        const created = item.createdAt ? new Date(item.createdAt) : null;
        detailCreated.textContent = created && !Number.isNaN(created.getTime())
          ? created.toLocaleDateString('ko-KR')
          : '기본 제공 데이터';
      }
      if (detailTags) {
        const detailTagList = App.spotApi.normalizeHashtags(item.hashtags || []);
        detailTags.textContent = detailTagList.length ? detailTagList.join('  ') : '해시태그 없음';
      }

      const detailButton = contentNode.querySelector('#info-link');
      if (detailButton && detailsBox) {
        detailsBox.hidden = true;
        detailsBox.classList.remove('active');
        detailButton.setAttribute('aria-expanded', 'false');
        detailButton.textContent = '추가정보';

        detailButton.addEventListener('click', () => {
          const willOpen = detailsBox.hidden;
          detailsBox.hidden = !willOpen;
          detailsBox.classList.toggle('active', willOpen);
          detailButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
          detailButton.textContent = willOpen ? '접기' : '추가정보';

          if (willOpen) {
            requestAnimationFrame(() => {
              const scrollContainer = contentNode.querySelector('.info-body')
                || detailsBox.closest('.info-body')
                || detailsBox.closest('.info-window.dd-auth-box')
                || detailsBox.closest('.sheet-content')
                || detailsBox.parentElement;

              if (!scrollContainer) return;

              const nextTop = Math.max(0, detailsBox.offsetTop - 12);
              scrollContainer.scrollTo({
                top: nextTop,
                behavior: 'smooth',
              });
            });
          }
        });
      }

      dataContainer.innerHTML = '';
      dataContainer.appendChild(contentNode);
      sheet.classList.add('active');
      App.dom.qs('#bottom-sheet-backdrop')?.classList.add('active');
      document.body.classList.add('sheet-open');
      window.closeOverlay = App.pageMain.closeBottomSheet;
    } catch (error) {
      console.error('정보창 파일 로드 중 오류 발생:', error);
    }
  },

  getKakaoGeocoder: () => {
    const Geocoder = window.kakao?.maps?.services?.Geocoder;
    if (!Geocoder) return null;
    return new Geocoder();
  },

  resolveAddressFromCoords: (latitude, longitude) => new Promise((resolve) => {
    const geocoder = App.pageMain.getKakaoGeocoder();
    if (!geocoder) {
      resolve('');
      return;
    }

    geocoder.coord2Address(longitude, latitude, (result, status) => {
      const services = window.kakao?.maps?.services;
      const isOk = status === services?.Status?.OK;

      if (!isOk || !Array.isArray(result) || !result.length) {
        resolve('');
        return;
      }

      const first = result[0] || {};
      const roadAddress = first.road_address?.address_name || '';
      const jibunAddress = first.address?.address_name || '';
      resolve(roadAddress || jibunAddress || '');
    });
  }),

  ensureSpotAddress: async (item = {}) => {
    const currentAddress = String(item.address || '').trim();
    if (currentAddress) return currentAddress;

    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';

    const resolvedAddress = await App.pageMain.resolveAddressFromCoords(latitude, longitude);
    if (resolvedAddress) {
      item.address = resolvedAddress;
    }
    return resolvedAddress;
  },

  focusSpotOnMap: (item, options = {}) => {
    const lat = Number(item?.latitude);
    const lng = Number(item?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !App.state.map) return;

    const target = new kakao.maps.LatLng(lat, lng);
    App.state.map.setLevel(options.level || App.config.singleMarkerZoomLevel);
    App.state.map.setCenter(target);
    App.state.map.panTo(target);

    // pan 애니메이션이나 레벨 변경 직후 중심이 약간 어긋나는 경우가 있어 한 번 더 고정한다.
    window.clearTimeout(App.state.focusTimer);
    App.state.focusTimer = window.setTimeout(() => {
      App.state.map?.setCenter(target);
    }, 220);
  },

  showToast: (message = '') => {
    const toast = App.dom.qs('#app-toast');
    if (!toast || !message) return;
    toast.textContent = message;
    toast.classList.add('active');
    window.clearTimeout(App.state.toastTimer);
    App.state.toastTimer = window.setTimeout(() => {
      toast.classList.remove('active');
    }, 1800);
  },

  closeBottomSheet: () => {
    App.dom.qs('#bottom-sheet')?.classList.remove('active');
    App.dom.qs('#bottom-sheet-backdrop')?.classList.remove('active');
    document.body.classList.remove('sheet-open');
  },

  bindBottomSheetClose: () => {
    App.dom.on(document, 'keydown', (event) => {
      if (event.key === 'Escape') {
        App.pageMain.closeBottomSheet();
      }
    });

    App.dom.on(App.dom.qs('#bottom-sheet-backdrop'), 'click', () => {
      App.pageMain.closeBottomSheet();
    });
  },

  bindRankingWrapperClick: () => {
    const rankingWrapper = App.dom.qs('#ranking-wrapper');
    App.dom.on(rankingWrapper, 'click', () => {
      if (rankingWrapper.classList.contains('hide')) {
        rankingWrapper.classList.remove('hide');
      }
    });
  },

  refreshMypageFrame: () => {
    const frame = App.dom.qs('#side-mypage iframe');
    if (frame?.contentWindow) {
      frame.contentWindow.location.reload();
    }
  },

  refreshVisibleMapStateAfterSpotMutation: async () => {
    // [v24 수정 기능]
    // 스팟 수정/삭제 이후에도 현재 화면 문맥(검색/태그/카테고리)을 최대한 유지한다.
    await App.pageMain.refreshVisibleMapStateAfterAuthChange();
    await App.pageRanking?.render?.();
    App.pageMain.refreshMypageFrame();
  },

  toggleSidebar: () => {
    App.dom.toggleClass(App.dom.qs('#side-mypage'), 'active');
    App.dom.toggleClass(App.dom.qs('#sidebar-overlay'), 'active');
  },

  toggleRanking: (event) => {
    if (event) event.stopPropagation();
    App.dom.toggleClass(App.dom.qs('#ranking-wrapper'), 'hide');
  },
};

window.closeBottomSheet = App.pageMain.closeBottomSheet;
window.toggleSidebar = App.pageMain.toggleSidebar;
window.toggleRanking = App.pageMain.toggleRanking;

document.addEventListener('DOMContentLoaded', App.pageMain.init);
