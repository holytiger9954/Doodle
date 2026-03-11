/**
 * 댓글 API 계층.
 *
 * 현재 프로젝트는 localStorage 기반이므로 댓글도 같은 방식으로 저장한다.
 * 댓글 연결 키는 title 기반 identity가 아니라 spotKey/stableId를 우선 사용한다.
 */
App.commentApi = {
  listAllComments: () => App.storage.getJson(App.storage.keys.spotComments, []),

  listComments: () => App.commentApi.listAllComments().filter((comment) => comment.isHidden !== true),

  saveComments: (comments = []) => App.storage.setJson(App.storage.keys.spotComments, comments),

  getSpotCommentKey: (spot = {}) => String(App.spotApi?.getSpotStableId?.(spot) || ''),

  isCommentableSpot: (spot = {}) => !App.spotApi?.isPrivateSpot?.(spot),

  listCommentsBySpot: (spot = {}) => {
    const spotId = App.commentApi.getSpotCommentKey(spot);
    if (!spotId) return [];

    return App.commentApi.listComments()
      .filter((comment) => String(comment.spotId || '') === spotId)
      .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  },

  countCommentsBySpot: (spot = {}) => App.commentApi.listCommentsBySpot(spot).length,

  listMyComments: async () => {
    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) return [];

    const comments = App.commentApi.listComments()
      .filter((comment) => String(comment.authorId || '') === loginId)
      .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());

    const resolvedComments = await Promise.all(comments.map(async (comment) => {
      const spot = await App.spotApi.findSpotByStableId(comment.spotId || '');
      return {
        ...comment,
        spot,
        isSpotAvailable: Boolean(spot),
      };
    }));

    return resolvedComments;
  },


  createComment: ({ spot = {}, content = '' } = {}) => {
    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) {
      return { success: false, message: '로그인 후 댓글을 작성할 수 있어요.' };
    }

    if (!App.commentApi.isCommentableSpot(spot)) {
      return { success: false, message: '비공개 장소에는 댓글을 남길 수 없어요.' };
    }

    const normalizedContent = String(content || '').trim();
    if (!normalizedContent) {
      return { success: false, message: '댓글 내용을 입력해주세요.' };
    }

    if (normalizedContent.length > 200) {
      return { success: false, message: '댓글은 200자까지 입력할 수 있어요.' };
    }

    const savedUser = App.storage.getSavedUser();
    const comments = App.commentApi.listAllComments();
    const nextComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      spotId: App.commentApi.getSpotCommentKey(spot),
      authorId: loginId,
      authorNickname: savedUser.nickname || '게스트',
      content: normalizedContent,
      createdAt: new Date().toISOString(),
      isHidden: false,
    };

    comments.push(nextComment);
    App.commentApi.saveComments(comments);
    return { success: true, data: nextComment, message: '댓글이 등록되었어요.' };
  },

  deleteMyComment: (commentId = '') => {
    const targetId = String(commentId || '').trim();
    if (!targetId) {
      return { success: false, message: '삭제할 댓글을 찾지 못했어요.' };
    }

    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) {
      return { success: false, message: '로그인 후 이용할 수 있어요.' };
    }

    const comments = App.commentApi.listAllComments();
    const targetComment = comments.find((comment) => comment.id === targetId);
    if (!targetComment) {
      return { success: false, message: '삭제할 댓글을 찾지 못했어요.' };
    }

    if (String(targetComment.authorId || '') !== loginId) {
      return { success: false, message: '내가 작성한 댓글만 삭제할 수 있어요.' };
    }

    const nextComments = comments.filter((comment) => comment.id !== targetId);
    App.commentApi.saveComments(nextComments);
    return { success: true, message: '댓글을 삭제했어요.', removedCommentId: targetId };
  },

  removeCommentsBySpot: (spotOrId = '') => {
    const targetId = typeof spotOrId === 'string'
      ? String(spotOrId || '').trim()
      : App.commentApi.getSpotCommentKey(spotOrId);

    if (!targetId) return;

    const comments = App.commentApi.listAllComments();
    const nextComments = comments.filter((comment) => String(comment.spotId || '') !== targetId);
    if (nextComments.length === comments.length) return;
    App.commentApi.saveComments(nextComments);
  },

  hideCommentByAdmin: (commentId = '') => {
    const targetId = String(commentId || '').trim();
    if (!targetId) return { success: false, message: '대상을 찾지 못했습니다.' };
    const comments = App.commentApi.listAllComments();
    const index = comments.findIndex((comment) => comment.id === targetId);
    if (index === -1) return { success: false, message: '대상을 찾지 못했습니다.' };
    comments[index] = { ...comments[index], isHidden: true, hiddenAt: new Date().toISOString() };
    App.commentApi.saveComments(comments);
    return { success: true, message: '댓글을 숨김 처리했습니다.', data: comments[index] };
  },

  unhideCommentByAdmin: (commentId = '') => {
    const targetId = String(commentId || '').trim();
    if (!targetId) return { success: false, message: '대상을 찾지 못했습니다.' };
    const comments = App.commentApi.listAllComments();
    const index = comments.findIndex((comment) => comment.id === targetId);
    if (index === -1) return { success: false, message: '대상을 찾지 못했습니다.' };
    comments[index] = { ...comments[index], isHidden: false, hiddenAt: null };
    App.commentApi.saveComments(comments);
    return { success: true, message: '댓글 숨김을 해제했습니다.', data: comments[index] };
  },

  deleteCommentByAdmin: (commentId = '') => {
    const targetId = String(commentId || '').trim();
    if (!targetId) return { success: false, message: '대상을 찾지 못했습니다.' };
    const comments = App.commentApi.listAllComments();
    const targetComment = comments.find((comment) => comment.id === targetId);
    if (!targetComment) return { success: false, message: '삭제할 댓글을 찾지 못했습니다.' };
    App.commentApi.saveComments(comments.filter((comment) => comment.id !== targetId));
    if (App.reportApi?.removeReportsByTarget) App.reportApi.removeReportsByTarget('comment', targetId);
    return { success: true, message: '댓글을 삭제했습니다.', removedComment: targetComment, removedCommentId: targetId };
  },

  formatCommentDate: (value = '') => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
