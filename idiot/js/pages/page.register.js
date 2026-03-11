/** 장소 등록 iframe 페이지 컨트롤러. */
App.pageRegister = {
  /** DOM 요소 수집 */
  getElements: () => ({
    categorySelect: App.dom.qs('.category'),
    latitudeInput: App.dom.qs('.register-lat'),
    longitudeInput: App.dom.qs('.register-long'),
    titleInput: App.dom.qs('#title'),
    contentInput: App.dom.qs('.register-content'),
    hashtagInput: App.dom.qs('#hashtags'),
    privateCheckbox: App.dom.qs('input.register-private-btn'),
    actionButtons: App.dom.qsa('.register-content-btn'),
  }),

  /** 초기화 */
  init: async () => {
    const elements = App.pageRegister.getElements();
    App.pageRegister.applyCoordinatesFromQuery(elements);
    await App.pageRegister.applyEditStateFromQuery(elements);
    App.pageRegister.bindButtons(elements);
  },

  /** main.html에서 넘긴 lat/lng를 입력칸에 채운다. */
  applyCoordinatesFromQuery: (elements) => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng) {
      elements.latitudeInput.value = lat;
      elements.longitudeInput.value = lng;
    }
  },


  getEditContextFromQuery: () => {
    const params = new URLSearchParams(window.location.search);
    return {
      mode: params.get('mode') || 'create',
      spotId: params.get('spotId') || '',
      source: params.get('source') || 'map',
      openInfo: params.get('openInfo') === 'true',
    };
  },

  applyEditStateFromQuery: async (elements) => {
    const editContext = App.pageRegister.getEditContextFromQuery();
    App.state.registerEditContext = editContext;

    if (editContext.mode !== 'edit' || !editContext.spotId) return;

    const targetSpot = await App.spotApi.findUserSpotByIdentity(editContext.spotId);
    if (!targetSpot) {
      App.toast.show('수정할 장소를 찾지 못했습니다.');
      App.message.postSimpleToParent(App.const.messageType.CLOSE_REGISTER);
      return;
    }

    // [v24 수정 기능]
    // 수정 모드에서는 기존 값으로 폼을 채우고,
    // 위치(identity의 일부)는 변경하지 않도록 좌표 입력을 잠근다.
    elements.categorySelect.value = targetSpot.Category || targetSpot.category || '나만의 스팟';
    elements.latitudeInput.value = String(targetSpot.latitude ?? '');
    elements.longitudeInput.value = String(targetSpot.longitude ?? '');
    elements.latitudeInput.readOnly = true;
    elements.longitudeInput.readOnly = true;
    elements.titleInput.value = targetSpot.title || '';
    elements.contentInput.value = targetSpot.description || '';
    elements.hashtagInput.value = App.spotApi.normalizeHashtags(targetSpot.hashtags || []).join(' ');
    elements.privateCheckbox.checked = App.spotApi.isPrivateSpot(targetSpot);

    const submitButton = elements.actionButtons?.[0];
    if (submitButton) {
      submitButton.textContent = '수정';
    }
    document.title = '장소 수정';
  },

  parseHashtags: (raw = '') => App.spotApi.normalizeHashtags(raw),

  /**
   * 카카오맵 Geocoder 객체를 가져온다.
   *
   * register.html 자체에는 카카오 SDK를 직접 로드하지 않기 때문에,
   * 보통은 부모(main.html) 창에 이미 로드된 kakao 객체를 재사용한다.
   *
   * - window.kakao          : 혹시 현재 창에 직접 로드된 경우
   * - window.parent.kakao   : main.html에서 로드된 SDK를 사용하는 경우(현재 프로젝트 기본 흐름)
   */
  getKakaoGeocoder: () => {
    const kakaoInstance = window.kakao || window.parent?.kakao;
    const Geocoder = kakaoInstance?.maps?.services?.Geocoder;

    if (!Geocoder) {
      return null;
    }

    return new Geocoder();
  },

  /**
   * 좌표를 사람이 읽을 수 있는 주소 문자열로 바꾼다.
   *
   * 왜 등록 시점에 주소를 만들어 저장하나?
   * - 마커 클릭 때마다 주소 API를 다시 호출하지 않아도 된다.
   * - 상세창 / 검색 / 마이페이지에서 같은 주소를 재사용할 수 있다.
   * - 발표 시연 중에도 주소가 더 안정적으로 보인다.
   *
   * 실패해도 등록 자체는 막지 않는다.
   * 주소가 없어도 스팟은 저장되게 하고, 주소만 빈 문자열로 둔다.
   */
  resolveAddressFromCoords: (latitude, longitude) => new Promise((resolve) => {
    const geocoder = App.pageRegister.getKakaoGeocoder();

    // SDK 또는 services 라이브러리를 찾지 못한 경우
    // 주소는 비워 두고 저장 흐름은 그대로 진행한다.
    if (!geocoder) {
      resolve('');
      return;
    }

    geocoder.coord2Address(longitude, latitude, (result, status) => {
      const services = (window.kakao || window.parent?.kakao)?.maps?.services;
      const isOk = status === services?.Status?.OK;

      if (!isOk || !Array.isArray(result) || !result.length) {
        resolve('');
        return;
      }

      const first = result[0] || {};
      const roadAddress = first.road_address?.address_name || '';
      const jibunAddress = first.address?.address_name || '';

      // 도로명 주소가 있으면 우선 사용하고,
      // 없으면 지번 주소를 대체값으로 사용한다.
      resolve(roadAddress || jibunAddress || '');
    });
  }),

  /** 등록/취소 버튼 이벤트 연결 */
  bindButtons: (elements) => {
    elements.actionButtons.forEach((button, index) => {
      App.dom.on(button, 'click', async () => {
        if (index === 0) {
          await App.pageRegister.handleSave(elements);
          return;
        }
        App.toast.show('취소되었습니다');
        App.message.postSimpleToParent(App.const.messageType.CLOSE_REGISTER);
      });
    });
  },

  /**
   * 등록/수정 처리.
   *
   * 여기서는 입력값 수집만 하고,
   * 실제 저장 표준화(ownerId/private/category 보정 등)는 spot.api.js가 담당한다.
   */
  handleSave: async (elements) => {
    const editContext = App.pageRegister.getEditContextFromQuery();
    const hasEmptyField = [
      elements.categorySelect.value,
      elements.latitudeInput.value,
      elements.longitudeInput.value,
      elements.titleInput?.value,
      elements.contentInput.value,
    ].some((value) => !String(value).trim());

    if (hasEmptyField) {
      App.toast.show('저장할 위치 정보를 입력해주세요');
      return;
    }

    const latitude = Number(elements.latitudeInput.value);
    const longitude = Number(elements.longitudeInput.value);
    const hashtags = App.pageRegister.parseHashtags(elements.hashtagInput?.value || '');

    // 수정 모드에서는 기존 주소를 그대로 유지하고,
    // 등록 모드에서만 새 좌표를 주소로 변환해 저장한다.
    const targetSpot = editContext.mode === 'edit'
      ? await App.spotApi.findUserSpotByIdentity(editContext.spotId)
      : null;

    const resolvedAddress = targetSpot?.address
      || await App.pageRegister.resolveAddressFromCoords(latitude, longitude);

    const nextPrivate = Boolean(elements.privateCheckbox.checked);

    const spot = {
      title: elements.titleInput?.value.trim(),
      description: elements.contentInput.value.trim(),
      address: resolvedAddress,
      latitude,
      longitude,
      Category: elements.categorySelect.value,
      private: nextPrivate,
      hashtags,
    };

    if (editContext.mode === 'edit') {
      const result = await App.spotApi.updateMySpot({
        spotId: editContext.spotId,
        ...spot,
      });

      if (!result?.success) {
        App.toast.show(result?.message || '수정하지 못했습니다.');
        return;
      }

      const updatedSpot = result?.data || spot;
      App.toast.show(result.message || '정보가 수정되었습니다.');
      App.message.postToParent(App.const.messageType.UPDATE_SPOT, {
        data: updatedSpot,
        source: editContext.source,
        openInfo: editContext.openInfo,
        message: result.message || '정보가 수정되었습니다.',
      });
      App.message.postSimpleToParent(App.const.messageType.CLOSE_REGISTER);
      return;
    }

    const result = await App.spotApi.saveUserSpot(spot);
    const savedSpot = result?.data || spot;

    App.message.postToParent(App.const.messageType.NEW_MARKER, { data: savedSpot });
    App.toast.show(elements.privateCheckbox.checked ? '비공개 등록되었습니다' : '공개 등록되었습니다');
    App.message.postSimpleToParent(App.const.messageType.CLOSE_REGISTER);
  },
};

document.addEventListener('DOMContentLoaded', App.pageRegister.init);
