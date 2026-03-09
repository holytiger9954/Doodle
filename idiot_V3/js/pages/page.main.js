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
      App.pageMain.bindRankingWrapperClick();
      App.pageMain.bindBottomSheetClose();
      await App.pageMain.renderDefaultMarkers();
      await App.pageRanking?.render?.();
    });

    App.pageMain.bindWindowMessages();
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

  renderDefaultMarkers: async () => {
    App.state.activeCategoryIndex = -1;
    App.state.activeTagFilter = "";
    App.pageRanking?.syncFilterState?.();
    App.pageMain.closeBottomSheet();
    App.pageMain.clearMarkers({ preserveRegistered: false });
    const defaultItems = await App.spotApi.listDefaultVisibleSpots();
    App.pageMain.renderMarkers(defaultItems, { keepExisting: false, preserveRegistered: false, source: 'overview' });
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
        App.pageMain.renderMarkers([payload.data], { keepExisting: true, preserveRegistered: false });
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
      if (payload.type === 'authChanged') {
        App.pageMain.refreshMypageFrame();
        return;
      }
      if (payload.type === App.const.messageType.SPOTS_CHANGED) {
        App.pageMain.closeBottomSheet();
        App.pageMain.refreshMypageFrame();
        if (App.state.activeCategoryIndex >= 0) {
          await App.pageMain.handleCategorySelect(App.state.activeCategoryIndex, { keepActive: true });
        } else {
          await App.pageMain.renderDefaultMarkers();
          await App.pageRanking?.render?.();
        }
        if (payload.message) {
          App.pageMain.showToast(payload.message);
        }
      }
    });
  },

  handleCategorySelect: async (index, options = {}) => {
    const { keepActive = false } = options;
    App.state.activeTagFilter = '';
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
              await App.pageRanking?.applyTagFilter?.(tag);
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

      if (deleteButton) {
        if (!isOwnedSpot) {
          deleteButton.classList.add('hidden');
        } else {
          deleteButton.classList.remove('hidden');
          deleteButton.addEventListener('click', async () => {
            const ok = window.confirm('내가 등록한 이 장소를 삭제할까요?');
            if (!ok) return;
            const result = await App.spotApi.deleteMySpot(item);
            if (!result.success) {
              alert(result.message || '삭제하지 못했습니다.');
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
      const detailCoords = contentNode.querySelector('#detail-coords');
      const detailOwner = contentNode.querySelector('#detail-owner');
      const detailCreated = contentNode.querySelector('#detail-created');
      const detailTags = contentNode.querySelector('#detail-tags');

      if (detailCategory) detailCategory.textContent = item.Category || item.category || categoryMeta.label || '-';
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
        detailButton.addEventListener('click', () => {
          const willOpen = !detailsBox.classList.contains('active');
          detailsBox.classList.toggle('active', willOpen);
          detailButton.textContent = willOpen ? '상세 접기' : '상세보기';
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
