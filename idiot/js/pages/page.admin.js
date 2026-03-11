App.pageAdmin = {
  state: {
    activeTab: 'dashboard',
  },

  getElements: () => ({
    loginGate: App.dom.qs('#admin-login-gate'),
    appRoot: App.dom.qs('#admin-app'),
    refreshButton: App.dom.qs('#admin-refresh'),
    tabs: App.dom.qsa('.admin-tab'),
    panels: App.dom.qsa('.admin-panel'),
    summaryUsers: App.dom.qs('#summary-users'),
    summarySpots: App.dom.qs('#summary-spots'),
    summaryPublicSpots: App.dom.qs('#summary-public-spots'),
    summaryHiddenSpots: App.dom.qs('#summary-hidden-spots'),
    summaryComments: App.dom.qs('#summary-comments'),
    summaryPendingReports: App.dom.qs('#summary-pending-reports'),
    dashboardRecentSpots: App.dom.qs('#dashboard-recent-spots'),
    dashboardRecentComments: App.dom.qs('#dashboard-recent-comments'),
    spotSearch: App.dom.qs('#spot-search'),
    spotFilter: App.dom.qs('#spot-filter'),
    spotList: App.dom.qs('#admin-spot-list'),
    commentSearch: App.dom.qs('#comment-search'),
    commentFilter: App.dom.qs('#comment-filter'),
    commentList: App.dom.qs('#admin-comment-list'),
    reportSearch: App.dom.qs('#report-search'),
    reportFilter: App.dom.qs('#report-filter'),
    reportList: App.dom.qs('#admin-report-list'),
  }),

  init: async () => {
    const elements = App.pageAdmin.getElements();
    if (!elements.appRoot) return;
    App.pageAdmin.bindTabs(elements);
    App.pageAdmin.bindFilters(elements);
    App.pageAdmin.bindRefresh(elements);
    await App.pageAdmin.render(elements);
    window.addEventListener('storage', () => App.pageAdmin.render(elements));
    window.addEventListener('focus', () => App.pageAdmin.render(elements));
  },

  ensureLoggedIn: (elements) => {
    const isLoggedIn = App.storage.isLoggedIn();
    elements.loginGate.classList.toggle('hidden', isLoggedIn);
    elements.appRoot.classList.toggle('hidden', !isLoggedIn);
    return isLoggedIn;
  },

  bindTabs: (elements) => {
    elements.tabs.forEach((tabButton) => {
      App.dom.on(tabButton, 'click', () => {
        const nextTab = tabButton.dataset.tab || 'dashboard';
        App.pageAdmin.state.activeTab = nextTab;
        elements.tabs.forEach((button) => button.classList.toggle('is-active', button === tabButton));
        elements.panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === nextTab));
      });
    });
  },

  bindFilters: (elements) => {
    [elements.spotSearch, elements.spotFilter, elements.commentSearch, elements.commentFilter, elements.reportSearch, elements.reportFilter]
      .filter(Boolean)
      .forEach((node) => {
        const eventName = node.tagName === 'SELECT' ? 'change' : 'input';
        App.dom.on(node, eventName, () => App.pageAdmin.render(elements));
      });
  },

  bindRefresh: (elements) => {
    App.dom.on(elements.refreshButton, 'click', () => App.pageAdmin.render(elements));
  },

  renderEmptyState: (container, message) => {
    if (!container) return;
    container.innerHTML = `<div class="admin-empty">${message}</div>`;
  },

  loadData: async () => {
    const users = App.storage.getUsers();
    const spots = await App.spotApi.listAdminUserSpots();
    const comments = App.commentApi.listAllComments();
    const reports = App.reportApi.listReports().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const allSpots = await App.spotApi.listAllSpots();
    return { users, spots, comments, reports, allSpots };
  },

  render: async (elements = App.pageAdmin.getElements()) => {
    if (!App.pageAdmin.ensureLoggedIn(elements)) return;
    const data = await App.pageAdmin.loadData();
    App.pageAdmin.renderSummary(elements, data);
    App.pageAdmin.renderDashboard(elements, data);
    App.pageAdmin.renderSpots(elements, data);
    App.pageAdmin.renderComments(elements, data);
    App.pageAdmin.renderReports(elements, data);
  },

  renderSummary: (elements, data) => {
    elements.summaryUsers.textContent = String(data.users.length);
    elements.summarySpots.textContent = String(data.spots.length);
    elements.summaryPublicSpots.textContent = String(data.spots.filter((spot) => !App.spotApi.isPrivateSpot(spot) && !App.spotApi.isHiddenSpot(spot)).length);
    elements.summaryHiddenSpots.textContent = String(data.spots.filter((spot) => App.spotApi.isHiddenSpot(spot)).length);
    elements.summaryComments.textContent = String(data.comments.length);
    elements.summaryPendingReports.textContent = String(data.reports.filter((report) => report.status === 'pending').length);
  },

  renderDashboard: (elements, data) => {
    const recentSpots = [...data.spots].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    const recentComments = [...data.comments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

    if (!recentSpots.length) {
      App.pageAdmin.renderEmptyState(elements.dashboardRecentSpots, '아직 등록된 사용자 장소가 없어요.');
    } else {
      elements.dashboardRecentSpots.innerHTML = recentSpots.map((spot) => {
        const chip = App.spotApi.isHiddenSpot(spot) ? '<span class="admin-chip danger">숨김</span>' : App.spotApi.isPrivateSpot(spot) ? '<span class="admin-chip warn">비공개</span>' : '<span class="admin-chip">공개</span>';
        return `
          <article class="admin-stack-item">
            <strong class="admin-stack-title">${spot.title || '제목 없음'}</strong>
            <span class="admin-stack-meta">${spot.ownerNickname || spot.ownerId || '작성자 없음'} · ${App.pageAdmin.formatDate(spot.createdAt)}</span>
            <div class="admin-meta-row">${chip}<span class="admin-chip">${App.categoryData.normalizeCategoryLabel(spot.Category || spot.category || '장소')}</span></div>
          </article>
        `;
      }).join('');
    }

    if (!recentComments.length) {
      App.pageAdmin.renderEmptyState(elements.dashboardRecentComments, '아직 댓글이 없어요.');
    } else {
      elements.dashboardRecentComments.innerHTML = recentComments.map((comment) => {
        const spot = data.allSpots.find((item) => App.spotApi.getSpotStableId(item) === String(comment.spotId || ''));
        return `
          <article class="admin-stack-item">
            <strong class="admin-stack-title">${spot?.title || '연결 끊긴 장소'}</strong>
            <span class="admin-stack-meta">${comment.authorNickname || comment.authorId || '사용자'} · ${App.pageAdmin.formatDate(comment.createdAt)}</span>
            <span class="admin-stack-meta">${App.pageAdmin.escapeHtml(comment.content || '')}</span>
          </article>
        `;
      }).join('');
    }
  },

  renderSpots: (elements, data) => {
    const keyword = String(elements.spotSearch.value || '').trim().toLowerCase();
    const filter = String(elements.spotFilter.value || 'all');
    const items = data.spots.filter((spot) => {
      if (filter === 'public' && (App.spotApi.isPrivateSpot(spot) || App.spotApi.isHiddenSpot(spot))) return false;
      if (filter === 'private' && !App.spotApi.isPrivateSpot(spot)) return false;
      if (filter === 'hidden' && !App.spotApi.isHiddenSpot(spot)) return false;
      if (filter === 'shared' && App.categoryData.normalizeCategoryLabel(spot.Category || spot.category || '') !== '공유 스팟') return false;
      if (!keyword) return true;
      const haystack = [spot.title, spot.address, spot.ownerNickname, spot.ownerId, spot.Category, spot.category].join(' ').toLowerCase();
      return haystack.includes(keyword);
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!items.length) {
      App.pageAdmin.renderEmptyState(elements.spotList, '조건에 맞는 장소가 없어요.');
      return;
    }

    elements.spotList.innerHTML = items.map((spot) => {
      const spotId = App.spotApi.getSpotStableId(spot);
      const commentsCount = data.comments.filter((comment) => String(comment.spotId || '') === spotId).length;
      const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
      const favoriteCount = Object.values(favoriteMap).flat().filter((item) => App.spotApi.getSpotStableId(item) === spotId).length;
      return `
        <article class="admin-list-card" data-spot-id="${spotId}">
          <div class="admin-list-top">
            <div>
              <h3 class="admin-list-title">${App.pageAdmin.escapeHtml(spot.title || '제목 없음')}</h3>
              <div class="admin-meta-row">
                <span class="admin-chip">${App.categoryData.normalizeCategoryLabel(spot.Category || spot.category || '장소')}</span>
                <span class="admin-chip ${App.spotApi.isPrivateSpot(spot) ? 'warn' : ''}">${App.spotApi.isPrivateSpot(spot) ? '비공개' : '공개'}</span>
                ${App.spotApi.isHiddenSpot(spot) ? '<span class="admin-chip danger">숨김</span>' : ''}
                <span class="admin-chip">댓글 ${commentsCount}</span>
                <span class="admin-chip">찜 ${favoriteCount}</span>
              </div>
            </div>
            <span class="admin-chip">${App.pageAdmin.formatDate(spot.createdAt)}</span>
          </div>
          <p class="admin-list-body">${App.pageAdmin.escapeHtml(spot.description || spot.address || '설명 없음')}</p>
          <div class="admin-meta-row">
            <span class="admin-chip">작성자 ${App.pageAdmin.escapeHtml(spot.ownerNickname || spot.ownerId || '알 수 없음')}</span>
            <span class="admin-chip">${App.pageAdmin.escapeHtml(spot.address || '주소 정보 없음')}</span>
          </div>
          <div class="admin-actions">
            <button type="button" class="admin-btn" data-spot-action="toggle-hide" data-spot-id="${spotId}">${App.spotApi.isHiddenSpot(spot) ? '숨김 해제' : '숨김'}</button>
            <button type="button" class="admin-btn danger" data-spot-action="delete" data-spot-id="${spotId}">삭제</button>
          </div>
        </article>
      `;
    }).join('');

    elements.spotList.querySelectorAll('[data-spot-action]').forEach((button) => {
      App.dom.on(button, 'click', async () => {
        const targetId = button.dataset.spotId || '';
        const action = button.dataset.spotAction || '';
        const targetSpot = data.spots.find((spot) => App.spotApi.getSpotStableId(spot) === targetId);
        if (!targetSpot) return;

        if (action === 'toggle-hide') {
          const result = App.spotApi.isHiddenSpot(targetSpot)
            ? await App.spotApi.unhideSpotByAdmin(targetId)
            : await App.spotApi.hideSpotByAdmin(targetId);
          App.toast.show(result.message || '상태를 변경했습니다.');
          await App.pageAdmin.render(elements);
          return;
        }

        const ok = await App.confirm.open({ title: '장소를 삭제할까요?', message: '관련 댓글과 신고도 함께 정리됩니다.', confirmText: '삭제', cancelText: '취소', danger: true });
        if (!ok) return;
        const result = await App.spotApi.deleteSpotByAdmin(targetId);
        App.toast.show(result.message || '장소를 삭제했습니다.');
        await App.pageAdmin.render(elements);
      });
    });
  },

  renderComments: (elements, data) => {
    const keyword = String(elements.commentSearch.value || '').trim().toLowerCase();
    const filter = String(elements.commentFilter.value || 'all');
    const items = data.comments.filter((comment) => {
      if (filter === 'visible' && comment.isHidden === true) return false;
      if (filter === 'hidden' && comment.isHidden !== true) return false;
      const spot = data.allSpots.find((item) => App.spotApi.getSpotStableId(item) === String(comment.spotId || ''));
      if (!keyword) return true;
      const haystack = [comment.content, comment.authorNickname, comment.authorId, spot?.title].join(' ').toLowerCase();
      return haystack.includes(keyword);
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!items.length) {
      App.pageAdmin.renderEmptyState(elements.commentList, '조건에 맞는 댓글이 없어요.');
      return;
    }

    elements.commentList.innerHTML = items.map((comment) => {
      const spot = data.allSpots.find((item) => App.spotApi.getSpotStableId(item) === String(comment.spotId || ''));
      return `
        <article class="admin-list-card" data-comment-id="${comment.id}">
          <div class="admin-list-top">
            <div>
              <h3 class="admin-list-title">${App.pageAdmin.escapeHtml(spot?.title || '연결 끊긴 장소')}</h3>
              <div class="admin-meta-row">
                <span class="admin-chip">${App.pageAdmin.escapeHtml(comment.authorNickname || comment.authorId || '사용자')}</span>
                ${comment.isHidden === true ? '<span class="admin-chip danger">숨김</span>' : '<span class="admin-chip">표시 중</span>'}
              </div>
            </div>
            <span class="admin-chip">${App.pageAdmin.formatDate(comment.createdAt)}</span>
          </div>
          <p class="admin-list-body">${App.pageAdmin.escapeHtml(comment.content || '')}</p>
          <div class="admin-actions">
            <button type="button" class="admin-btn" data-comment-action="toggle-hide" data-comment-id="${comment.id}">${comment.isHidden === true ? '숨김 해제' : '숨김'}</button>
            <button type="button" class="admin-btn danger" data-comment-action="delete" data-comment-id="${comment.id}">삭제</button>
          </div>
        </article>
      `;
    }).join('');

    elements.commentList.querySelectorAll('[data-comment-action]').forEach((button) => {
      App.dom.on(button, 'click', async () => {
        const targetId = button.dataset.commentId || '';
        const action = button.dataset.commentAction || '';
        const targetComment = data.comments.find((comment) => comment.id === targetId);
        if (!targetComment) return;

        if (action === 'toggle-hide') {
          const result = targetComment.isHidden === true
            ? App.commentApi.unhideCommentByAdmin(targetId)
            : App.commentApi.hideCommentByAdmin(targetId);
          App.toast.show(result.message || '상태를 변경했습니다.');
          await App.pageAdmin.render(elements);
          return;
        }

        const ok = await App.confirm.open({ title: '댓글을 삭제할까요?', message: '연결된 신고 내역도 함께 정리됩니다.', confirmText: '삭제', cancelText: '취소', danger: true });
        if (!ok) return;
        const result = App.commentApi.deleteCommentByAdmin(targetId);
        App.toast.show(result.message || '댓글을 삭제했습니다.');
        await App.pageAdmin.render(elements);
      });
    });
  },

  renderReports: (elements, data) => {
    const keyword = String(elements.reportSearch.value || '').trim().toLowerCase();
    const filter = String(elements.reportFilter.value || 'all');
    const items = data.reports.filter((report) => {
      if (filter !== 'all' && report.status !== filter) return false;
      if (!keyword) return true;
      const haystack = [report.targetTitle, report.detail, report.reason, report.reporterNickname, report.reporterId].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });

    if (!items.length) {
      App.pageAdmin.renderEmptyState(elements.reportList, '아직 신고 내역이 없어요.');
      return;
    }

    elements.reportList.innerHTML = items.map((report) => `
      <article class="admin-list-card" data-report-id="${report.id}">
        <div class="admin-list-top">
          <div>
            <h3 class="admin-list-title">${App.pageAdmin.escapeHtml(report.targetTitle || '대상 없음')}</h3>
            <div class="admin-meta-row">
              <span class="admin-chip">${report.targetType === 'comment' ? '댓글 신고' : '장소 신고'}</span>
              <span class="admin-chip ${report.status === 'pending' ? 'warn' : ''}">${report.status === 'pending' ? '대기' : report.status === 'resolved' ? '처리 완료' : '무시'}</span>
              <span class="admin-chip">${App.reportApi.formatReasonLabel(report.reason)}</span>
            </div>
          </div>
          <span class="admin-chip">${App.pageAdmin.formatDate(report.createdAt)}</span>
        </div>
        <p class="admin-list-body">${App.pageAdmin.escapeHtml(report.detail || '')}</p>
        <div class="admin-meta-row">
          <span class="admin-chip">신고자 ${App.pageAdmin.escapeHtml(report.reporterNickname || report.reporterId || '알 수 없음')}</span>
        </div>
        <div class="admin-actions">
          <button type="button" class="admin-btn primary" data-report-action="resolve" data-report-id="${report.id}">처리 완료</button>
          <button type="button" class="admin-btn" data-report-action="ignore" data-report-id="${report.id}">무시</button>
          <button type="button" class="admin-btn" data-report-action="hide-target" data-report-id="${report.id}">대상 숨김</button>
          <button type="button" class="admin-btn danger" data-report-action="delete-target" data-report-id="${report.id}">대상 삭제</button>
        </div>
      </article>
    `).join('');

    elements.reportList.querySelectorAll('[data-report-action]').forEach((button) => {
      App.dom.on(button, 'click', async () => {
        const reportId = button.dataset.reportId || '';
        const action = button.dataset.reportAction || '';
        const report = data.reports.find((item) => item.id === reportId);
        if (!report) return;

        if (action === 'resolve' || action === 'ignore') {
          App.reportApi.updateStatus(reportId, action === 'resolve' ? 'resolved' : 'ignored');
          App.toast.show(action === 'resolve' ? '신고를 처리 완료로 표시했습니다.' : '신고를 무시 처리했습니다.');
          await App.pageAdmin.render(elements);
          return;
        }

        if (action === 'hide-target') {
          let result = null;
          if (report.targetType === 'comment') result = App.commentApi.hideCommentByAdmin(report.targetId);
          else result = await App.spotApi.hideSpotByAdmin(report.targetId);
          if (result?.success !== false) App.reportApi.updateStatus(reportId, 'resolved');
          App.toast.show(result?.message || '대상을 숨김 처리했습니다.');
          await App.pageAdmin.render(elements);
          return;
        }

        const ok = await App.confirm.open({ title: '신고 대상을 삭제할까요?', message: '삭제 후 되돌릴 수 없어요.', confirmText: '삭제', cancelText: '취소', danger: true });
        if (!ok) return;
        let result = null;
        if (report.targetType === 'comment') result = App.commentApi.deleteCommentByAdmin(report.targetId);
        else result = await App.spotApi.deleteSpotByAdmin(report.targetId);
        if (result?.success !== false) App.reportApi.updateStatus(reportId, 'resolved');
        App.toast.show(result?.message || '대상을 삭제했습니다.');
        await App.pageAdmin.render(elements);
      });
    });
  },

  formatDate: (value = '') => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '날짜 없음';
    return date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  },

  escapeHtml: (value = '') => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;'),
};

document.addEventListener('DOMContentLoaded', () => App.pageAdmin.init());
