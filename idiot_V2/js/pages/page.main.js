/**
 * main.html 핵심 컨트롤러.
 * 지도, 마커, 메시지, 랭킹/사이드바 토글을 모두 담당한다.
 */
App.pageMain = {
  init: () => {
    if (!window.kakao?.maps) return;

    kakao.maps.load(() => {
      App.pageMain.createMap();
      App.pageMain.bindMapClickForRegister();
      App.pageMain.bindLocationButton();
      App.pageMain.bindRegisterButton();
      App.pageMain.bindRankingWrapperClick();
    App.pageMain.bindBottomSheetClose();
      App.pageMain.restoreUserSpots();
    });

    App.pageMain.bindWindowMessages();
  },

  createMap: () => {
    const container = App.dom.qs('#map');
    const options = {
      center: new kakao.maps.LatLng(App.config.defaultCenter.lat, App.config.defaultCenter.lng),
      level: 3,
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
      App.state.isRegisterMode = !App.state.isRegisterMode;
      if (App.state.isRegisterMode) {
        App.dom.qs('#ranking-wrapper')?.classList.add('hide');
        saveButton.style.backgroundColor = '#e67e22';
        saveButton.innerText = '📍 지도를 클릭하세요';
        App.state.map.setCursor('crosshair');
        return;
      }
      App.pageMain.resetRegisterMode();
    });
  },

  openRegisterModal: (lat, lng) => {
    const modal = App.dom.qs('#register-modal');
    const iframe = App.dom.qs('#register-iframe');
    if (!modal || !iframe) return;
    iframe.src = `register.html?lat=${lat}&lng=${lng}`;
    modal.classList.remove('hidden');
  },

  resetRegisterMode: () => {
    const saveButton = App.dom.qs('#savebtn');
    App.state.isRegisterMode = false;
    if (saveButton) {
      saveButton.style.backgroundColor = '';
      saveButton.innerText = '📍 장소 등록';
    }
    App.state.map?.setCursor('default');
  },

  restoreUserSpots: async () => {
    const userSpots = await App.spotApi.listUserSpots();
    if (userSpots.length) {
      App.pageMain.renderMarkers(userSpots, { preserveRegistered: true, keepExisting: true });
    }
  },

  bindWindowMessages: () => {
    App.dom.on(window, 'message', (event) => {
      if (event.data === App.const.messageType.CLOSE_REGISTER) {
        App.dom.qs('#register-modal')?.classList.add('hidden');
        App.pageMain.resetRegisterMode();
        return;
      }

      const payload = event.data || {};
      if (payload.type === App.const.messageType.NEW_MARKER) {
        App.pageMain.renderMarkers([payload.data], { preserveRegistered: true });
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
      }
    });
  },

  handleCategorySelect: (index) => {
    const items = App.categoryData.resolveItemsByIndex({ index });
    App.state.activeCategoryIndex = index;
    App.pageMain.closeBottomSheet();
    App.pageMain.renderMarkers(items);
  },

  clearSearchState: async () => {
    App.pageMain.closeBottomSheet();
    if (App.state.activeCategoryIndex >= 0) {
      App.pageMain.handleCategorySelect(App.state.activeCategoryIndex);
      return;
    }

    App.pageMain.clearMarkers({ preserveRegistered: true });
    const defaultItems = App.categoryData.resolveItemsByIndex({ index: 0 });
    if (defaultItems?.length) {
      App.pageMain.renderMarkers(defaultItems, { keepExisting: false, preserveRegistered: true });
    }
    await App.pageMain.restoreUserSpots();
  },

  renderMarkers: (items, options = {}) => {
    const { preserveRegistered = false, keepExisting = false } = options;
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
      const onlyItem = items[0];
      const target = new kakao.maps.LatLng(onlyItem.latitude, onlyItem.longitude);
      App.state.map.panTo(target);
      App.state.map.setLevel(App.config.singleMarkerZoomLevel);
      return;
    }
    App.state.map.setBounds(bounds);
  },

  clearMarkers: (options = {}) => {
    const { preserveRegistered = false } = options;
    App.state.markers.forEach(({ marker }) => {
      const isRegisteredMarker = App.state.registeredMarkers.some((saved) => saved.marker === marker);
      if (preserveRegistered && isRegisteredMarker) return;
      marker.setMap(null);
    });
    App.state.markers = preserveRegistered ? [...App.state.registeredMarkers] : [];
  },

  /**
   * 상세 바텀시트는 단일 info.html 템플릿만 사용한다.
   * 카테고리별 차이는 이미지/문구만 동적으로 채운다.
   */
  openInfoSheet: async (item) => {
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

      if (title) title.textContent = item.title || '장소 이름';
      if (category) category.textContent = item.Category || item.category || categoryMeta.label || '카테고리 정보 없음';
      if (address) address.textContent = item.address ? `주소 : ${item.address}` : '주소 정보가 없습니다.';
      if (description) {
        const fallbackDescription = item.description || item.content || `카테고리 : ${item.Category || categoryMeta.label || '미분류'}`;
        description.textContent = fallbackDescription;
      }
      if (image) {
        image.src = item.image || categoryMeta.image || './img/marker.png';
        image.alt = `${categoryMeta.label || '장소'} 이미지`;
      }

      const closeButton = contentNode.querySelector('.close-btn');
      if (closeButton) closeButton.addEventListener('click', App.pageMain.closeBottomSheet);

      const reportButton = contentNode.querySelector('#report');
      if (reportButton) {
        reportButton.addEventListener('click', () => {
          window.location.href = './report.html';
        });
      }

      const detailButton = contentNode.querySelector('#info-link');
      if (detailButton) {
        detailButton.addEventListener('click', () => {
          alert('상세보기는 추후 연결 예정입니다.');
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
