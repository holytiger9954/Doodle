/**
 * 마이페이지 로그인 게이트 컨트롤러.
 * 마이페이지는 로그인 사용자와 관련된 목록(찜/내 등록 장소)만 보여준다.
 */
App.pageMypage = {
  getElements: () => ({
    authSection: App.dom.qs('#mypage-auth'),
    authTitle: App.dom.qs('#mypage-auth-title'),
    authDesc: App.dom.qs('#mypage-auth-desc'),
    authPrimaryButton: App.dom.qs('#mypage-auth-primary'),
    authSecondaryButton: App.dom.qs('#mypage-auth-secondary'),
    categoryButtons: App.dom.qsa('.side-btn'),
    markerContainer: App.dom.qs('#marker'),
  }),

  init: () => {
    const elements = App.pageMypage.getElements();
    if (!elements.authSection) return;

    App.pageMypage.renderAuthState(elements);
    App.pageMypage.bindLockedButtons(elements);
  },

  renderAuthState: (elements) => {
    const isLoggedIn = App.storage.isLoggedIn();
    const nickname = App.storage.get(App.storage.keys.savedNickname);

    elements.authSection.classList.toggle('is-logged-in', isLoggedIn);
    elements.authSection.classList.toggle('is-guest', !isLoggedIn);

    elements.categoryButtons.forEach((button) => {
      button.classList.toggle('is-disabled', !isLoggedIn);
      button.setAttribute('aria-disabled', String(!isLoggedIn));
    });

    if (!isLoggedIn) {
      App.dom.setText(elements.authTitle, '로그인이 필요합니다');
      App.dom.setText(elements.authDesc, '로그인 후 찜 목록과 내가 등록한 장소를 확인할 수 있어요.');
      App.dom.setText(elements.authPrimaryButton, '로그인 하러가기');
      App.dom.setText(elements.authSecondaryButton, '회원가입');
      elements.authPrimaryButton.onclick = () => {
        window.parent.postMessage({ type: App.const.messageType.OPEN_MODAL, modal: 'login' }, '*');
      };
      elements.authSecondaryButton.onclick = () => {
        window.parent.postMessage({ type: App.const.messageType.OPEN_MODAL, modal: 'join' }, '*');
      };

      if (elements.markerContainer) {
        elements.markerContainer.classList.remove('show');
        elements.markerContainer.innerHTML = '';
        elements.markerContainer.style.display = 'none';
      }
      if (App.uiMarkerPanel) {
        App.uiMarkerPanel.lastKey = '';
      }
      return;
    }

    App.dom.setText(elements.authTitle, `${nickname || '회원'}님 환영합니다`);
    App.dom.setText(elements.authDesc, '찜한 장소와 내가 등록한 장소만 따로 모아볼 수 있어요.');
    App.dom.setText(elements.authPrimaryButton, '로그아웃');
    App.dom.setText(elements.authSecondaryButton, '비밀번호 변경');
    elements.authPrimaryButton.onclick = async () => {
      const ok = await App.confirm.open({
        title: '로그아웃할까요?',
        message: '찜 목록과 내 장소 관리를 마치고 현재 계정에서 로그아웃합니다.',
        confirmText: '로그아웃',
        cancelText: '취소',
      });
      if (!ok) return;

      App.authApi.logout();
      App.toast.show('로그아웃되었습니다.');
      // [v18 인증 후 마커 갱신]
      // 부모(main) 화면이 있다면 로그아웃 직후 마커/권한 상태를 즉시 다시 계산하게 알린다.
      if (window.parent && window.parent !== window) {
        // [v19 인증 상태 변경 보강]
        // 마이페이지 로그아웃도 일반 로그아웃과 동일하게 부모 화면 재계산 신호를 보낸다.
        window.parent.postMessage({ type: 'authChanged', reason: 'logout' }, '*');
      }
      App.pageMypage.renderAuthState(elements);
    };
    elements.authSecondaryButton.onclick = () => {
      window.parent.postMessage({ type: App.const.messageType.OPEN_MODAL, modal: 'changePassword' }, '*');
    };
  },

  bindLockedButtons: (elements) => {
    elements.categoryButtons.forEach((button) => {
      App.dom.on(button, 'click', (event) => {
        if (App.storage.isLoggedIn()) return;
        event.preventDefault();
        event.stopImmediatePropagation();

        App.dom.setText(elements.authTitle, '로그인이 필요합니다');
        App.dom.setText(elements.authDesc, '마이페이지는 내 장소를 관리하는 공간이에요. 위 버튼으로 로그인해보세요.');
        elements.authSection.classList.add('need-attention');
        setTimeout(() => {
          elements.authSection.classList.remove('need-attention');
        }, 900);
      }, true);
    });
  },
};

document.addEventListener('DOMContentLoaded', App.pageMypage.init);
