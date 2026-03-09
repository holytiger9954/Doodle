리팩토링 요약
============================

1. 구조 분리
- js/core     : 앱 공통 기반(App, DOM, Storage, Message)
- js/api      : 인증/스팟 API 레이어(local/server 확장형)
- js/data     : 카테고리/기본 좌표 데이터
- js/ui       : 화면 컴포넌트별 UI 처리
- js/pages    : 페이지별 컨트롤러
- js_legacy   : 기존 단일 JS 백업

2. 네이밍 규칙 통일
- App.pageXxx         : 페이지 컨트롤러
- App.uiXxx           : UI 컴포넌트 제어기
- App.xxxApi          : API 계층
- getElements         : DOM 수집 함수명 통일
- init / bindXxx      : 초기화/이벤트 연결 함수명 통일
- renderXxx / toggleXxx / handleXxx : 동작별 함수명 통일

3. 중복 로직 제거
- localStorage key 접근 -> App.storage로 통합
- postMessage -> App.message로 통합
- validation message -> App.uiAuth로 통합
- category index 분기 -> App.categoryData.resolveItemsByIndex로 통합

4. API 서버 연동형 구조
- 현재 기본값은 App.config.apiMode = 'local'
- server 로 바꾸면 auth/spot API는 App.http.request 기반으로 확장 가능
- 페이지는 authApi / spotApi만 호출하므로 UI 코드 수정 범위를 최소화함

5. 주석 강화
- 파일 상단 설명 추가
- 함수 단위 설명 추가
- 유지보수 시 '무슨 역할인지' 읽히도록 설명형 주석 보강


추가 수정 사항
============================
- 잘못된 절대경로(/css/ui.css)를 상대경로(./css/ui.css)로 수정
- 이미지 파일명을 ASCII 별칭(star/hospital/gym/police/smoking/toilet.png)으로 정리
- register.html 카테고리 표기를 '공중 화장실'로 통일
- main.html 에 info 패널용 infom.css를 추가
- page.main.js 에서 info 템플릿을 body 기준으로 파싱하도록 보강
- infom.css 주석 깨짐 및 바텀시트 레이아웃 문제 수정
