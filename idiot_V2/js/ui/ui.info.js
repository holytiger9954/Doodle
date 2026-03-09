/** 정보창 공통 UI. */
App.uiInfo = {
  /** 신고 버튼이 있으면 공용 신고 모달을 열고, 없으면 기존 report.html로 이동한다. */
  init: () => {
    const reportButton = App.dom.qs('#report');
    App.dom.on(reportButton, 'click', () => {
      if (App.uiModal) {
        App.uiModal.open('report');
        return;
      }
      location.href = './report.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', App.uiInfo.init);
