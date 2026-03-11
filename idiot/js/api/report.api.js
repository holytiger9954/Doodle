/**
 * 신고 API 계층.
 * 현재 프로젝트에서는 localStorage에 신고 내역을 저장한다.
 */
App.reportApi = {
  listReports: () => App.storage.getJson(App.storage.keys.spotReports, []),

  saveReports: (reports = []) => App.storage.setJson(App.storage.keys.spotReports, reports),

  createReport: ({ targetType = 'spot', targetId = '', spotId = '', targetTitle = '', reason = '', detail = '' } = {}) => {
    const loginId = App.storage.getCurrentLoginId();
    const savedUser = App.storage.getSavedUser();
    const normalizedTargetId = String(targetId || '').trim();
    const normalizedReason = String(reason || '').trim();
    const normalizedDetail = String(detail || '').trim();

    if (!normalizedTargetId) {
      return { success: false, message: '신고 대상을 찾지 못했습니다.' };
    }
    if (!normalizedDetail) {
      return { success: false, message: '상세사유를 입력해주세요.' };
    }

    const reports = App.reportApi.listReports();
    reports.push({
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      targetType: String(targetType || 'spot'),
      targetId: normalizedTargetId,
      spotId: String(spotId || normalizedTargetId),
      targetTitle: String(targetTitle || '').trim(),
      reason: normalizedReason,
      detail: normalizedDetail,
      reporterId: loginId || '',
      reporterNickname: savedUser.nickname || '게스트',
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    App.reportApi.saveReports(reports);
    return { success: true, message: '신고가 접수되었습니다.' };
  },

  updateStatus: (reportId = '', status = 'pending') => {
    const reports = App.reportApi.listReports();
    const index = reports.findIndex((report) => report.id === reportId);
    if (index === -1) return { success: false, message: '신고를 찾지 못했습니다.' };
    reports[index] = { ...reports[index], status, updatedAt: new Date().toISOString() };
    App.reportApi.saveReports(reports);
    return { success: true, data: reports[index] };
  },

  removeReportsBySpot: (spotId = '') => {
    const targetId = String(spotId || '').trim();
    if (!targetId) return;
    const reports = App.reportApi.listReports();
    App.reportApi.saveReports(reports.filter((report) => String(report.spotId || report.targetId || '') !== targetId));
  },

  removeReportsByTarget: (targetType = '', targetId = '') => {
    const normalizedType = String(targetType || '').trim();
    const normalizedTargetId = String(targetId || '').trim();
    if (!normalizedType || !normalizedTargetId) return;
    const reports = App.reportApi.listReports();
    App.reportApi.saveReports(reports.filter((report) => !(String(report.targetType || '') === normalizedType && String(report.targetId || '') === normalizedTargetId)));
  },

  formatReasonLabel: (reason = '') => ({
    spam: '스팸/영리적 홍보',
    danger: '위험한 장소',
    different: '적힌태그와 다름',
    etc: '기타',
  }[String(reason || '').trim()] || '기타'),
};
