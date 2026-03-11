/**
 * 사용자 등록 스팟 API 계층.
 *
 * 이 프로젝트는 현재 localStorage 기반으로 동작한다.
 * 즉, 실제 서버 권한 검증은 없고 "화면에 어떻게 보여줄지"를
 * 이 파일에서 정책처럼 관리하는 구조라고 보면 된다.
 *
 * 중요한 원칙
 * 1) 저장 구조 표준화도 여기서 한다.
 * 2) 공개/비공개 판단도 여기서 한다.
 * 3) 지도/검색/랭킹/UI 파일들은 가능하면 이 파일의 결과만 사용한다.
 *
 * 이렇게 해야 팀원이 각 페이지에서 private 조건을 중복으로 읽지 않아도 되고,
 * 나중에 정책이 바뀌어도 한 곳만 고치면 된다.
 */
App.spotApi = {
  /**
   * localStorage에 저장된 "사용자 등록 스팟 전체"를 가져온다.
   *
   * 주의:
   * - 이 함수는 아직 공개/비공개 필터를 하지 않는다.
   * - 말 그대로 저장소에 있는 원본 목록(raw data) 용도다.
   * - 화면 표시용은 listVisibleUserSpots(), listPublicSpots() 등을 사용하는 것이 더 안전하다.
   */
  listUserSpots: async () => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots/mine');
    }
    return App.storage.getJson(App.storage.keys.userSpots, []);
  },

  /**
   * 스팟 1건 저장.
   *
   * register 페이지에서 넘어오는 데이터 형식이 조금 달라도
   * 여기서 저장 포맷을 최대한 표준화한다.
   *
   * 현재 표준 필드
   * - title
   * - description
   * - latitude / longitude
   * - Category
   * - hashtags
   * - private        : 공개/비공개 boolean
   * - ownerId        : 등록자 ID
   * - ownerNickname  : 등록자 닉네임
   * - createdAt      : 등록 시각
   *
   * 참고:
   * 기존 팀원 코드에는 user, isPrivate 같은 이름이 섞여 있을 수 있다.
   * 저장 시점에 여기서 private / ownerId 형식으로 맞춰두면 이후 코드가 훨씬 읽기 쉬워진다.
   */
  saveUserSpot: async (spot) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots', {
        method: 'POST',
        body: JSON.stringify(spot),
      });
    }

    const savedUser = App.storage.getSavedUser();
    const spots = App.storage.getJson(App.storage.keys.userSpots, []);

    const normalizedSpot = {
      ...spot,
      spotKey: String(spot.spotKey || spot.id || `spot_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`),
      title: String(spot.title || spot.content || '').trim(),
      description: String(spot.description || spot.content || spot.title || '').trim(),
      address: spot.address || '',
      latitude: Number(spot.latitude),
      longitude: Number(spot.longitude),
      Category: spot.Category || spot.category || '미분류',
      category: spot.category || spot.Category || '미분류',
      hashtags: App.spotApi.normalizeHashtags(spot.hashtags || spot.tags || []),
      // 이전 코드 호환: private / isPrivate 둘 중 하나가 들어와도 저장 시 private 하나로 통일한다.
      private: spot.private === true || spot.isPrivate === true,
      ownerId: spot.ownerId || spot.user || savedUser.loginId || '',
      ownerNickname: spot.ownerNickname || savedUser.nickname || '게스트',
      createdAt: spot.createdAt || new Date().toISOString(),
      isHidden: spot.isHidden === true,
      hiddenAt: spot.hiddenAt || null,
    };

    spots.push(normalizedSpot);
    App.storage.setJson(App.storage.keys.userSpots, spots);
    return { success: true, data: normalizedSpot };
  },

  /**
   * 내 등록 스팟만 반환.
   *
   * "나만의 스팟" 화면은 당연히 로그인 사용자가 직접 등록한 것만 보면 되므로
   * ownerId 기준으로 필터링한다.
   */
  listMySpots: async () => {
    const loginId = App.storage.getCurrentLoginId();
    const spots = await App.spotApi.listUserSpots();
    if (!loginId) return [];
    return spots.filter((spot) => App.spotApi.getSpotOwnerId(spot) === loginId && !App.spotApi.isHiddenSpot(spot));
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
    return favorites.some((item) => App.spotApi.isSameSpot(item, spot));
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
    const spotId = App.spotApi.getSpotStableId(spot);
    const exists = currentFavorites.some((item) => App.spotApi.getSpotStableId(item) === spotId);
    const normalizedSpot = { ...spot, spotKey: App.spotApi.getSpotStableId(spot) };

    favoriteMap[loginId] = exists
      ? currentFavorites.filter((item) => App.spotApi.getSpotStableId(item) !== spotId)
      : [...currentFavorites, normalizedSpot];

    App.storage.setJson(App.storage.keys.favoriteSpotsByUser, favoriteMap);

    return {
      success: true,
      isFavorite: !exists,
      message: exists ? '찜 목록에서 제거했습니다.' : '찜 목록에 추가했습니다.',
    };
  },

  /**
   * 내가 등록한 스팟 삭제.
   *
   * 삭제도 ownerId 기준으로만 허용한다.
   * localStorage 기반이므로 완전한 보안은 아니지만,
   * 프로젝트 수준에서는 "내가 등록한 항목만 UI에서 지울 수 있게" 제어하는 용도다.
   */
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
      : App.spotApi.getSpotStableId(spotOrIdentity);

    const spots = App.storage.getJson(App.storage.keys.userSpots, []);
    const targetSpot = spots.find((spot) => App.spotApi.getSpotStableId(spot) === targetId || App.spotApi.getSpotIdentity(spot) === targetId);

    if (!targetSpot) {
      return { success: false, message: '삭제할 장소를 찾지 못했습니다.' };
    }

    if (App.spotApi.getSpotOwnerId(targetSpot) !== loginId) {
      return { success: false, message: '내가 등록한 장소만 삭제할 수 있습니다.' };
    }

    const nextSpots = spots.filter((spot) => App.spotApi.getSpotStableId(spot) !== targetId && App.spotApi.getSpotIdentity(spot) !== targetId);
    App.storage.setJson(App.storage.keys.userSpots, nextSpots);

    // 삭제된 스팟이 다른 사용자의 찜 목록에 남아 있지 않도록 함께 정리한다.
    const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
    Object.keys(favoriteMap).forEach((userId) => {
      favoriteMap[userId] = (favoriteMap[userId] || []).filter((spot) => App.spotApi.getSpotStableId(spot) !== targetId && App.spotApi.getSpotIdentity(spot) !== targetId);
    });
    App.storage.setJson(App.storage.keys.favoriteSpotsByUser, favoriteMap);

    if (App.commentApi?.removeCommentsBySpot) {
      App.commentApi.removeCommentsBySpot(targetId);
    }

    return { success: true, message: '삭제되었습니다.', removedSpot: targetSpot, removedSpotId: targetId };
  },


  /**
   * 장소 식별키로 사용자 등록 스팟 1건을 찾는다.
   *
   * 등록 수정 모달에서 기존 데이터를 미리 채울 때 사용한다.
   * 기본 제공 데이터는 수정 대상이 아니므로 userSpots 저장소에서만 찾는다.
   */
  findUserSpotByIdentity: async (spotIdentity = '') => {
    const targetId = String(spotIdentity || '').trim();
    if (!targetId) return null;
    const spots = await App.spotApi.listUserSpots();
    return spots.find((spot) => App.spotApi.getSpotStableId(spot) === targetId || App.spotApi.getSpotIdentity(spot) === targetId) || null;
  },

  /**
   * 내가 등록한 스팟 수정.
   *
   * 수정 가능한 필드만 바꾸고, 스팟의 정체성에 가까운 값은 보존한다.
   * - 유지: latitude / longitude / ownerId / ownerNickname / createdAt
   * - 수정: title / description / Category / hashtags / private
   */
  updateMySpot: async (payload = {}) => {
    if (App.config.apiMode === 'server') {
      return App.http.request('/spots/mine', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }

    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) {
      return { success: false, message: '로그인 후 이용할 수 있습니다.' };
    }

    const targetId = String(payload.spotId || '').trim();
    if (!targetId) {
      return { success: false, message: '수정할 장소를 찾지 못했습니다.' };
    }

    const spots = App.storage.getJson(App.storage.keys.userSpots, []);
    const targetIndex = spots.findIndex((spot) => App.spotApi.getSpotStableId(spot) === targetId || App.spotApi.getSpotIdentity(spot) === targetId);

    if (targetIndex === -1) {
      return { success: false, message: '수정할 장소를 찾지 못했습니다.' };
    }

    const originalSpot = spots[targetIndex];
    if (App.spotApi.getSpotOwnerId(originalSpot) !== loginId) {
      return { success: false, message: '내가 등록한 장소만 수정할 수 있습니다.' };
    }

    const updatedSpot = {
      ...originalSpot,
      spotKey: originalSpot.spotKey || App.spotApi.getSpotStableId(originalSpot),
      title: String(payload.title || originalSpot.title || '').trim(),
      description: String(payload.description || originalSpot.description || '').trim(),
      Category: payload.Category || payload.category || originalSpot.Category || originalSpot.category || '미분류',
      category: payload.category || payload.Category || originalSpot.category || originalSpot.Category || '미분류',
      hashtags: App.spotApi.normalizeHashtags(payload.hashtags ?? originalSpot.hashtags ?? []),
      private: payload.private === true || payload.isPrivate === true,
      // 주소/좌표/소유자/등록일은 유지
      address: originalSpot.address || '',
      latitude: Number(originalSpot.latitude),
      longitude: Number(originalSpot.longitude),
      ownerId: originalSpot.ownerId || loginId,
      ownerNickname: originalSpot.ownerNickname || App.storage.getSavedUser()?.nickname || '게스트',
      createdAt: originalSpot.createdAt,
      updatedAt: new Date().toISOString(),
      isHidden: originalSpot.isHidden === true,
      hiddenAt: originalSpot.hiddenAt || null,
    };

    spots[targetIndex] = updatedSpot;
    App.storage.setJson(App.storage.keys.userSpots, spots);

    // 제목 변경 시 장소 식별키가 바뀔 수 있으므로
    // 찜 목록에 저장된 동일 장소 객체도 함께 최신 값으로 치환한다.
    const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
    Object.keys(favoriteMap).forEach((userId) => {
      favoriteMap[userId] = (favoriteMap[userId] || []).map((favoriteSpot) => {
        const sameStableId = App.spotApi.getSpotStableId(favoriteSpot) === targetId;
        const sameLegacyIdentity = App.spotApi.getSpotIdentity(favoriteSpot) === targetId;
        return (sameStableId || sameLegacyIdentity)
          ? { ...updatedSpot }
          : favoriteSpot;
      });
    });
    App.storage.setJson(App.storage.keys.favoriteSpotsByUser, favoriteMap);

    return {
      success: true,
      message: '정보가 수정되었습니다.',
      data: updatedSpot,
      previousSpotId: targetId,
      nextSpotId: App.spotApi.getSpotStableId(updatedSpot),
      nextSpotIdentity: App.spotApi.getSpotIdentity(updatedSpot),
    };
  },

  /**
   * 현재 로그인 사용자가 등록한 장소인지 여부.
   *
   * ownerId가 현재 로그인 ID와 같으면 true.
   * 예전 코드의 user 필드가 남아 있어도 getSpotOwnerId()가 흡수한다.
   */
  isOwnedByCurrentUser: (spot = {}) => {
    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) return false;
    return App.spotApi.getSpotOwnerId(spot) === loginId;
  },

  /**
   * 스팟의 작성자 ID를 읽어오는 호환 함수.
   *
   * 이유:
   * - 예전 코드: user
   * - 현재 구조: ownerId
   *
   * 두 구조가 잠시 섞여 있어도 이 함수만 통해 읽으면 팀원이 덜 헷갈린다.
   */
  getSpotOwnerId: (spot = {}) => spot.ownerId || spot.user || '',

  /**
   * 공개/비공개 여부를 표준화해서 읽는다.
   *
   * 이유:
   * - 예전 파일은 private
   * - 일부 리팩터링 과정에서는 isPrivate를 쓰고 있음
   *
   * 읽는 쪽에서 둘 다 매번 신경 쓰지 않도록 여기서 흡수한다.
   */
  isPrivateSpot: (spot = {}) => spot.private === true || spot.isPrivate === true,

  /** 운영 숨김 여부 */
  isHiddenSpot: (spot = {}) => spot.isHidden === true,

  /**
   * 현재 로그인 사용자가 이 스팟을 볼 수 있는지 판단한다.
   *
   * 정책:
   * - 공개 스팟은 모두 볼 수 있다.
   * - 비공개 스팟은 등록자 본인만 볼 수 있다.
   * - 로그인하지 않았으면 다른 사람 비공개 스팟은 볼 수 없다.
   *
   * 이 함수가 현재 프로젝트의 공개/비공개 "핵심 정책"이다.
   */
  canViewSpot: (spot = {}) => {
    if (App.spotApi.isHiddenSpot(spot)) return false;
    if (!App.spotApi.isPrivateSpot(spot)) return true;

    const loginId = App.storage.getCurrentLoginId();
    if (!loginId) return false;

    return App.spotApi.getSpotOwnerId(spot) === loginId;
  },

  /**
   * 사용자 등록 스팟 중 "현재 사용자에게 보여도 되는 것"만 반환.
   *
   * 지도 기본 화면, 내부 검색, 태그 필터 등에서 이 함수를 쓰면
   * 각 화면에서 private 조건을 다시 쓰지 않아도 된다.
   */
  listVisibleUserSpots: async () => {
    const spots = await App.spotApi.listUserSpots();
    return spots.filter((spot) => App.spotApi.canViewSpot(spot));
  },

  /**
   * 공개 스팟만 반환.
   *
   * 랭킹은 비공개 태그가 노출되면 존재 자체가 유출될 수 있으므로
   * 현재 정책상 공개 데이터만 집계 대상으로 사용한다.
   */
  listPublicUserSpots: async () => {
    const spots = await App.spotApi.listUserSpots();
    return spots.filter((spot) => !App.spotApi.isPrivateSpot(spot) && !App.spotApi.isHiddenSpot(spot));
  },

  /** 관리자용 전체 사용자 스팟 목록(raw). */
  listAdminUserSpots: async () => App.spotApi.listUserSpots(),

  /**
   * 지도 기본 화면에 보여줄 전체 마커 집합.
   *
   * 구성:
   * - 기본 제공 카테고리 데이터(공용)
   * - 현재 사용자 기준으로 볼 수 있는 사용자 등록 스팟
   */
  listDefaultVisibleSpots: async () => {
    const baseItems = App.categoryData.getAllBaseItems();
    const userSpots = await App.spotApi.listVisibleUserSpots();
    return App.spotApi.dedupeSpots([...baseItems, ...userSpots]);
  },

  /**
   * 랭킹 집계용 공개 스팟 집합.
   *
   * 기본 데이터 + 공개 사용자 스팟만 포함한다.
   */
  listPublicSpots: async () => {
    const baseItems = App.categoryData.getAllBaseItems();
    const userSpots = await App.spotApi.listPublicUserSpots();
    return App.spotApi.dedupeSpots([...baseItems, ...userSpots]);
  },


  /**
   * 기본 데이터 + 사용자 등록 데이터를 합친 전체 스팟 목록.
   *
   * 마이페이지의 내 댓글처럼 특정 장소 원본을 다시 찾을 때 사용한다.
   */
  listAllSpots: async () => {
    const baseItems = App.categoryData.getAllBaseItems();
    const userSpots = await App.spotApi.listUserSpots();
    return App.spotApi.dedupeSpots([...baseItems, ...userSpots]);
  },

  /**
   * stable id 또는 기존 identity로 스팟 1건을 찾는다.
   */
  findSpotByStableId: async (spotId = '') => {
    const targetId = String(spotId || '').trim();
    if (!targetId) return null;

    const allSpots = await App.spotApi.listAllSpots();
    const foundSpot = allSpots.find((spot) => (
      App.spotApi.getSpotStableId(spot) === targetId
      || App.spotApi.getSpotIdentity(spot) === targetId
    )) || null;

    if (!foundSpot) return null;
    const isUserSpot = Boolean(foundSpot.ownerId || foundSpot.user || foundSpot.private === true || foundSpot.isPrivate === true || foundSpot.isHidden === true);
    if (isUserSpot && !App.spotApi.canViewSpot(foundSpot)) return null;
    return foundSpot;
  },

  /** 관리자 숨김 처리 */
  hideSpotByAdmin: async (spotOrId = '') => {
    const targetId = typeof spotOrId === 'string' ? String(spotOrId || '').trim() : App.spotApi.getSpotStableId(spotOrId);
    if (!targetId) return { success: false, message: '대상을 찾지 못했습니다.' };
    const spots = await App.spotApi.listUserSpots();
    const index = spots.findIndex((spot) => App.spotApi.getSpotStableId(spot) === targetId || App.spotApi.getSpotIdentity(spot) === targetId);
    if (index === -1) return { success: false, message: '대상을 찾지 못했습니다.' };
    spots[index] = { ...spots[index], isHidden: true, hiddenAt: new Date().toISOString() };
    App.storage.setJson(App.storage.keys.userSpots, spots);
    return { success: true, message: '장소를 숨김 처리했습니다.', data: spots[index] };
  },

  /** 관리자 숨김 해제 */
  unhideSpotByAdmin: async (spotOrId = '') => {
    const targetId = typeof spotOrId === 'string' ? String(spotOrId || '').trim() : App.spotApi.getSpotStableId(spotOrId);
    if (!targetId) return { success: false, message: '대상을 찾지 못했습니다.' };
    const spots = await App.spotApi.listUserSpots();
    const index = spots.findIndex((spot) => App.spotApi.getSpotStableId(spot) === targetId || App.spotApi.getSpotIdentity(spot) === targetId);
    if (index === -1) return { success: false, message: '대상을 찾지 못했습니다.' };
    spots[index] = { ...spots[index], isHidden: false, hiddenAt: null };
    App.storage.setJson(App.storage.keys.userSpots, spots);
    return { success: true, message: '장소 숨김을 해제했습니다.', data: spots[index] };
  },

  /** 관리자 삭제 */
  deleteSpotByAdmin: async (spotOrId = '') => {
    const targetId = typeof spotOrId === 'string' ? String(spotOrId || '').trim() : App.spotApi.getSpotStableId(spotOrId);
    if (!targetId) return { success: false, message: '대상을 찾지 못했습니다.' };

    const spots = App.storage.getJson(App.storage.keys.userSpots, []);
    const targetSpot = spots.find((spot) => App.spotApi.getSpotStableId(spot) === targetId || App.spotApi.getSpotIdentity(spot) === targetId);
    if (!targetSpot) return { success: false, message: '삭제할 장소를 찾지 못했습니다.' };

    App.storage.setJson(App.storage.keys.userSpots, spots.filter((spot) => App.spotApi.getSpotStableId(spot) !== targetId && App.spotApi.getSpotIdentity(spot) !== targetId));

    const favoriteMap = App.storage.getJson(App.storage.keys.favoriteSpotsByUser, {});
    Object.keys(favoriteMap).forEach((userId) => {
      favoriteMap[userId] = (favoriteMap[userId] || []).filter((spot) => App.spotApi.getSpotStableId(spot) !== targetId && App.spotApi.getSpotIdentity(spot) !== targetId);
    });
    App.storage.setJson(App.storage.keys.favoriteSpotsByUser, favoriteMap);

    if (App.commentApi?.removeCommentsBySpot) App.commentApi.removeCommentsBySpot(targetId);
    if (App.reportApi?.removeReportsBySpot) App.reportApi.removeReportsBySpot(targetId);

    return { success: true, message: '장소를 삭제했습니다.', removedSpotId: targetId, removedSpot: targetSpot };
  },

  /**
   * 동일 장소 중복 제거.
   *
   * title + 좌표를 묶어서 같은 장소로 취급한다.
   * 데이터 저장소와 화면 데이터가 섞일 때 중복 마커가 생기는 것을 줄여준다.
   */
  dedupeSpots: (items = []) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = App.spotApi.getSpotIdentity(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  /**
   * 장소 식별 키 생성.
   *
   * 현재 프로젝트에는 고유 DB id가 없으므로
   * 제목 + 좌표 조합을 임시 식별자로 사용한다.
   */
  getSpotIdentity: (spot = {}) => {
    const title = spot.title || '';
    const lat = spot.latitude ?? '';
    const lng = spot.longitude ?? '';
    return `${title}::${lat}::${lng}`;
  },



  /**
   * 스팟의 안정 식별자.
   *
   * v24 수정 보강:
   * 제목(title)은 수정 가능하므로 title+좌표 identity만으로는
   * 수정/찜/삭제 추적이 흔들릴 수 있다.
   * 그래서 저장 시 내부용 spotKey를 부여하고, 없으면 기존 identity로 폴백한다.
   */
  getSpotStableId: (spot = {}) => String(spot.spotKey || spot.id || App.spotApi.getSpotIdentity(spot)),

  /** 두 스팟이 같은 내부 개체인지 비교 */
  isSameSpot: (left = {}, right = {}) => (
    App.spotApi.getSpotStableId(left) === App.spotApi.getSpotStableId(right)
    || App.spotApi.getSpotIdentity(left) === App.spotApi.getSpotIdentity(right)
  ),
  /**
   * 해시태그 정규화.
   *
   * 입력 예시
   * - "맛집 데이트"
   * - "#맛집, #데이트"
   * - ["맛집", "#데이트"]
   *
   * 출력 예시
   * - ["#맛집", "#데이트"]
   */
  normalizeHashtags: (raw = '') => {
    if (Array.isArray(raw)) {
      return [...new Set(raw
        .flatMap((tag) => String(tag).split('#'))
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => `#${tag.replace(/^#+/, '')}`)
        .filter((tag) => tag !== '#'))];
    }

    // [v9 해시태그 수정] 공백/쉼표뿐 아니라 붙여 쓴 #태그도 안정적으로 분리한다.
    // 예: "#카페#데이트 #맛집" -> ["#카페", "#데이트", "#맛집"]
    return [...new Set(String(raw)
      .split('#')
      .map((tag) => tag.trim())
      .flatMap((tag) => tag.split(/[\s,]+/))
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => `#${tag.replace(/^#+/, '')}`)
      .filter((tag) => tag !== '#'))];
  },

  /**
   * 해시태그 랭킹 계산.
   *
   * 중요:
   * - 현재 정책상 랭킹은 공개 스팟만 집계한다.
   * - 비공개 스팟 태그가 랭킹에 보이면 비공개 의미가 약해지기 때문이다.
   */
  getTagRanking: async (limit = 10) => {
    const allSpots = await App.spotApi.listPublicSpots();
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

  /**
   * 태그 기반 스팟 필터.
   *
   * 현재 사용자에게 실제로 보이는 스팟만 대상으로 검색한다.
   * 즉, 다른 사람 비공개 스팟은 여기서도 빠진다.
   */
  filterSpotsByTag: async (tagOrTags) => {
    const normalizedTags = App.spotApi.normalizeHashtags(Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags]);
    const allSpots = await App.spotApi.listDefaultVisibleSpots();
    if (!normalizedTags.length) return allSpots;

    return allSpots.filter((spot) => {
      const tags = App.spotApi.normalizeHashtags(spot.hashtags || []);
      if (App.config.rankingMultiSelectMode === 'and') {
        return normalizedTags.every((tag) => tags.includes(tag));
      }
      return normalizedTags.some((tag) => tags.includes(tag));
    });
  }
};
