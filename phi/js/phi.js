let map;
let marker; // 여기서 생성하지 않고 선언만 합니다.

// ===== DD/PHI Front-only state =====
const STORAGE_KEY_SPOTS = "dd_phi_spots_v1";
let isRegisterMode = false;
let spotMarkers = [];

// 1. 카카오 맵 API 로드 보장
kakao.maps.load(() => {
    const mapbox = document.getElementById('map');
    if (!mapbox) {
        console.error("지도를 담을 div(#map)를 찾을 수 없습니다.");
        return;
    }
    
    const options = {
        center: new kakao.maps.LatLng(37.5668, 126.9786),
        level: 3
    };
    map = new kakao.maps.Map(mapbox, options);
    
    // API 로드 완료 후 마커 생성
    marker = new kakao.maps.Marker(); 

    // 초기 위치 시도
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const loc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            displayMarker(loc);
        });
    }
    
    // 사이드바 이벤트 연결
    bindEvents(); 

    // 스팟(로컬) 로드 + 마커 표시 + 랭킹 초기 렌더
    renderSpotsFromStorage();
    renderTagTop10();

    // 등록 모드: 지도 클릭으로 스팟 등록
    kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
        if (!isRegisterMode) return;
        const latlng = mouseEvent.latLng;
        openQuickSpotPrompt(latlng);
    });
});

// 2. 마커 표시 함수
function displayMarker(loc) {
    if (marker) {
        marker.setPosition(loc);
        marker.setMap(map);
        map.setCenter(loc);
    }
}

// 3. 이벤트 바인딩 (HTML에 이미 버튼이 있으므로 중복 생성하지 않음)
function bindEvents() {
    const sidebar = document.querySelector('#sidebar');
    const btn = document.querySelector('#btn');
    const me = document.querySelector('#mylocation');
    const regBtn = document.querySelector('#regmode');

    // [사이드바 열기/닫기]
    if (btn && sidebar) {
        let sidebarFlag = true;
        btn.addEventListener('click', () => {
            if (sidebarFlag) {
                sidebar.classList.add('-open');
            } else {
                sidebar.classList.remove('-open');
            }
            sidebarFlag = !sidebarFlag;
        });
    }

    // [내 위치 찾기]
    if (me) {
        me.addEventListener('click', () => {
            navigator.geolocation.getCurrentPosition((pos) => {
                const myLoc = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                map.panTo(myLoc);
                map.setLevel(2);
            });
        });
    }

    // [등록 모드 토글]
    if (regBtn) {
        regBtn.addEventListener('click', () => {
            isRegisterMode = !isRegisterMode;
            regBtn.setAttribute('aria-pressed', String(isRegisterMode));
            regBtn.textContent = isRegisterMode ? '등록 모드 ON' : '등록 모드';
        });
    }
}

// ===== Spots / Ranking (Front-only) =====

function loadSpots() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_SPOTS);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to load spots from storage', e);
        return [];
    }
}

function saveSpots(spots) {
    localStorage.setItem(STORAGE_KEY_SPOTS, JSON.stringify(spots));
}

function normalizeTags(input) {
    const raw = String(input || '').trim();
    if (!raw) return [];
    // 공백/콤마/세미콜론 기준
    const tokens = raw
        .replace(/\n/g, ' ')
        .split(/[\s,;]+/g)
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

    // 중복 제거 + 소문자 정규화(표시용은 원형 유지가 더 좋지만, 집계는 lower)
    const seen = new Set();
    const out = [];
    for (const t of tokens) {
        const key = t.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(t);
    }
    return out;
}

function openQuickSpotPrompt(latlng) {
    // 최소 UX: prompt 3개 (향후 모달로 교체)
    const name = prompt('스팟 이름/메모를 입력해줘 (예: "시청 뒤 흡연구역")');
    if (name === null) return; // cancel
    const category = prompt('카테고리: smoke(흡연구역) 또는 my(나만의 스팟)', 'smoke');
    if (category === null) return;
    const tagsText = prompt('태그 입력 (예: #야경 #힐링, 혹은 야경 힐링)', '');
    if (tagsText === null) return;

    const spot = {
        id: `S_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: String(name).trim() || '무제 스팟',
        category: String(category).trim() || 'smoke',
        tags: normalizeTags(tagsText),
        lat: latlng.getLat(),
        lng: latlng.getLng(),
        createdAt: new Date().toISOString()
    };

    const spots = loadSpots();
    spots.push(spot);
    saveSpots(spots);

    // 새 마커 추가 + 랭킹 갱신
    addSpotMarker(spot);
    renderTagTop10(spots);
}

function addSpotMarker(spot) {
    if (!map) return;
    const pos = new kakao.maps.LatLng(spot.lat, spot.lng);
    const mk = new kakao.maps.Marker({ position: pos });
    mk.setMap(map);
    spotMarkers.push(mk);

    // 마커 클릭: 간단 안내 (상세/댓글 화면은 다음 단계)
    kakao.maps.event.addListener(mk, 'click', () => {
        const tagLine = (spot.tags && spot.tags.length) ? spot.tags.join(' ') : '(태그 없음)';
        alert(`[${spot.category}] ${spot.name}\n${tagLine}`);
    });
}

function clearSpotMarkers() {
    for (const mk of spotMarkers) mk.setMap(null);
    spotMarkers = [];
}

function renderSpotsFromStorage() {
    clearSpotMarkers();
    const spots = loadSpots();
    for (const s of spots) addSpotMarker(s);
}

function computeTagTop10(spots) {
    const rows = [];
    const counts = new Map();
    for (const s of spots) {
        for (const t of (s.tags || [])) {
            const key = String(t).toLowerCase();
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    for (const [k, v] of counts.entries()) rows.push([k, v]);
    rows.sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
    return rows.slice(0, 10);
}

function renderTagTop10(spotsOverride) {
    const listEl = document.getElementById('tag-top10');
    if (!listEl) return;
    const spots = Array.isArray(spotsOverride) ? spotsOverride : loadSpots();
    const top = computeTagTop10(spots);
    listEl.innerHTML = '';

    if (!top.length) {
        const li = document.createElement('li');
        li.className = 'dd-muted';
        li.textContent = '(아직 태그 없음)';
        listEl.appendChild(li);
        return;
    }

    for (const [tagLower, cnt] of top) {
        const li = document.createElement('li');
        li.className = 'dd-rank-item';
        const tagSpan = document.createElement('span');
        tagSpan.className = 'dd-rank-tag';
        tagSpan.textContent = tagLower;
        const countSpan = document.createElement('span');
        countSpan.className = 'dd-rank-count';
        countSpan.textContent = String(cnt);
        li.appendChild(tagSpan);
        li.appendChild(countSpan);
        listEl.appendChild(li);
    }
}

// [로그인 오버레이 제어]
// - inline style 남발 방지: class 토글로만 제어
function openLogin() {
    const el = document.getElementById('dd-overlay');
    if (!el) return;
    el.classList.add('-open');
}

function closeLogin() {
    const el = document.getElementById('dd-overlay');
    if (!el) return;
    el.classList.remove('-open');
}