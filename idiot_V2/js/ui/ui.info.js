/** 정보창 공통 UI. */
App.uiInfo = {
  /** 신고 버튼이 있으면 report.html로 이동시킨다. */
  init: () => {
    const reportButton = App.dom.qs('#report');
    App.dom.on(reportButton, 'click', () => {
      location.href = './report.html';
    });
  },
};

document.addEventListener('DOMContentLoaded', App.uiInfo.init);
