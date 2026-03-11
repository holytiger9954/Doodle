/**
 * 인증 API 계층.
 *
 * 화면(page)은 인증 저장 방식(localStorage / 서버)을 몰라도 되게 만들기 위해
 * 회원가입 / 로그인 / 로그아웃 / 비밀번호 변경을 이 파일에 모아 둔다.
 *
 * 이번 수정의 핵심:
 * - 예전 구조: 마지막 가입자 1명만 savedId/savedPw/savedNn 에 저장
 * - 변경 구조: users 배열에 전체 회원 목록 저장 + savedUser 에 현재 로그인 사용자 저장
 *
 * 이렇게 바꾸면 같은 브라우저에서 계정 A/B를 번갈아 로그인하며
 * 공개/비공개 필터를 테스트할 수 있다.
 */
App.authApi = {
  /**
   * 회원가입 처리.
   *
   * localStorage 모드에서는 users 배열에 회원을 추가한다.
   * 예전처럼 마지막 가입자만 덮어쓰면 A 계정을 만든 뒤 B를 가입시키는 순간
   * A가 사라져 테스트 자체가 불가능해진다.
   */
  signup: async (payload) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const users = App.storage.getUsers();
    const normalizedLoginId = (payload.loginId || '').trim();
    const normalizedPassword = (payload.password || '').trim();
    const normalizedNickname = (payload.nickname || '').trim();

    // 회원가입 단계에서 기본적인 중복 검사 수행.
    // 지금 프로젝트는 localStorage 기반이므로 서버의 UNIQUE 제약이 없다.
    // 따라서 프론트에서 직접 중복 검사해 주어야 한다.
    const isDuplicated = users.some((user) => user.loginId === normalizedLoginId);
    if (isDuplicated) {
      return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }

    const newUser = {
      loginId: normalizedLoginId,
      password: normalizedPassword,
      nickname: normalizedNickname,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    App.storage.setUsers(users);

    // 회원가입과 로그인은 분리한다.
    // 이유:
    // 1) join 페이지는 성공 후 login 모달/페이지로 이동시키는 흐름을 이미 사용 중이다.
    // 2) 회원가입만 했다고 현재 세션 사용자를 강제로 바꾸면,
    //    테스트 중 기존 로그인 사용자 문맥이 갑자기 뒤집혀 혼란이 생길 수 있다.
    // 따라서 여기서는 회원 목록(users)만 갱신하고,
    // 실제 로그인 상태는 login()에서만 바꾸도록 역할을 분리한다.

    return { success: true, message: '회원가입이 완료되었습니다' };
  },

  /**
   * 로그인 처리.
   *
   * users 배열에서 아이디/비밀번호가 일치하는 회원을 찾는다.
   * 찾은 사용자는 savedUser + savedId/savedPw/savedNn 에 같이 반영한다.
   */
  login: async (payload) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const users = App.storage.getUsers();
    const loginId = (payload.loginId || '').trim();
    const password = (payload.password || '').trim();

    const matchedUser = users.find(
      (user) => user.loginId === loginId && user.password === password,
    );

    if (!matchedUser) {
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    App.storage.setSavedUser(matchedUser);
    App.storage.set(App.storage.keys.login, 'true');

    return {
      success: true,
      nickname: matchedUser.nickname,
      message: '로그인되었습니다.',
    };
  },

  /**
   * 로그아웃 처리.
   *
   * users 배열은 유지하고 현재 로그인 상태만 정리한다.
   * 회원 목록까지 삭제하면 다시 A/B 테스트가 불가능해진다.
   */
  logout: () => {
    App.storage.clearCurrentUserSession();
    return { success: true };
  },

  /**
   * 비밀번호 변경 처리.
   *
   * 현재 구조에서는 users 배열 안의 회원 정보를 찾아 비밀번호를 갱신해야 한다.
   * 예전처럼 savedPw 하나만 바꾸면 "현재 로그인한 사람의 임시 정보"만 바뀌고
   * 실제 회원 목록은 갱신되지 않아 다음 로그인에서 다시 틀어질 수 있다.
   */
  changePassword: async (payload) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const users = App.storage.getUsers();
    const loginId = (payload.loginId || '').trim();
    const currentPassword = (payload.currentPassword || '').trim();
    const newPassword = (payload.newPassword || '').trim();

    const userIndex = users.findIndex(
      (user) => user.loginId === loginId && user.password === currentPassword,
    );

    if (userIndex === -1) {
      return { success: false, message: '변경하려는 아이디 혹은 비밀번호가 잘못되었습니다.' };
    }

    const updatedUser = {
      ...users[userIndex],
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    App.storage.setUsers(users);

    // 현재 로그인한 사용자가 비밀번호를 바꿨다면 세션 정보도 같이 갱신해 준다.
    // 그래야 이후 ownerId 체크 등에서 사용자 정보가 꼬이지 않는다.
    const currentLoginId = App.storage.getCurrentLoginId();
    if (currentLoginId === updatedUser.loginId) {
      App.storage.setSavedUser(updatedUser);
    }

    // [v19 인증 상태 변경 보강]
    // 비밀번호 변경 후에는 재로그인을 요구하므로,
    // login 플래그만 지우지 말고 현재 세션 전체를 정리해야 한다.
    // 그래야 savedUser가 남아서 owner/권한 계산이 꼬이는 일을 막을 수 있다.
    App.storage.clearCurrentUserSession();
    return {
      success: true,
      message: '비밀번호가 변경되었습니다',
      requiresRelogin: true,
    };
  },
};
