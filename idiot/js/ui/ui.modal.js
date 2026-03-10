/**
 * 메인 1페이지 앱용 공통 모달 관리자.
 * login / join / report / changePw 를 페이지 이동 없이 같은 화면 위에서 처리한다.
 */
App.uiModal = {
  modalMap: {
    login: './partials/login.modal.html',
    join: './partials/join.modal.html',
    report: './partials/report.modal.html',
    changePassword: './partials/changePw.modal.html',
  },

  getElements: () => ({
    overlay: App.dom.qs('#app-modal-overlay'),
    content: App.dom.qs('#app-modal-content'),
    title: App.dom.qs('#app-modal-title'),
  }),

  init: () => {
    const elements = App.uiModal.getElements();
    if (!elements.overlay || !elements.content) return;

    App.dom.on(elements.overlay, 'click', (event) => {
      if (event.target === elements.overlay) {
        App.uiModal.close();
      }
    });

    App.dom.on(document, 'keydown', (event) => {
      if (event.key === 'Escape' && elements.overlay.classList.contains('active')) {
        App.uiModal.close();
      }
    });
  },

  open: async (modalName, options = {}) => {
    const elements = App.uiModal.getElements();
    const partialPath = App.uiModal.modalMap[modalName];
    if (!partialPath || !elements.overlay || !elements.content) return;

    try {
      const response = await fetch(partialPath);
      const html = await response.text();
      elements.content.innerHTML = html;
      elements.overlay.classList.add('active');
      document.body.classList.add('modal-open');
      elements.overlay.dataset.currentModal = modalName;
      App.uiModal.applyModalContext(modalName, options);
      App.uiModal.bindCommonActions(modalName, options);
      App.uiModal.runPageInitializer(modalName);
    } catch (error) {
      console.error('[ui.modal] 모달 로드 실패', error);
    }
  },

  close: () => {
    const elements = App.uiModal.getElements();
    if (!elements.overlay || !elements.content) return;
    elements.overlay.classList.remove('active');
    elements.content.innerHTML = '';
    elements.overlay.dataset.currentModal = '';
    document.body.classList.remove('modal-open');
  },

  applyModalContext: (modalName, options = {}) => {
    const elements = App.uiModal.getElements();
    const modalBox = App.dom.qs('.dd-auth-box', elements.content);
    if (!modalBox) return;

    modalBox.classList.add('app-modal-box');
    modalBox.dataset.modal = modalName;

    if (modalName === 'report' && options.item) {
      const title = App.dom.qs('#report-spot-title', modalBox);
      if (title) {
        title.textContent = options.item.title || options.item.address || '선택한 장소';
      }
    }

    if (modalName === 'changePassword') {
      const savedUser = App.storage.getSavedUser();
      const idInput = App.dom.qs('#input-dd-id', modalBox);
      if (idInput && savedUser.loginId) {
        idInput.value = savedUser.loginId;
      }
    }
  },

  bindCommonActions: (modalName, options = {}) => {
    const elements = App.uiModal.getElements();
    const modalRoot = elements.content;
    App.dom.qsa('.close-btn,[data-modal-close]', modalRoot).forEach((button) => {
      App.dom.on(button, 'click', (event) => {
        event.preventDefault();
        App.uiModal.close();
      });
    });

    App.dom.qsa('[data-open-modal]', modalRoot).forEach((button) => {
      App.dom.on(button, 'click', (event) => {
        event.preventDefault();
        const nextModal = button.getAttribute('data-open-modal');
        App.uiModal.open(nextModal, options);
      });
    });
  },

  runPageInitializer: (modalName) => {
    const initializerMap = {
      login: App.pageLogin?.init,
      join: App.pageJoin?.init,
      report: App.uiReport?.init,
      changePassword: App.pageChangePassword?.init,
    };

    const initializer = initializerMap[modalName];
    if (typeof initializer === 'function') {
      initializer();
    }
  },

  openFromMessage: (payload) => {
    if (!payload?.modal) return;
    App.uiModal.open(payload.modal, payload.options || {});
  },
};

document.addEventListener('DOMContentLoaded', App.uiModal.init);
