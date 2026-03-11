/**
 * 카테고리 메타데이터와 기본 좌표 데이터.
 * 천안 시연 기준 더미 좌표 + 해시태그 더미를 함께 제공한다.
 *
 * 주의:
 * 기존 오류는 객체 리터럴을 만드는 도중에 App.categoryData.createItem(...)을
 * 바로 호출해서 생겼다. 객체가 아직 완성되기 전이라 App.categoryData가 undefined 상태였다.
 * 그래서 helper 함수를 먼저 만들고, 마지막에 App.categoryData에 묶는다.
 */
(function () {
  const categories = [
    { key: 'all', label: '전체', template: 'info.html', image: './img/icons/all.svg', markerImage: './img/markers/all.svg' },
    { key: 'hospital', label: '병원', template: 'info.html', image: './img/icons/hospital.svg', markerImage: './img/markers/hospital.svg' },
    { key: 'gym', label: '체육관', template: 'info.html', image: './img/icons/gym.svg', markerImage: './img/markers/gym.svg' },
    { key: 'police', label: '경찰서', template: 'info.html', image: './img/icons/police.svg', markerImage: './img/markers/police.svg' },
    { key: 'smoking', label: '흡연부스', template: 'info.html', image: './img/icons/smoking.svg', markerImage: './img/markers/smoking.svg' },
    { key: 'toilet', label: '공중 화장실', template: 'info.html', image: './img/icons/toilet.svg', markerImage: './img/markers/toilet.svg' },
    { key: 'mySpots', label: '공유 스팟', template: 'info.html', image: './img/icons/shared.svg', markerImage: './img/markers/shared.svg' },
  ];

  const categoryTagMap = {
    '병원': ['#의료', '#진료', '#응급'],
    '체육관': ['#운동', '#체육', '#활동'],
    '경찰서': ['#안전', '#치안', '#도움'],
    '흡연부스': ['#흡연', '#부스', '#휴식'],
    '공중 화장실': ['#화장실', '#편의', '#공공'],
    '나만의 스팟': ['#공유스팟', '#공유'],
    '모두의 스팟': ['#공유스팟', '#공유'],
    '공유 스팟': ['#공유스팟', '#공유'],
  };

  function normalizeHashtags(raw) {
    // spot.api.js가 먼저 로드되지만, 혹시라도 없을 경우를 위한 fallback까지 둔다.
    if (App?.spotApi?.normalizeHashtags) {
      return App.spotApi.normalizeHashtags(raw);
    }

    if (Array.isArray(raw)) {
      return [...new Set(raw.map((tag) => `#${String(tag).replace(/^#+/, '').trim()}`).filter((tag) => tag !== '#'))];
    }

    return [...new Set(String(raw || '')
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => `#${tag.replace(/^#+/, '')}`)
      .filter((tag) => tag !== '#'))];
  }

  function createItem(item) {
    const category = item.Category || item.category || '장소';
    const baseTags = categoryTagMap[category] || ['#추천'];
    const title = item.title || '';
    const extraTags = [];

    if (title.includes('역')) extraTags.push('#역근처');
    if (title.includes('시청')) extraTags.push('#중심지');
    if (title.includes('공원')) extraTags.push('#휴식');
    if (title.includes('대학') || title.includes('대학교')) extraTags.push('#대학가');
    if (title.includes('버스터미널')) extraTags.push('#교통');
    if (title.includes('KTX')) extraTags.push('#교통');

    return {
      ...item,
      description: item.description || `${category} 관련 기본 장소입니다.`,
      hashtags: normalizeHashtags(item.hashtags || [...baseTags, ...extraTags]),
    };
  }

  const hospitalItems = [
    { title: '단국대학교병원', latitude: 36.8405, longitude: 127.1731, Category: '병원', hashtags: ['#대학병원', '#응급', '#진료'] },
    { title: '순천향대학교 천안병원', latitude: 36.7990, longitude: 127.1352, Category: '병원', hashtags: ['#대학병원', '#진료', '#응급'] },
    { title: '천안충무병원', latitude: 36.8016, longitude: 127.1394, Category: '병원', hashtags: ['#의료', '#진료', '#응급'] },
    { title: '천안우리병원', latitude: 36.8153, longitude: 127.1128, Category: '병원', hashtags: ['#의료', '#진료', '#중심지'] },
    { title: '리앤리병원', latitude: 36.8105, longitude: 127.1082, Category: '병원', hashtags: ['#병원', '#진료', '#불당동'] },
    { title: '천안센텀정형외과', latitude: 36.8202, longitude: 127.1054, Category: '병원', hashtags: ['#정형외과', '#진료', '#운동부상'] },
    { title: '대전대 천안한방병원', latitude: 36.8242, longitude: 127.1475, Category: '병원', hashtags: ['#한방', '#진료', '#역근처'] },
    { title: '천안의료원', latitude: 36.7801, longitude: 127.1751, Category: '병원', hashtags: ['#공공의료', '#응급', '#의료'] },
  ].map(createItem);

  const gymItems = [
    { title: '천안종합운동장', latitude: 36.8214, longitude: 127.1082, Category: '체육관', hashtags: ['#운동', '#러닝', '#체육'] },
    { title: '유관순체육관', latitude: 36.8205, longitude: 127.1089, Category: '체육관', hashtags: ['#운동', '#실내체육', '#활동'] },
    { title: '천안축구센터', latitude: 36.8239, longitude: 127.1472, Category: '체육관', hashtags: ['#축구', '#운동', '#역근처'] },
    { title: '상명대 천안캠퍼스 체육관', latitude: 36.8335, longitude: 127.1795, Category: '체육관', hashtags: ['#대학가', '#운동', '#실내체육'] },
    { title: '단국대 천안캠퍼스 체육관', latitude: 36.8358, longitude: 127.1705, Category: '체육관', hashtags: ['#대학가', '#농구', '#운동'] },
    { title: '백석대 체육관', latitude: 36.8415, longitude: 127.1822, Category: '체육관', hashtags: ['#대학가', '#체육', '#활동'] },
    { title: '태조산 청소년수련관 체육관', latitude: 36.8188, longitude: 127.1954, Category: '체육관', hashtags: ['#청소년', '#체육', '#활동'] },
    { title: '불당동 생활체육광장', latitude: 36.8099, longitude: 127.1048, Category: '체육관', hashtags: ['#야외운동', '#러닝', '#운동'] },
  ].map(createItem);

  const policeItems = [
    { title: '천안서북경찰서', latitude: 36.8488, longitude: 127.1195, Category: '경찰서', hashtags: ['#안전', '#치안', '#민원'] },
    { title: '천안동남경찰서', latitude: 36.7844, longitude: 127.1706, Category: '경찰서', hashtags: ['#안전', '#도움', '#민원'] },
    { title: '두정지구대', latitude: 36.8288, longitude: 127.1356, Category: '경찰서', hashtags: ['#두정동', '#치안', '#야간안전'] },
    { title: '성정지구대', latitude: 36.8184, longitude: 127.1369, Category: '경찰서', hashtags: ['#안전', '#지구대', '#도움'] },
    { title: '불당지구대', latitude: 36.8105, longitude: 127.1031, Category: '경찰서', hashtags: ['#불당동', '#안전', '#치안'] },
    { title: '쌍용지구대', latitude: 36.8005, longitude: 127.1189, Category: '경찰서', hashtags: ['#쌍용동', '#야간안전', '#도움'] },
    { title: '신안파출소', latitude: 36.8197, longitude: 127.1565, Category: '경찰서', hashtags: ['#신부동', '#파출소', '#치안'] },
    { title: '백석파출소', latitude: 36.8228, longitude: 127.1242, Category: '경찰서', hashtags: ['#백석동', '#안전', '#도움'] },
  ].map(createItem);

  const smokingItems = [
    { title: '천안역 동부광장 흡연부스', latitude: 36.8090, longitude: 127.1495, Category: '흡연부스', hashtags: ['#흡연', '#역근처', '#휴식'] },
    { title: '천안역 서부광장 흡연부스', latitude: 36.8088, longitude: 127.1480, Category: '흡연부스', hashtags: ['#흡연', '#역근처', '#부스'] },
    { title: '천안종합버스터미널 흡연구역', latitude: 36.8198, longitude: 127.1558, Category: '흡연부스', hashtags: ['#흡연', '#교통', '#터미널'] },
    { title: '두정역 1번출구 인근 흡연부스', latitude: 36.8328, longitude: 127.1488, Category: '흡연부스', hashtags: ['#흡연', '#두정역', '#역근처'] },
    { title: '천안시청 야외 휴게공간', latitude: 36.8153, longitude: 127.1132, Category: '흡연부스', hashtags: ['#휴식', '#야외', '#흡연'] },
    { title: '천안아산역 KTX 광장', latitude: 36.7946, longitude: 127.1042, Category: '흡연부스', hashtags: ['#교통', '#흡연', '#KTX'] },
    { title: '불당동 상업지구 공용부스', latitude: 36.8102, longitude: 127.1075, Category: '흡연부스', hashtags: ['#불당동', '#흡연', '#공용부스'] },
    { title: '단국대병원 장례식장 앞', latitude: 36.8412, longitude: 127.1725, Category: '흡연부스', hashtags: ['#병원근처', '#흡연', '#야외'] },
  ].map(createItem);

  const toiletItems = [
    { title: '천안역 동부광장 공중화장실', latitude: 36.8089, longitude: 127.1501, Category: '공중 화장실', hashtags: ['#화장실', '#역근처', '#편의'] },
    { title: '천안역 서부광장 공중화장실', latitude: 36.8085, longitude: 127.1475, Category: '공중 화장실', hashtags: ['#화장실', '#역근처', '#공공'] },
    { title: '천안종합버스터미널 공중화장실', latitude: 36.8195, longitude: 127.1562, Category: '공중 화장실', hashtags: ['#화장실', '#교통', '#편의'] },
    { title: '두정역 공중화장실', latitude: 36.8326, longitude: 127.1495, Category: '공중 화장실', hashtags: ['#화장실', '#두정역', '#편의'] },
    { title: '천안시청 공중화장실', latitude: 36.8155, longitude: 127.1135, Category: '공중 화장실', hashtags: ['#화장실', '#시청', '#편의'] },
    { title: '천안삼거리공원 공중화장실', latitude: 36.7890, longitude: 127.1640, Category: '공중 화장실', hashtags: ['#공원', '#화장실', '#휴식'] },
    { title: '방아다리공원 공중화장실', latitude: 36.8120, longitude: 127.1090, Category: '공중 화장실', hashtags: ['#공원', '#편의', '#화장실'] },
    { title: '불당동 유적공원 화장실', latitude: 36.8080, longitude: 127.1045, Category: '공중 화장실', hashtags: ['#불당동', '#공원', '#화장실'] },
  ].map(createItem);

  function getAllBaseItems() {
    return [
      ...hospitalItems,
      ...gymItems,
      ...policeItems,
      ...smokingItems,
      ...toiletItems,
    ];
  }

  function normalizeCategoryLabel(rawCategory) {
    const normalized = String(rawCategory || '').trim();
    if (normalized === '나만의 스팟' || normalized === '모두의 스팟') return '공유 스팟';
    return normalized;
  }

  function findCategoryMeta(item) {
    const categoryText = normalizeCategoryLabel(item?.Category || item?.category || '');
    return categories.find((category) => category.key !== 'all' && categoryText.includes(category.label))
      || categories[0];
  }

  function resolveItemsByIndex(payload = {}) {
    const dataSets = [
      getAllBaseItems(),
      hospitalItems,
      gymItems,
      policeItems,
      smokingItems,
      toiletItems,
    ];
    return dataSets[payload.index] || [];
  }

  App.categoryData = {
    categories,
    categoryTagMap,
    createItem,
    normalizeCategoryLabel,
    findCategoryMeta,
    resolveItemsByIndex,
    getAllBaseItems,
    hospitalItems,
    gymItems,
    policeItems,
    smokingItems,
    toiletItems,
  };
}());
