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

    const savedUser = App.storage.getSavedUser();
    const spots = App.storage.getJson(App.storage.keys.userSpots, []);
    const spotWithOwner = {
      ...spot,
      ownerId: savedUser.loginId || '',
      ownerNickname: savedUser.nickname || '게스트',
      createdAt: spot.createdAt || new Date().toISOString(),
    };
    spots.push(spotWithOwner);
    App.storage.setJson(App.storage.keys.userSpots, spots);
    return { success: true, data: spotWithOwner };
  },

  /** 내 등록 스팟만 반환 */
  listMySpots: async () => {
    const loginId = App.storage.getCurrentLoginId();
    const spots = await App.spotApi.listUserSpots();
    if (!loginId) return [];
    return spots.filter((spot) => spot.ownerId === loginId);
  },

  /** 찜 목록 조회: 로그인 사용자 기준으로만 분리 */
  listFavoriteSpots: async () => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots/favorites');
    }

    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) return [];
    const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
    return favoriteMap[loginId] || [];
  },

  /** 특정 장소가 내 찜 목록에 있는지 확인 */
  isFavoriteSpot: async (spot) => {
    const favorites = await App.spotApi.listFavoriteSpots();
    return favorites.some((item) => App.spotApi.getSpotIdentity(item) === App.spotApi.getSpotIdentity(spot));
  },

  /** 찜 토글 */
  toggleFavoriteSpot: async (spot) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify(spot),
      });
    }

    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) {
      return { success: false, message: '로그인 후 이용할 수 있습니다.' };
    }

    const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
    const currentFavorites = favoriteMap[loginId] || [];
    const spotId = App.spotApi.getSpotIdentity(spot);
    const exists = currentFavorites.some((item) => App.spotApi.getSpotIdentity(item) === spotId);

    favoriteMap[loginId] = exists
      ? currentFavorites.filter((item) => App.spotApi.getSpotIdentity(item) !== spotId)
      : [...currentFavorites, { ...spot }];

    App.storage.setJson(App.storage.keys.favoriteSpotsByUser, favoriteMap);

    return {
      success: true,
      isFavorite: !exists,
      message: exists ? '찜 목록에서 제거했습니다.' : '찜 목록에 추가했습니다.',
    };
  },



  /** 내가 등록한 스팟 삭제 */
  deleteMySpot: async (spotOrIdentity) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots/mine', {
        method: 'DELETE',
        body: JSON.stringify({ id: typeof spotOrIdentity === 'string' ? spotOrIdentity : App.spotApi.getSpotIdentity(spotOrIdentity) }),
      });
    }

    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) {
      return { success: false, message: '로그인 후 이용할 수 있습니다.' };
    }

    const targetId = typeof spotOrIdentity === 'string'
      ? spotOrIdentity
      : App.spotApi.getSpotIdentity(spotOrIdentity);

    const spots = App.storage.getJson(App.storage.keys.userSpots, []);
    const targetSpot = spots.find((spot) => App.spotApi.getSpotIdentity(spot) === targetId);

    if (!targetSpot) {
      return { success: false, message: '삭제할 장소를 찾지 못했습니다.' };
    }

    if (targetSpot.ownerId !== loginId) {
      return { success: false, message: '내가 등록한 장소만 삭제할 수 있습니다.' };
    }

    const nextSpots = spots.filter((spot) => App.spotApi.getSpotIdentity(spot) !== targetId);
    App.storage.setJson(App.storage.keys.userSpots, nextSpots);

    const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
    Object.keys(favoriteMap).forEach((userId) => {
      favoriteMap[userId] = (favoriteMap[userId] || []).filter((spot) => App.spotApi.getSpotIdentity(spot) !== targetId);
    });
    App.storage.setJson(App.storage.keys.favoriteSpotsByUser, favoriteMap);

    return { success: true, message: '삭제되었습니다.', removedSpot: targetSpot, removedSpotId: targetId };
  },

  /** 현재 로그인 사용자가 등록한 장소인지 여부 */
  isOwnedByCurrentUser: (spot = {}) => {
    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) return false;
    return !!spot.ownerId && spot.ownerId === loginId;
  },

  /** 지도 기본 화면에 보여줄 전체 마커 집합 */
  listDefaultVisibleSpots: async () => {
    const baseItems = App.categoryData.getAllBaseItems();
    const userSpots = await App.spotApi.listUserSpots();
    return App.spotApi.dedupeSpots([...baseItems, ...userSpots]);
  },

  dedupeSpots: (items = []) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = App.spotApi.getSpotIdentity(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  getSpotIdentity: (spot = {}) => {
    const title = spot.title || '';
    const lat = spot.latitude ?? '';
    const lng = spot.longitude ?? '';
    return `${title}::${lat}::${lng}`;
  },

  normalizeHashtags: (raw = '') => {
    if (Array.isArray(raw)) {
      return [...new Set(raw.map((tag) => `#${String(tag).replace(/^#+/, '').trim()}`).filter((tag) => tag !== '#'))];
    }

    return [...new Set(String(raw)
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => `#${tag.replace(/^#+/, '')}`)
      .filter((tag) => tag !== '#'))];
  },

  getTagRanking: async (limit = 10) => {
    const allSpots = await App.spotApi.listDefaultVisibleSpots();
    const counts = {};
    allSpots.forEach((spot) => {
      App.spotApi.normalizeHashtags(spot.hashtags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'))
      .slice(0, limit);
  },

  filterSpotsByTag: async (tag) => {
    const normalized = App.spotApi.normalizeHashtags([tag])[0];
    const allSpots = await App.spotApi.listDefaultVisibleSpots();
    return allSpots.filter((spot) => App.spotApi.normalizeHashtags(spot.hashtags || []).includes(normalized));
  }
};
