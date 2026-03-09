/* =========================================================
 * dd.api.v1.dd.js  (DD Group API Library)
 * - Group: DD_ (doodle / emotion map)
 * - Base:  {URI}/api/v1/dd
 * - Depends: jQuery
 * ========================================================= */
(function (w) {
  "use strict";
  if (!w.$) throw new Error("jQuery($) not found.");

  const API = (w.API = w.API || {});
  API.V1 = API.V1 || {};

  const LS_KEY_URI = "api.v1.uri";
  const DEFAULT_URI = "http://116.36.205.25:15180";

  const cleanUri = (uri) => String(uri || "").replace(/\/+$/g, "").trim();
  const resolveUri = () => {
    const explicit = cleanUri(w.API_V1_URI);
    if (explicit) return explicit;
    try {
      const saved = cleanUri(w.localStorage && w.localStorage.getItem(LS_KEY_URI));
      if (saved) return saved;
    } catch (_) {}
    return DEFAULT_URI;
  };

  API.V1.URI = resolveUri();
  API.V1.BASE = API.V1.URI + "/api/v1";

  API.V1.setURI = (uri) => {
    API.V1.URI = cleanUri(uri) || DEFAULT_URI;
    API.V1.BASE = API.V1.URI + "/api/v1";
    const dd = API.V1.DD;
    if (dd) dd.BASE = API.V1.BASE + "/dd";
    try { w.localStorage && w.localStorage.setItem(LS_KEY_URI, API.V1.URI); } catch (_) {}
    return API.V1.URI;
  };

  const applyParams = (path, params) => {
    let out = path;
    const p = params || {};
    Object.keys(p).forEach((k) => {
      out = out.replace(new RegExp(":" + k + "\\b", "g"), encodeURIComponent(String(p[k])));
    });
    return out;
  };

  const qs = (q) => {
    if (!q) return "";
    const parts = [];
    Object.keys(q).forEach((k) => {
      const v = q[k];
      if (v === undefined || v === null || v === "") return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
    });
    return parts.length ? ("?" + parts.join("&")) : "";
  };

  API.V1.request = API.V1.request || (({ method, url, data, headers }) =>
    $.ajax({
      method,
      url,
      data: data ? JSON.stringify(data) : undefined,
      contentType: data ? "application/json" : undefined,
      dataType: "json",
      headers: headers || {},
    })
  );

  const DD = (API.V1.DD = API.V1.DD || {});
  DD.BASE = API.V1.BASE + "/dd";

  DD.API = {
    AUTH_CHECK_ID: "/auth/check-login-id",
    AUTH_SIGNUP: "/auth/signup",
    AUTH_LOGIN: "/auth/login",
    TAGS_TOP: "/tags/top",
    POSTS_LIST: "/posts",
    POSTS_DETAIL: "/posts/:postNo",
    POSTS_CREATE: "/posts",
    COMMENTS_LIST: "/posts/:postNo/comments",
    COMMENTS_CREATE: "/posts/:postNo/comments",
    REPORT_REASONS: "/reports/reasons",
    REPORT_CREATE: "/reports",
    ADMIN_DASHBOARD: "/admin/dashboard",
    ADMIN_REPORTS: "/admin/reports",
    ADMIN_REPORT_STATUS: "/admin/reports/:reportNo/status",
    ADMIN_TOP_POSTS: "/admin/reports/top-posts",
    ADMIN_POSTS: "/admin/posts",
    ADMIN_POST_BLIND: "/admin/posts/:postNo/blind",
    ADMIN_BLOCKED_TAGS: "/admin/tags/blocked",
    ADMIN_BLOCKED_TAG_UPDATE: "/admin/tags/blocked/:tagText",
    ADMIN_TAG_CANDIDATES: "/admin/tags/candidates",
    ADMIN_TAG_STATS: "/admin/tags/stats",
    ADMIN_ACTION_LOGS: "/admin/action-logs"
  };

  DD.SPEC = [
    { group: "DD", id: "DD-AUTH-1", method: "GET", path: "/auth/check-login-id", query: ["loginId"], body: [] },
    { group: "DD", id: "DD-AUTH-2", method: "POST", path: "/auth/signup", query: [], body: ["loginId","password","nickname"] },
    { group: "DD", id: "DD-AUTH-3", method: "POST", path: "/auth/login", query: [], body: ["loginId","password"] },
    { group: "DD", id: "DD-TAG-1", method: "GET", path: "/tags/top", query: ["limit","days"], body: [] },
    { group: "DD", id: "DD-POST-1", method: "GET", path: "/posts", query: ["q","minLat","maxLat","minLng","maxLng","page","pageSize"], body: [] },
    { group: "DD", id: "DD-POST-2", method: "GET", path: "/posts/:postNo", query: [], body: [] },
    { group: "DD", id: "DD-POST-3", method: "POST", path: "/posts", query: [], body: ["authorNo","title","content?","latitude","longitude","tags?"] },
    { group: "DD", id: "DD-COM-1", method: "GET", path: "/posts/:postNo/comments", query: [], body: [] },
    { group: "DD", id: "DD-COM-2", method: "POST", path: "/posts/:postNo/comments", query: [], body: ["authorNo","content","parentCommentNo?"] },
    { group: "DD", id: "DD-REP-1", method: "GET", path: "/reports/reasons", query: [], body: [] },
    { group: "DD", id: "DD-REP-2", method: "POST", path: "/reports", query: [], body: ["targetType","targetNo","reporterNo?","reasonCode","reasonText?"] },
    { group: "DD", id: "DD-ADM-1", method: "GET", path: "/admin/dashboard", query: [], body: [] },
    { group: "DD", id: "DD-ADM-2", method: "GET", path: "/admin/reports", query: ["status","includeClosed","page","pageSize"], body: [] },
    { group: "DD", id: "DD-ADM-3", method: "PATCH", path: "/admin/reports/:reportNo/status", query: [], body: ["status","reviewResult?","reviewMemo?","reviewedBy?","blindPost?","postStatus?"] },
    { group: "DD", id: "DD-ADM-4", method: "GET", path: "/admin/reports/top-posts", query: ["limit"], body: [] },
    { group: "DD", id: "DD-ADM-5", method: "GET", path: "/admin/posts", query: ["q","isBlinded","page","pageSize"], body: [] },
    { group: "DD", id: "DD-ADM-6", method: "PATCH", path: "/admin/posts/:postNo/blind", query: [], body: ["isBlinded","blindReason?","blindedBy?","status?"] },
    { group: "DD", id: "DD-ADM-7", method: "GET", path: "/admin/tags/blocked", query: ["activeOnly"], body: [] },
    { group: "DD", id: "DD-ADM-8", method: "POST", path: "/admin/tags/blocked", query: [], body: ["tagText","blockReason?","createdBy?"] },
    { group: "DD", id: "DD-ADM-9", method: "PATCH", path: "/admin/tags/blocked/:tagText", query: [], body: ["blockReason?","isActive?","updatedBy?"] },
    { group: "DD", id: "DD-ADM-10", method: "GET", path: "/admin/tags/candidates", query: ["days","limit"], body: [] },
    { group: "DD", id: "DD-ADM-11", method: "GET", path: "/admin/tags/stats", query: ["days","limit"], body: [] },
    { group: "DD", id: "DD-ADM-12", method: "GET", path: "/admin/action-logs", query: ["page","pageSize"], body: [] }
  ];

  DD.url = (apiPath, params, query) => DD.BASE + applyParams(apiPath, params) + qs(query);

  DD.Auth = {
    checkLoginId: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.AUTH_CHECK_ID, null, q) }),
    signup: (body) => API.V1.request({ method: "POST", url: DD.url(DD.API.AUTH_SIGNUP), data: body }),
    login: (body) => API.V1.request({ method: "POST", url: DD.url(DD.API.AUTH_LOGIN), data: body }),
  };

  DD.Tags = { top: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.TAGS_TOP, null, q) }) };

  DD.Posts = {
    list: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.POSTS_LIST, null, q) }),
    get: (postNo) => API.V1.request({ method: "GET", url: DD.url(DD.API.POSTS_DETAIL, { postNo }) }),
    create: (body) => API.V1.request({ method: "POST", url: DD.url(DD.API.POSTS_CREATE), data: body }),
  };

  DD.Comments = {
    list: (postNo, q) => API.V1.request({ method: "GET", url: DD.url(DD.API.COMMENTS_LIST, { postNo }, q) }),
    create: (postNo, body) => API.V1.request({ method: "POST", url: DD.url(DD.API.COMMENTS_CREATE, { postNo }), data: body }),
  };

  DD.Reports = {
    reasons: () => API.V1.request({ method: "GET", url: DD.url(DD.API.REPORT_REASONS) }),
    create: (body) => API.V1.request({ method: "POST", url: DD.url(DD.API.REPORT_CREATE), data: body }),
  };

  DD.Admin = {
    dashboard: () => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_DASHBOARD) }),
    reports: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_REPORTS, null, q) }),
    updateReportStatus: (reportNo, body) => API.V1.request({ method: "PATCH", url: DD.url(DD.API.ADMIN_REPORT_STATUS, { reportNo }), data: body }),
    topPosts: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_TOP_POSTS, null, q) }),
    posts: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_POSTS, null, q) }),
    updatePostBlind: (postNo, body) => API.V1.request({ method: "PATCH", url: DD.url(DD.API.ADMIN_POST_BLIND, { postNo }), data: body }),
    blockedTags: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_BLOCKED_TAGS, null, q) }),
    addBlockedTag: (body) => API.V1.request({ method: "POST", url: DD.url(DD.API.ADMIN_BLOCKED_TAGS), data: body }),
    updateBlockedTag: (tagText, body) => API.V1.request({ method: "PATCH", url: DD.url(DD.API.ADMIN_BLOCKED_TAG_UPDATE, { tagText }), data: body }),
    tagCandidates: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_TAG_CANDIDATES, null, q) }),
    tagStats: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_TAG_STATS, null, q) }),
    actionLogs: (q) => API.V1.request({ method: "GET", url: DD.url(DD.API.ADMIN_ACTION_LOGS, null, q) }),
  };

  DD.Examples = {
    async authFlow({ loginId = "dd_test11", password = "1234", nickname = "DD테스트" } = {}) {
      const check = await DD.Auth.checkLoginId({ loginId });
      if (!check?.exists) await DD.Auth.signup({ loginId, password, nickname });
      return DD.Auth.login({ loginId, password });
    },
    postsFlow: () => DD.Posts.list({ page: 1, pageSize: 5 }),
    tagsTop10: () => DD.Tags.top({ limit: 10, days: 7 }),
    adminSmoke: async () => ({
      dashboard: await DD.Admin.dashboard(),
      reports: await DD.Admin.reports({ page: 1, pageSize: 5 }),
      topPosts: await DD.Admin.topPosts({ limit: 5 }),
      tags: await DD.Admin.tagStats({ days: 7, limit: 5 }),
    }),
  };
})(window);
