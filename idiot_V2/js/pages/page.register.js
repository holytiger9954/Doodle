/** 장소 등록 iframe 페이지 컨트롤러. */
App.pageRegister = {
  /** DOM 요소 수집 */
  getElements: () => ({
    categorySelect: App.dom.qs('.category'),
    latitudeInput: App.dom.qs('.register-lat'),
    longitudeInput: App.dom.qs('.register-long'),
    contentInput: App.dom.qs('.register-content'),
    privateCheckbox: App.dom.qs('.register-private-btn'),
    actionButtons: App.dom.qsa('.register-content-btn'),
  }),

  /** 초기화 */
  init: () => {
    const elements = App.pageRegister.getElements();
    App.pageRegister.applyCoordinatesFromQuery(elements);
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

  /** 등록/취소 버튼 이벤트 연결 */
  bindButtons: (elements) => {
    elements.actionButtons.forEach((button, index) => {
      App.dom.on(button, 'click', async () => {
        if (index === 0) {
          await App.pageRegister.handleSave(elements);
          return;
        }
        alert('취소되었습니다');
        App.message.postSimpleToParent(App.const.messageType.CLOSE_REGISTER);
      });
    });
  },

  /** 등록 처리 */
  handleSave: async (elements) => {
    const hasEmptyField = [elements.categorySelect.value, elements.latitudeInput.value, elements.longitudeInput.value, elements.contentInput.value]
      .some((value) => !String(value).trim());

    if (hasEmptyField) {
      alert('저장하실 위치의 정보를 정해주세요');
      return;
    }

    const spot = {
      title: elements.contentInput.value,
      latitude: Number(elements.latitudeInput.value),
      longitude: Number(elements.longitudeInput.value),
      Category: elements.categorySelect.value,
      isPrivate: Boolean(elements.privateCheckbox.checked),
    };

    await App.spotApi.saveUserSpot(spot);
    App.message.postToParent(App.const.messageType.NEW_MARKER, { data: spot });
    alert(elements.privateCheckbox.checked ? '비공개 등록되었습니다' : '공개 등록되었습니다');
    App.message.postSimpleToParent(App.const.messageType.CLOSE_REGISTER);
  },
};

document.addEventListener('DOMContentLoaded', App.pageRegister.init);
