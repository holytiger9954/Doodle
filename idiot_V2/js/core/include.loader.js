/**
 * HTML 파셜(include) 로더.
 *
 * 사용법:
 * 1) main.html 에서 data-include, data-init 속성을 가진 slot 을 만든다.
 * 2) 이 로더가 파셜 HTML을 주입한다.
 * 3) 삽입 완료 후 data-init 에 적힌 함수를 찾아 호출한다.
 *
 * 예시:
 *   <div data-include="./partials/search.partial.html" data-init="App.pageSearch.init"></div>
 */
App.includeLoader = {
  /** page 전체 include slot 처리 */
  initAll: async () => {
    const includeSlots = App.dom.qsa('[data-include]');
    for (const slot of includeSlots) {
      // 순차 로딩: UI 조각이 순서대로 안정적으로 붙도록 일부러 await 사용
      // (병렬 로딩보다 디버깅이 쉬움)
      // eslint-disable-next-line no-await-in-loop
      await App.includeLoader.loadInto(slot);
    }
  },

  /** 단일 slot 에 파셜 HTML 삽입 */
  loadInto: async (slot) => {
    const path = slot.dataset.include;
    if (!path) return;

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`include 로드 실패: ${path} (${response.status})`);
      }

      const html = await response.text();
      slot.innerHTML = html;
      App.includeLoader.runInit(slot.dataset.init, slot);
    } catch (error) {
      console.error(error);
      slot.innerHTML = `
        <div style="padding:12px;color:#fff;background:rgba(0,0,0,0.35);border-radius:12px;">
          include 로드 실패: ${path}
        </div>
      `;
    }
  },

  /** 문자열 경로로 전달된 init 함수를 찾아 실행 */
  runInit: (initPath, slot) => {
    if (!initPath) return;

    const initFunction = initPath
      .split('.')
      .reduce((context, key) => (context ? context[key] : undefined), window);

    if (typeof initFunction !== 'function') {
      console.warn(`include init 함수를 찾을 수 없습니다: ${initPath}`);
      return;
    }

    // root slot 을 넘겨서 각 컴포넌트가 자신의 영역만 초기화할 수 있게 한다.
    initFunction(slot);
  },
};

// main.html 의 DOM 이 준비되면 바로 include 시작
// (지도 초기화와 별개로 돌아가도 문제 없다.)
document.addEventListener('DOMContentLoaded', () => {
  App.includeLoader.initAll();
});
