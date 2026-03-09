/**
 * 카테고리 메타데이터와 기본 좌표 데이터.
 * 상세 하단 시트는 이제 info.html 단일 템플릿을 사용한다.
 */
App.categoryData = {
  categories: [
    { key: 'all', label: '전체', template: 'info.html', image: './img/marker.png' },
    { key: 'hospital', label: '병원', template: 'info.html', image: './img/hospital.png' },
    { key: 'gym', label: '체육관', template: 'info.html', image: './img/gym.png' },
    { key: 'police', label: '경찰서', template: 'info.html', image: './img/police.png' },
    { key: 'smoking', label: '흡연부스', template: 'info.html', image: './img/smoking.png' },
    { key: 'toilet', label: '공중 화장실', template: 'info.html', image: './img/toilet.png' },
  ],

  /** 카테고리 텍스트로 메타데이터를 조회한다. */
  findCategoryMeta: (item) => {
    const categoryText = String(item?.Category || item?.category || '');
    return App.categoryData.categories.find((category) => category.key !== 'all' && categoryText.includes(category.label))
      || App.categoryData.categories[0];
  },

  /** UI 버튼 index를 실제 데이터 배열로 매핑한다. */
  resolveItemsByIndex: (payload) => {
    const dataSets = [
      App.categoryData.getAllBaseItems(),
      App.categoryData.hospitalItems,
      App.categoryData.gymItems,
      App.categoryData.policeItems,
      App.categoryData.smokingItems,
      App.categoryData.toiletItems,
    ];
    return dataSets[payload.index] || [];
  },


  /** 기본 카테고리 마커 전체를 하나의 배열로 반환한다. */
  getAllBaseItems: () => ([
    ...App.categoryData.hospitalItems,
    ...App.categoryData.gymItems,
    ...App.categoryData.policeItems,
    ...App.categoryData.smokingItems,
    ...App.categoryData.toiletItems,
  ]),

  favoriteItems: [
    { title: "천안시청 인근", latitude: 36.815129, longitude: 127.113894, Category: '찜' },
    { title: "천안역", latitude: 36.808945, longitude: 127.149182, Category: '찜' },
    { title: "천안터미널", latitude: 36.819443, longitude: 127.156557, Category: '찜' },
    { title: "단국대 천안캠퍼스", latitude: 36.833917, longitude: 127.172467, Category: '찜' },
    { title: "상명대 천안캠퍼스", latitude: 36.832968, longitude: 127.178121, Category: '찜' },
    { title: "불당동 카페거리", latitude: 36.809311, longitude: 127.106294, Category: '찜' },
    { title: "두정역", latitude: 36.832561, longitude: 127.149121, Category: '찜' },
    { title: "백석대학교", latitude: 36.839444, longitude: 127.185556, Category: '찜' },
    { title: "독립기념관", latitude: 36.783633, longitude: 127.223048, Category: '찜' },
    { title: "천안삼거리공원", latitude: 36.789547, longitude: 127.164503, Category: '찜' }
  ],
  hospitalItems: [
    { title: "단국대학교의과대학부속병원", latitude: 36.8405, longitude: 127.1731, Category: '병원' },
    { title: "순천향대학교부속천안병원", latitude: 36.7990, longitude: 127.1352, Category: '병원' },
    { title: "천안충무병원", latitude: 36.8016, longitude: 127.1394, Category: '병원' },
    { title: "천안의료원", latitude: 36.7801, longitude: 127.1751, Category: '병원' },
    { title: "혜성산부인과병원", latitude: 36.8118, longitude: 127.1517, Category: '병원' },
    { title: "대전대천안한방병원", latitude: 36.8242, longitude: 127.1475, Category: '병원' },
    { title: "천안자생한방병원", latitude: 36.8091, longitude: 127.1065, Category: '병원' },
    { title: "천안우리병원", latitude: 36.8153, longitude: 127.1128, Category: '병원' },
    { title: "리앤리병원", latitude: 36.8105, longitude: 127.1082, Category: '병원' },
    { title: "천안센텀정형외과", latitude: 36.8202, longitude: 127.1054, Category: '병원' }
  ],
  gymItems: [
    { title: "천안종합운동장", latitude: 36.8214, longitude: 127.1082, Category: '체육관' },
    { title: "유관순체육관", latitude: 36.8205, longitude: 127.1089, Category: '체육관' },
    { title: "천안실내배드민턴장", latitude: 36.8235, longitude: 127.1068, Category: '체육관' },
    { title: "남서울대학교 성암문화체육관", latitude: 36.9102, longitude: 127.1338, Category: '체육관' },
    { title: "상명대학교 천안캠퍼스 체육관", latitude: 36.8335, longitude: 127.1795, Category: '체육관' },
    { title: "단국대학교 천안캠퍼스 체육관", latitude: 36.8358, longitude: 127.1705, Category: '체육관' },
    { title: "북천안자 자전거공원", latitude: 36.8612, longitude: 127.1534, Category: '체육관' },
    { title: "백석대학교 체육관", latitude: 36.8415, longitude: 127.1822, Category: '체육관' },
    { title: "태조산 청소년수련관 체육관", latitude: 36.8188, longitude: 127.1954, Category: '체육관' },
    { title: "천안축구센터", latitude: 36.8239, longitude: 127.1472, Category: '체육관' }
  ],
  policeItems: [
    { title: "천안서북경찰서", latitude: 36.8488, longitude: 127.1195, Category: '경찰서' },
    { title: "천안동남경찰서", latitude: 36.7844, longitude: 127.1706, Category: '경찰서' },
    { title: "두정지구대", latitude: 36.8288, longitude: 127.1356, Category: '경찰서' },
    { title: "성정지구대", latitude: 36.8184, longitude: 127.1369, Category: '경찰서' },
    { title: "불당지구대", latitude: 36.8105, longitude: 127.1031, Category: '경찰서' },
    { title: "신안파출소", latitude: 36.8197, longitude: 127.1565, Category: '경찰서' },
    { title: "문성파출소", latitude: 36.8082, longitude: 127.1485, Category: '경찰서' },
    { title: "쌍용지구대", latitude: 36.8005, longitude: 127.1189, Category: '경찰서' },
    { title: "남산파출소", latitude: 36.8011, longitude: 127.1511, Category: '경찰서' },
    { title: "백석파출소", latitude: 36.8228, longitude: 127.1242, Category: '경찰서' }
  ],
  smokingItems: [
    { title: "천안역 동부광장 흡연부스", latitude: 36.8090, longitude: 127.1495, Category: '흡연부스' },
    { title: "천안역 서부광장 흡연부스", latitude: 36.8088, longitude: 127.1480, Category: '흡연부스' },
    { title: "천안종합버스터미널 흡연구역", latitude: 36.8198, longitude: 127.1558, Category: '흡연부스' },
    { title: "두정역 1번출구 인근 흡연부스", latitude: 36.8328, longitude: 127.1488, Category: '흡연부스' },
    { title: "천안시청 야외 휴게공간", latitude: 36.8153, longitude: 127.1132, Category: '흡연부스' },
    { title: "동남구청 별관 인근", latitude: 36.8068, longitude: 127.1515, Category: '흡연부스' },
    { title: "신세계백화점 천안아산점 후문", latitude: 36.8189, longitude: 127.1568, Category: '흡연부스' },
    { title: "천안아산역 KTX 광장", latitude: 36.7946, longitude: 127.1042, Category: '흡연부스' },
    { title: "단국대병원 장례식장 앞", latitude: 36.8412, longitude: 127.1725, Category: '흡연부스' },
    { title: "불당동 상업지구 공용부스", latitude: 36.8102, longitude: 127.1075, Category: '흡연부스' }
  ],
  toiletItems: [
    { title: "천안역 동부광장 공중화장실", latitude: 36.8089, longitude: 127.1501, Category: '공중 화장실' },
    { title: "천안역 서부광장 공중화장실", latitude: 36.8085, longitude: 127.1475, Category: '공중 화장실' },
    { title: "천안종합버스터미널 공중화장실", latitude: 36.8195, longitude: 127.1562, Category: '공중 화장실' },
    { title: "두정역 공중화장실", latitude: 36.8326, longitude: 127.1495, Category: '공중 화장실' },
    { title: "천안시청 공중화장실", latitude: 36.8155, longitude: 127.1135, Category: '공중 화장실' },
    { title: "천안삼거리공원 공중화장실", latitude: 36.7890, longitude: 127.1640, Category: '공중 화장실' },
    { title: "신안동 행정복지센터 공중화장실", latitude: 36.8210, longitude: 127.1550, Category: '공중 화장실' },
    { title: "방아다리공원 공중화장실", latitude: 36.8120, longitude: 127.1090, Category: '공중 화장실' },
    { title: "불당동 유적공원 화장실", latitude: 36.8080, longitude: 127.1045, Category: '공중 화장실' },
    { title: "태조산공원 공중화장실", latitude: 36.8190, longitude: 127.1945, Category: '공중 화장실' }
  ]
};
