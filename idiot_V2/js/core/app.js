window.App = window.App || {};

/**
 * 앱 설정값.
 * - apiMode: local/server 전환 포인트
 * - defaultCenter: 지도 기본 중심 좌표
 * - searchZoomLevel: 검색 이동 후 확대 레벨
 * - singleMarkerZoomLevel: 단일 위치 선택 시 확대 레벨
 */
App.config = {
  apiMode: 'local',
  apiBaseUrl: 'http://localhost:15180/api/v1',
  defaultCenter: { lat: 36.8115, lng: 127.1462 },
  searchZoomLevel: 3,
  singleMarkerZoomLevel: 1,
};

/** 앱 공통 상수. */
App.const = {
  messageType: {
    CLOSE_REGISTER: 'closeRegister',
    NEW_MARKER: 'newMarker',
    SELECT_LOCATION: 'selectLocation',
    SELECT_CATEGORY: 'selectCategory',
    OPEN_MODAL: 'openModal',
    SPOTS_CHANGED: 'spotsChanged',
  },
};

/** 런타임 상태 저장소. */
App.state = {
  map: null,
  locationMarker: null,
  isRegisterMode: false,
  markers: [],
  registeredMarkers: [],
  activeCategoryIndex: -1,
  activeInfoOverlay: null,
};
