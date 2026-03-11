/**
 * localStorage 래퍼.
 *
 * 이 프로젝트는 서버 DB 없이 localStorage를 데이터 저장소처럼 사용한다.
 * 그래서 key 이름이 흩어지면 유지보수가 매우 어려워진다.
 * key 상수/JSON 처리/로그인 사용자 조회를 여기로 모아 두면
 * 팀원이 "사용자 정보가 어디서 읽히는지"를 한 곳에서 파악할 수 있다.
 */
App.storage = {
  keys: {
    // 기존 화면 코드와의 호환을 위해 유지하는 단일 사용자 키들.
    // 아래 users / savedUser 를 도입하더라도, 예전 코드가 savedId 등을 읽을 수 있으므로
    // 당장 모든 파일을 한 번에 갈아엎지 않아도 된다.
    savedId: 'savedId',
    savedPw: 'savedPw',
    savedNickname: 'savedNn',
    login: 'login',

    // 전체 회원 목록.
    // 기존 구조의 가장 큰 문제는 "마지막 가입자 1명만 저장"한다는 점이었다.
    // users 배열을 도입하면 A/B 계정 테스트가 가능해진다.
    users: 'users',

    // 현재 로그인한 사용자 객체.
    // savedId/savedPw/savedNn 은 구버전 호환용이고,
    // 새 구조에서는 savedUser 를 1차 기준으로 사용한다.
    savedUser: 'savedUser',

    // 기능 데이터
    userSpots: 'userSpots',
    favoriteSpotsByUser: 'favoriteSpotsByUser',
    spotComments: 'spotComments',
    spotReports: 'spotReports',
  },

  /**
   * 문자열 값 조회.
   *
   * localStorage 는 값이 없으면 null 을 반환한다.
   * 화면 코드에서는 빈 문자열이 더 다루기 편한 경우가 많아서 fallback 을 둔다.
   */
  get: (key, fallback = '') => {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  },

  /**
   * 문자열 값 저장.
   *
   * 주의:
   * localStorage.setItem(key, undefined) 를 호출하면
   * 실제로는 "undefined" 문자열이 저장될 수 있다.
   * 그러면 나중에 JSON.parse("undefined") 에러가 나므로,
   * undefined/null 은 저장하지 말고 key 자체를 제거한다.
   */
  set: (key, value) => {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, String(value));
  },

  /**
   * JSON 값 조회.
   *
   * 이번 콘솔 에러의 핵심 원인이었던 부분.
   * savedUser 같은 JSON 키에 "undefined" 문자열이 들어오면 JSON.parse 에서 바로 터진다.
   * 그래서 parse 전에 반드시 방어한다.
   */
  getJson: (key, fallback = []) => {
    const raw = localStorage.getItem(key);

    // 값이 아예 없거나, JSON 으로 볼 수 없는 잘못된 문자열이면 fallback 반환.
    if (
      raw === null ||
      raw === undefined ||
      raw === '' ||
      raw === 'undefined' ||
      raw === 'null'
    ) {
      return fallback;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('[storage.getJson] JSON 파싱 실패', error);

      // 잘못된 값이 남아 있으면 페이지 진입 때마다 같은 에러가 반복되므로 제거한다.
      localStorage.removeItem(key);
      return fallback;
    }
  },

  /**
   * JSON 값 저장.
   *
   * JSON.stringify(undefined) 는 undefined 가 되어 setItem 에 그대로 넘기면 문제가 된다.
   * 따라서 undefined/null 은 저장하지 않고 key 를 지운다.
   */
  setJson: (key, value) => {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[storage.setJson] JSON 저장 실패', error);
    }
  },

  /** 값 삭제 */
  remove: (key) => localStorage.removeItem(key),

  /** 로그인 상태 확인 */
  isLoggedIn: () => App.storage.get(App.storage.keys.login) === 'true',

  /**
   * 전체 회원 목록 조회.
   * users 배열이 아직 없는 구버전 환경에서도 빈 배열을 반환해 안전하게 동작시킨다.
   */
  getUsers: () => App.storage.getJson(App.storage.keys.users, []),

  /** 전체 회원 목록 저장 */
  setUsers: (users = []) => App.storage.setJson(App.storage.keys.users, users),

  /**
   * 현재 로그인 사용자 조회.
   *
   * 1) 새 구조: savedUser 객체 우선
   * 2) 구버전 호환: savedId/savedPw/savedNn 조합 fallback
   *
   * 이렇게 해두면 예전 데이터가 남아 있어도 프로젝트가 바로 망가지지 않는다.
   */
  getSavedUser: () => {
    const savedUser = App.storage.getJson(App.storage.keys.savedUser, null);

    // savedUser 가 정상 객체면 새 구조를 우선 사용.
    if (savedUser && typeof savedUser === 'object') {
      return {
        loginId: savedUser.loginId || '',
        password: savedUser.password || '',
        nickname: savedUser.nickname || '',
      };
    }

    // savedUser 가 없거나 깨졌더라도 앱이 죽지 않도록
    // 예전 키(savedId / savedPw / savedNn)로 fallback 한다.
    return {
      loginId: App.storage.get(App.storage.keys.savedId, ''),
      password: App.storage.get(App.storage.keys.savedPw, ''),
      nickname: App.storage.get(App.storage.keys.savedNickname, ''),
    };
  },

  /**
   * 현재 로그인 사용자 저장.
   *
   * savedUser 객체를 저장하면서,
   * 기존 화면 코드가 읽는 savedId / savedPw / savedNn 도 같이 맞춰 준다.
   * 즉 "새 구조 + 구버전 호환"을 동시에 만족시키는 브리지 함수다.
   */
  setSavedUser: (user = {}) => {
    // user 가 비어 있으면 세션을 남기지 않고 정리한다.
    if (!user || typeof user !== 'object') {
      App.storage.remove(App.storage.keys.savedUser);
      App.storage.remove(App.storage.keys.savedId);
      App.storage.remove(App.storage.keys.savedPw);
      App.storage.remove(App.storage.keys.savedNickname);
      return;
    }

    const normalizedUser = {
      loginId: user.loginId || '',
      password: user.password || '',
      nickname: user.nickname || '',
    };

    App.storage.setJson(App.storage.keys.savedUser, normalizedUser);
    App.storage.set(App.storage.keys.savedId, normalizedUser.loginId);
    App.storage.set(App.storage.keys.savedPw, normalizedUser.password);
    App.storage.set(App.storage.keys.savedNickname, normalizedUser.nickname);
  },

  /**
   * 로그인 관련 상태 제거.
   *
   * 로그아웃 시 회원 목록(users)은 지우면 안 된다.
   * 현재 로그인한 사용자 정보만 제거해야 한다.
   */
  clearCurrentUserSession: () => {
    App.storage.remove(App.storage.keys.login);
    App.storage.remove(App.storage.keys.savedUser);
    App.storage.remove(App.storage.keys.savedId);
    App.storage.remove(App.storage.keys.savedPw);
    App.storage.remove(App.storage.keys.savedNickname);
  },

  /**
   * 현재 로그인 ID 조회.
   *
   * private 필터 / 마이페이지 / 등록 소유자 비교에서 계속 쓰는 값이므로,
   * 여기서 빈 문자열까지 안전하게 보장해 두면 다른 파일이 단순해진다.
   */
  getCurrentLoginId: () => {
    const savedUser = App.storage.getSavedUser();
    return savedUser?.loginId || '';
  },
};
