/** 신고 UI 제어. */
App.uiReport = {
  /** textarea placeholder를 focus/blur 상태에 맞게 바꾼다. */
  init: (root = document) => {
    const detailReason = App.dom.qs('#detail-reason', root);
    const form = App.dom.qs('form', root);
    const message = App.dom.qs('#report-message', root);

    if (detailReason && !detailReason.dataset.bound) {
      detailReason.dataset.bound = 'true';
      App.dom.on(detailReason, 'focus', () => {
        detailReason.placeholder = '';
      });
      App.dom.on(detailReason, 'blur', () => {
        if (!detailReason.value) {
          detailReason.placeholder = '상세사유를 적어주세요.(최대 300자)';
        }
      });
    }

    if (form && form.dataset.bound !== 'true') {
      form.dataset.bound = 'true';
      App.dom.on(form, 'submit', (event) => {
        event.preventDefault();
        if (message) {
          message.textContent = '신고가 접수되었습니다.';
        }
        setTimeout(() => {
          if (App.uiModal) {
            App.uiModal.close();
          }
        }, 700);
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.uiReport.init());
