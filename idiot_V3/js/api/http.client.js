/**
 * 서버 연동용 최소 HTTP 클라이언트.
 * 현재는 local 모드가 기본이지만, server 모드 전환 시 재사용한다.
 */
App.http = {
  /** JSON 요청 전송 */
  request: async (path, options = {}) => {
    const response = await fetch(`${App.config.apiBaseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  },
};
