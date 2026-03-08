/** DOM 공통 유틸리티. */
App.dom = {
  /** 단일 요소 조회 */
  qs: (selector, root = document) => root.querySelector(selector),
  /** 여러 요소 조회 */
  qsa: (selector, root = document) => Array.from(root.querySelectorAll(selector)),
  /** 요소가 있을 때만 안전하게 이벤트 바인딩 */
  on: (element, eventName, handler) => {
    if (!element) return;
    element.addEventListener(eventName, handler);
  },
  /** textContent 설정 */
  setText: (element, value = '') => {
    if (!element) return;
    element.textContent = value;
  },
  /** innerHTML 설정 */
  setHtml: (element, value = '') => {
    if (!element) return;
    element.innerHTML = value;
  },
  /** class 토글 */
  toggleClass: (element, className) => {
    if (!element) return false;
    return element.classList.toggle(className);
  },
};
