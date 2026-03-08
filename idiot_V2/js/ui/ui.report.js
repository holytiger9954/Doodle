/** 신고 페이지 UI 제어. */
App.uiReport = {
  /** textarea placeholder를 focus/blur 상태에 맞게 바꾼다. */
  init: () => {
    const detailReason = App.dom.qs('#detail-reason');
    App.dom.on(detailReason, 'focus', () => {
      detailReason.placeholder = '';
    });
    App.dom.on(detailReason, 'blur', () => {
      if (!detailReason.value) {
        detailReason.placeholder = '상세사유를 적어주세요.(최대 300자)';
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', App.uiReport.init);
