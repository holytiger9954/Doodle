/**
 * localStorage 래퍼.
 * key 이름과 JSON 처리 로직을 한곳으로 모아 중복을 제거한다.
 */
App.storage = {
  keys: {
    savedId: 'savedId',
    savedPw: 'savedPw',
    savedNickname: 'savedNn',
    login: 'login',
    userSpots: 'userSpots',
    favoriteSpotsByUser: 'favoriteSpotsByUser',
  },
  get: (key, fallback = '') => localStorage.getItem(key) ?? fallback,
  set: (key, value) => localStorage.setItem(key, value),
  getJson: (key, fallback = []) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error('[storage.getJson] JSON 파싱 실패', error);
      return fallback;
    }
  },
  setJson: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key),
  isLoggedIn: () => App.storage.get(App.storage.keys.login) === 'true',
  getSavedUser: () => ({
    loginId: App.storage.get(App.storage.keys.savedId),
    password: App.storage.get(App.storage.keys.savedPw),
    nickname: App.storage.get(App.storage.keys.savedNickname),
  }),
  getCurrentLoginId: () => App.storage.get(App.storage.keys.savedId),
};
