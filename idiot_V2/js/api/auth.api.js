/**
 * 인증 API 계층.
 * 페이지는 이 모듈만 호출하고, 실제 저장 방식은 이 안에서 결정한다.
 */
App.authApi = {
  /** 회원가입 처리 */
  signup: async (payload) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    App.storage.set(App.storage.keys.savedId, payload.loginId);
    App.storage.set(App.storage.keys.savedPw, payload.password);
    App.storage.set(App.storage.keys.savedNickname, payload.nickname);
    return { success: true, message: '회원가입이 완료되었습니다.' };
  },

  /** 로그인 처리 */
  login: async (payload) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const savedUser = App.storage.getSavedUser();
    const isMatched = payload.loginId === savedUser.loginId && payload.password === savedUser.password;

    if (!isMatched) {
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    App.storage.set(App.storage.keys.login, 'true');
    return { success: true, nickname: savedUser.nickname, message: '로그인되었습니다.' };
  },

  /** 로그아웃 처리 */
  logout: () => {
    App.storage.remove(App.storage.keys.login);
    return { success: true };
  },

  /** 비밀번호 변경 처리 */
  changePassword: async (payload) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const savedUser = App.storage.getSavedUser();
    const isMatched = payload.loginId === savedUser.loginId && payload.currentPassword === savedUser.password;

    if (!isMatched) {
      return { success: false, message: '변경하려는 아이디 혹은 비밀번호가 잘못되었습니다.' };
    }

    App.storage.set(App.storage.keys.savedPw, payload.newPassword);
    App.storage.remove(App.storage.keys.login);
    return { success: true, message: '비밀번호가 변경되었습니다.' };
  },
};
