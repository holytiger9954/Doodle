/**
 * 사용자 등록 스팟 API 계층.
 * local/server 모두 같은 인터페이스를 쓰도록 구성한다.
 */
App.spotApi = {
  /** 사용자가 저장한 스팟 목록 조회 */
  listUserSpots: async () => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots/mine');
    }
    return App.storage.getJson(App.storage.keys.userSpots, []);
  },

  /** 스팟 1건 저장 */
  saveUserSpot: async (spot) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots', {
        method: 'POST',
        body: JSON.stringify(spot),
      });
    }

    const spots = App.storage.getJson(App.storage.keys.userSpots, []);
    spots.push(spot);
    App.storage.setJson(App.storage.keys.userSpots, spots);
    return { success: true, data: spot };
  },
};
