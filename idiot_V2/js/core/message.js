/** iframe/부모창 간 메시지 래퍼. */
App.message = {
  /** 부모 창으로 구조화된 메시지를 보낸다. */
  postToParent: (type, payload = {}) => {
    window.parent.postMessage({ type, ...payload }, '*');
  },
  /** 단순 문자열 메시지를 보낸다. */
  postSimpleToParent: (message) => {
    window.parent.postMessage(message, '*');
  },
};
