window.App = window.App || {};

/**
 * 앱 설정값.
 * - apiMode: local/server 전환 포인트
 * - defaultCenter: 지도 기본 중심 좌표
 * - searchZoomLevel: 검색 이동 후 확대 레벨
 * - singleMarkerZoomLevel: 단일 위치 선택 시 확대 레벨
 */
App.config = {
  apiMode: 'local',
  apiBaseUrl: 'http://localhost:15180/api/v1',
  defaultCenter: { lat: 36.8115, lng: 127.1462 },
  searchZoomLevel: 3,
  singleMarkerZoomLevel: 1,
  categoryOverviewMinLevel: 7,
  categorySingleSpotZoomLevel: 5,
  rankingMultiSelectMode: 'or',
};

/** 앱 공통 상수. */
App.const = {
  messageType: {
    CLOSE_REGISTER: 'closeRegister',
    NEW_MARKER: 'newMarker',
    SELECT_LOCATION: 'selectLocation',
    SELECT_CATEGORY: 'selectCategory',
    OPEN_MODAL: 'openModal',
    SPOTS_CHANGED: 'spotsChanged',
    SHOW_TOAST: 'showToast',
    OPEN_EDIT_SPOT: 'openEditSpot',
    UPDATE_SPOT: 'updateSpot',
  },
};

/** 런타임 상태 저장소. */
App.state = {
  map: null,
  locationMarker: null,
  isRegisterMode: false,
  markers: [],
  registeredMarkers: [],
  activeCategoryIndex: -1,
  activeInfoOverlay: null,
  activeTagFilter: '',
  activeTagFilters: [],
  activeEditingSpotId: '',
};


/**
 * 공용 토스트 헬퍼.
 *
 * 팀원이 전달한 기본 toast 함수 아이디어를 바탕으로,
 * 이 프로젝트에서는 두 가지 환경을 모두 지원하도록 확장했다.
 * 1) main.html 처럼 #app-toast 전역 컨테이너가 있는 경우
 * 2) iframe/서브 페이지처럼 전역 토스트 컨테이너가 없는 경우
 *
 * 목표는 alert()를 최대한 대체하되, 기존 기능을 망가뜨리지 않는 것이다.
 */
App.toast = {
  ensureFallbackStyle: () => {
    if (document.getElementById('app-toast-fallback-style')) return;
    const style = document.createElement('style');
    style.id = 'app-toast-fallback-style';
    style.textContent = `
      .toast-page {
        position: fixed;
        left: 50%;
        bottom: 24px;
        transform: translateX(-50%);
        z-index: 99999;
        max-width: min(86vw, 420px);
        padding: 12px 16px;
        border-radius: 12px;
        background: rgba(31, 27, 42, 0.96);
        color: #fff;
        font-size: 14px;
        line-height: 1.45;
        text-align: center;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
        opacity: 0;
        animation: appToastFadeIn 0.18s ease forwards;
        pointer-events: none;
      }
      @keyframes appToastFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(6px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  },

  show: (message = '') => {
    const safeMessage = String(message || '').trim();
    if (!safeMessage) return;

    // main.html에서는 기존 전역 토스트 UI를 우선 재사용한다.
    if (App.pageMain?.showToast) {
      App.pageMain.showToast(safeMessage);
      return;
    }

    // 전역 토스트 박스가 직접 있는 페이지라면 그것도 재사용한다.
    const existingToast = document.querySelector('#app-toast');
    if (existingToast) {
      existingToast.textContent = safeMessage;
      existingToast.classList.add('active');
      window.clearTimeout(App.state.toastTimer);
      App.state.toastTimer = window.setTimeout(() => {
        existingToast.classList.remove('active');
      }, 1800);
      return;
    }

    // 그 외 페이지는 팀원이 전달한 toast.js 아이디어처럼 body에 임시 토스트를 붙인다.
    App.toast.ensureFallbackStyle();
    document.querySelectorAll('.toast-page').forEach((node) => node.remove());
    const tPage = document.createElement('div');
    tPage.className = 'toast-page';
    tPage.textContent = safeMessage;
    document.body.prepend(tPage);

    window.setTimeout(() => {
      tPage.remove();
    }, 1500);
  },
};


/**
 * 공용 confirm 다이얼로그.
 *
 * 기본 window.confirm() 대신 앱 스타일을 유지하는 비동기 confirm UI를 제공한다.
 * main / iframe / 단독 페이지 어디서든 동작하도록 body에 직접 오버레이를 만든다.
 */
App.confirm = {
  ensureStyle: () => {
    if (document.getElementById('app-confirm-style')) return;
    const style = document.createElement('style');
    style.id = 'app-confirm-style';
    style.textContent = `
      .app-confirm-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(7, 16, 33, 0.52);
        backdrop-filter: blur(2px);
        z-index: 40000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.18s ease;
      }
      .app-confirm-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      .app-confirm-dialog {
        width: min(92vw, 360px);
        border-radius: 24px;
        background: #fff;
        box-shadow: 0 24px 56px rgba(10, 24, 52, 0.24);
        padding: 22px 20px 18px;
        transform: translateY(10px) scale(0.98);
        transition: transform 0.18s ease;
        text-align: center;
      }
      .app-confirm-overlay.active .app-confirm-dialog {
        transform: translateY(0) scale(1);
      }
      .app-confirm-title {
        margin: 0;
        color: #17233b;
        font-size: 1.08rem;
        font-weight: 800;
        line-height: 1.4;
      }
      .app-confirm-message {
        margin: 10px 0 0;
        color: #5c6a82;
        font-size: 0.95rem;
        line-height: 1.55;
        white-space: pre-line;
      }
      .app-confirm-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 18px;
      }
      .app-confirm-btn {
        appearance: none;
        border: none;
        border-radius: 14px;
        min-height: 46px;
        padding: 0 14px;
        font-size: 0.96rem;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.14s ease, box-shadow 0.14s ease, background 0.14s ease;
      }
      .app-confirm-btn:hover {
        transform: translateY(-1px);
      }
      .app-confirm-btn:active {
        transform: translateY(0);
      }
      .app-confirm-btn.cancel {
        background: #eef3fb;
        color: #34445f;
        box-shadow: inset 0 0 0 1px rgba(112, 136, 173, 0.18);
      }
      .app-confirm-btn.confirm {
        background: #1f4fd6;
        color: #fff;
        box-shadow: 0 10px 20px rgba(31, 79, 214, 0.22);
      }
      .app-confirm-btn.confirm.is-danger {
        background: #f08a0f;
        box-shadow: 0 10px 20px rgba(240, 138, 15, 0.24);
      }
      @media (max-width: 480px) {
        .app-confirm-overlay {
          padding: 14px;
          align-items: flex-end;
        }
        .app-confirm-dialog {
          width: min(100%, 420px);
          border-radius: 22px 22px 16px 16px;
        }
      }
    `;
    document.head.appendChild(style);
  },

  ensureRoot: () => {
    App.confirm.ensureStyle();
    let overlay = document.getElementById('app-confirm-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'app-confirm-overlay';
    overlay.className = 'app-confirm-overlay';
    overlay.innerHTML = `
      <div class="app-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title" aria-describedby="app-confirm-message">
        <h3 id="app-confirm-title" class="app-confirm-title">확인</h3>
        <p id="app-confirm-message" class="app-confirm-message"></p>
        <div class="app-confirm-actions">
          <button type="button" class="app-confirm-btn cancel" data-confirm-action="cancel">취소</button>
          <button type="button" class="app-confirm-btn confirm" data-confirm-action="confirm">확인</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  },

  close: (result = false) => {
    const overlay = document.getElementById('app-confirm-overlay');
    if (!overlay || !App.confirm._resolver) return;

    const resolver = App.confirm._resolver;
    App.confirm._resolver = null;

    overlay.classList.remove('active');
    document.body.classList.remove('confirm-open');

    if (App.confirm._keydownHandler) {
      document.removeEventListener('keydown', App.confirm._keydownHandler);
      App.confirm._keydownHandler = null;
    }

    const restoreFocusTarget = App.confirm._lastFocused;
    App.confirm._lastFocused = null;

    window.setTimeout(() => {
      resolver(Boolean(result));
      if (restoreFocusTarget && typeof restoreFocusTarget.focus === 'function') {
        restoreFocusTarget.focus();
      }
    }, 180);
  },

  open: (options = {}) => {
    if (App.confirm._resolver) {
      App.confirm.close(false);
    }

    const overlay = App.confirm.ensureRoot();
    const titleNode = overlay.querySelector('#app-confirm-title');
    const messageNode = overlay.querySelector('#app-confirm-message');
    const cancelButton = overlay.querySelector('[data-confirm-action="cancel"]');
    const confirmButton = overlay.querySelector('[data-confirm-action="confirm"]');

    const title = String(options.title || '확인').trim();
    const message = String(options.message || '').trim();
    const confirmText = String(options.confirmText || '확인').trim();
    const cancelText = String(options.cancelText || '취소').trim();
    const danger = options.danger === true;
    const closeOnBackdrop = options.closeOnBackdrop !== false;

    titleNode.textContent = title;
    messageNode.textContent = message;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;
    confirmButton.classList.toggle('is-danger', danger);

    const onBackdropClick = (event) => {
      if (!closeOnBackdrop) return;
      if (event.target === overlay) {
        App.confirm.close(false);
      }
    };

    const onCancel = (event) => {
      event.preventDefault();
      App.confirm.close(false);
    };

    const onConfirm = (event) => {
      event.preventDefault();
      App.confirm.close(true);
    };

    overlay.onclick = onBackdropClick;
    cancelButton.onclick = onCancel;
    confirmButton.onclick = onConfirm;

    App.confirm._lastFocused = document.activeElement;
    document.body.classList.add('confirm-open');

    App.confirm._keydownHandler = (event) => {
      if (!App.confirm._resolver) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        App.confirm.close(false);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        App.confirm.close(true);
      }
    };
    document.addEventListener('keydown', App.confirm._keydownHandler);

    return new Promise((resolve) => {
      App.confirm._resolver = resolve;
      requestAnimationFrame(() => {
        overlay.classList.add('active');
        confirmButton.focus();
      });
    });
  },

  _resolver: null,
  _keydownHandler: null,
  _lastFocused: null,
};
