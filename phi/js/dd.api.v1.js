/* =========================================================
 * dd.api.v1.js  (Unified API Library)
 * - Groups: DD_ (doodle map), TB_ (user features), SJ_ (board)
 * - Base: http://<host>:15180/api/v1
 *
 * 목적(Purpose)
 * - 프론트에서 그룹별 API를 한 파일로 테스트/호출 가능하도록 통합
 * - Endpoints 명세를 코드로 고정해 누락 방지
 * ========================================================= */
(function (w) {
  "use strict";
  if (!w.$) throw new Error("jQuery($) not found.");

  const DD = (w.DD = w.DD || {});
  DD.V1 = DD.V1 || {};

  // =========================================================
  // 0) Base URL
  // =========================================================
  DD.V1.URI  = "http://116.36.205.25:15180";
  DD.V1.BASE = DD.V1.URI + "/api/v1";

  // =========================================================
  // 1) API SPEC (Endpoint Catalog)
  // - 그룹별로 "무조건 여기서만" 관리한다. (Single source of truth)
  // =========================================================
  DD.V1.API = Object.freeze({
    /* ===========================
     * DD_ group (doodle/map)
     * Base: /api/v1/dd
     * =========================== */

    // (DD) 게시글/스팟 목록 검색
    // Use: 지도 영역(bbox) + 키워드(q)로 스팟(게시글) 목록 조회
    // GET /api/v1/dd/posts?q&minLat&maxLat&minLng&maxLng&page&pageSize
    DD_POSTS_LIST: "/dd/posts",

    // (DD) 게시글/스팟 단건 상세
    // Use: 마커 클릭 -> 상세 데이터 + (서버 구현에 따라) comments 포함될 수 있음
    // GET /api/v1/dd/posts/:postNo
    DD_POSTS_DETAIL: "/dd/posts/:postNo",

    // (DD) 게시글/스팟 생성
    // Use: 지도 클릭 등록 모드 -> 스팟 생성
    // POST /api/v1/dd/posts
    DD_POSTS_CREATE: "/dd/posts",

    // (DD) 댓글 목록
    // Use: 상세 화면에서 댓글 리스트 로딩
    // GET /api/v1/dd/posts/:postNo/comments
    DD_COMMENTS_LIST: "/dd/posts/:postNo/comments",

    // (DD) 댓글 등록 (대댓글 포함: parentCommentNo)
    // Use: 댓글/대댓글 작성
    // POST /api/v1/dd/posts/:postNo/comments
    DD_COMMENTS_ADD: "/dd/posts/:postNo/comments",

    // (DD) 실시간 태그 TOP N
    // Use: 우측 패널 "실시간 태그 TOP10" (최근 N일 집계)
    // GET /api/v1/dd/tags/top?limit=10&days=7
    // (옵션) category, verified는 서버 구현에 따라 지원될 수 있음
    DD_TAGS_TOP: "/dd/tags/top",

    /* ===========================
     * TB_ group (user features)
     * Base: /api/v1
     * Tables: TB_WISHLIST, TB_SEARCH_LOG, TB_USER, TB_USER_AUTH
     * =========================== */

    // (TB) 찜 토글
    // Use: 특정 propertyId 찜 on/off (memberId = USER_ID)
    // POST /api/v1/wishlist/toggle
    TB_WISHLIST_TOGGLE: "/wishlist/toggle",

    // (TB) 찜 목록 조회 (페이지네이션)
    // Use: 내 찜 리스트
    // GET /api/v1/wishlist?memberId=...&page=1&pageSize=20
    TB_WISHLIST_LIST: "/wishlist",

    // (TB) 검색어 로그 적재
    // Use: 검색 시 키워드 로그 저장(실시간 검색어 랭킹의 원천 데이터)
    // POST /api/v1/searches
    TB_SEARCH_LOG_CREATE: "/searches",

    // (TB) 검색어 로그 조회 (페이지네이션)
    // Use: 최근 검색 로그를 받아서 프론트에서 TOP10 집계 가능
    // GET /api/v1/searches?memberId&keyword&page&pageSize
    TB_SEARCH_LOG_LIST: "/searches",

    // (TB) 로그인 아이디 사용 가능 여부
    // Use: 회원가입 폼에서 중복 체크
    // GET /api/v1/auth/check-login-id?loginId=hong
    TB_AUTH_CHECK_LOGIN_ID: "/auth/check-login-id",

    // (TB) 회원가입 (user + credentials 동시 생성)
    // Use: TB_USER + TB_USER_AUTH 생성
    // POST /api/v1/auth/signup
    TB_AUTH_SIGNUP: "/auth/signup",

    // (TB) 기존 userId에 로그인 계정 추가(자격증명 등록)
    // Use: TB_USER는 존재하지만 TB_USER_AUTH가 없는 경우 연결
    // POST /api/v1/auth/register-credentials
    TB_AUTH_REGISTER_CREDENTIALS: "/auth/register-credentials",

    /* ===========================
     * SJ_ group (board)
     * Base: /api/v1/sj
     * Tables: SJ_USERS, SJ_POSTS, SJ_COMMENTS
     * =========================== */

    // (SJ) 로그인 아이디 존재 여부(중복 체크)
    // GET /api/v1/sj/auth/check-login-id?loginId=...
    SJ_AUTH_CHECK_LOGIN_ID: "/sj/auth/check-login-id",

    // (SJ) 회원가입
    // POST /api/v1/sj/auth/signup
    SJ_AUTH_SIGNUP: "/sj/auth/signup",

    // (SJ) 로그인
    // POST /api/v1/sj/auth/login
    SJ_AUTH_LOGIN: "/sj/auth/login",

    // (SJ) 게시글 목록 (검색/필터/정렬/페이지)
    // GET /api/v1/sj/posts?keyword&authorId&tag&from&to&sort&order&page&pageSize
    SJ_POSTS_LIST: "/sj/posts",

    // (SJ) 게시글 단건
    // GET /api/v1/sj/posts/:postId
    SJ_POSTS_DETAIL: "/sj/posts/:postId",

    // (SJ) 게시글 생성
    // POST /api/v1/sj/posts
    SJ_POSTS_CREATE: "/sj/posts",

    // (SJ) 게시글 수정
    // PUT /api/v1/sj/posts/:postId
    SJ_POSTS_UPDATE: "/sj/posts/:postId",

    // (SJ) 게시글 삭제
    // DELETE /api/v1/sj/posts/:postId
    SJ_POSTS_DELETE: "/sj/posts/:postId",

    // (SJ) 조회수 증가
    // POST /api/v1/sj/posts/:postId/view
    SJ_POSTS_VIEW: "/sj/posts/:postId/view",

    // (SJ) 댓글 목록 (페이지)
    // GET /api/v1/sj/posts/:postId/comments?order&page&pageSize
    SJ_COMMENTS_LIST: "/sj/posts/:postId/comments",

    // (SJ) 댓글 생성(대댓글 포함 parentCommentId)
    // POST /api/v1/sj/posts/:postId/comments
    SJ_COMMENTS_CREATE: "/sj/posts/:postId/comments",

    // (SJ) 댓글 수정
    // PUT /api/v1/sj/comments/:commentId
    SJ_COMMENTS_UPDATE: "/sj/comments/:commentId",

    // (SJ) 댓글 삭제
    // DELETE /api/v1/sj/comments/:commentId
    SJ_COMMENTS_DELETE: "/sj/comments/:commentId",
  });

  // =========================================================
  // 2) URL builder + AJAX wrapper
  // =========================================================
  const qs = (o) =>
    !o ? "" : Object.keys(o).map(k => {
      const v = o[k];
      if (v === undefined || v === null || v === "") return "";
      return encodeURIComponent(k) + "=" + encodeURIComponent(String(v));
    }).filter(Boolean).join("&");

  DD.V1.url = (path, params, query) => {
    let p = path || "";
    if (params) Object.keys(params).forEach(k => {
      p = p.replace(":" + k, encodeURIComponent(String(params[k])));
    });
    const u = (DD.V1.BASE + p);
    const q = qs(query);
    return q ? (u + "?" + q) : u;
  };

  DD.V1.ajax = (opt) => {
    const o = Object.assign({ method: "GET", dataType: "json", timeout: 15000 }, opt);
    if (o.json != null) {
      o.contentType = "application/json; charset=utf-8";
      o.data = JSON.stringify(o.json);
      delete o.json;
    }
    return $.ajax(o);
  };

  // =========================================================
  // 3) Group Wrappers (Convenience functions)
  // - 테스트 시 "URL 문자열 조립"을 줄이기 위한 래퍼
  // =========================================================

  // ---------- DD ----------
  const normTags = (tags) =>
    Array.isArray(tags)
      ? tags.map(String).map(s => s.trim()).filter(Boolean)
      : (typeof tags === "string" ? tags : []);

  DD.V1.Posts = {
    // GET /dd/posts
    list: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.DD_POSTS_LIST, null, query || {}) }),

    // GET /dd/posts/:postNo
    get: (postNo) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.DD_POSTS_DETAIL, { postNo }) }),

    // POST /dd/posts
    create: (body) => DD.V1.ajax({
      method: "POST",
      url: DD.V1.url(DD.V1.API.DD_POSTS_CREATE),
      json: {
        authorNo: Number(body?.authorNo),
        title: String(body?.title || "").trim(),
        content: body?.content == null ? null : String(body.content),
        latitude: Number(body?.latitude),
        longitude: Number(body?.longitude),
        tags: normTags(body?.tags),
      }
    }),
  };

  DD.V1.Comments = {
    // GET /dd/posts/:postNo/comments
    list: (postNo) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.DD_COMMENTS_LIST, { postNo }) }),

    // POST /dd/posts/:postNo/comments
    add: (postNo, body) => DD.V1.ajax({
      method: "POST",
      url: DD.V1.url(DD.V1.API.DD_COMMENTS_ADD, { postNo }),
      json: {
        authorNo: Number(body?.authorNo),
        content: String(body?.content || "").trim(),
        parentCommentNo: body?.parentCommentNo == null ? null : Number(body.parentCommentNo),
      }
    }),
  };

  DD.V1.Tags = {
    // GET /dd/tags/top?limit&days
    top: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.DD_TAGS_TOP, null, query || {}) }),
  };

  // ---------- TB ----------
  DD.V1.TB = {
    Wishlist: {
      // POST /wishlist/toggle
      toggle: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.TB_WISHLIST_TOGGLE),
        json: { memberId: String(body?.memberId || "").trim(), propertyId: String(body?.propertyId || "").trim() }
      }),

      // GET /wishlist?memberId&page&pageSize
      list: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.TB_WISHLIST_LIST, null, query || {}) }),
    },

    Searches: {
      // POST /searches
      create: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.TB_SEARCH_LOG_CREATE),
        json: {
          memberId: body?.memberId == null ? null : String(body.memberId),
          keyword: String(body?.keyword || "").trim(),
          city: body?.city == null ? null : String(body.city),
        }
      }),

      // GET /searches?memberId&keyword&page&pageSize
      list: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.TB_SEARCH_LOG_LIST, null, query || {}) }),
    },

    Auth: {
      // GET /auth/check-login-id?loginId=
      checkLoginId: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.TB_AUTH_CHECK_LOGIN_ID, null, query || {}) }),

      // POST /auth/signup
      signup: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.TB_AUTH_SIGNUP),
        json: {
          loginId: String(body?.loginId || "").trim(),
          password: String(body?.password || ""),
          displayName: String(body?.displayName || "").trim(),
          email: body?.email == null ? null : String(body.email),
        }
      }),

      // POST /auth/register-credentials
      registerCredentials: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.TB_AUTH_REGISTER_CREDENTIALS),
        json: {
          userId: String(body?.userId || "").trim(),
          loginId: String(body?.loginId || "").trim(),
          password: String(body?.password || ""),
        }
      }),
    },
  };

  // ---------- SJ ----------
  DD.V1.SJ = {
    Auth: {
      // GET /sj/auth/check-login-id?loginId=
      checkLoginId: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.SJ_AUTH_CHECK_LOGIN_ID, null, query || {}) }),

      // POST /sj/auth/signup
      signup: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.SJ_AUTH_SIGNUP),
        json: body || {}
      }),

      // POST /sj/auth/login
      login: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.SJ_AUTH_LOGIN),
        json: body || {}
      }),
    },

    Posts: {
      // GET /sj/posts?...filters
      list: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.SJ_POSTS_LIST, null, query || {}) }),

      // GET /sj/posts/:postId
      get: (postId) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.SJ_POSTS_DETAIL, { postId }) }),

      // POST /sj/posts
      // body: { authorId(loginId, string) 또는 authorNo(number), title, content, tags[] }
      create: (body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.SJ_POSTS_CREATE),
        json: body || {}
      }),

      // PUT /sj/posts/:postId
      update: (postId, body) => DD.V1.ajax({
        method: "PUT",
        url: DD.V1.url(DD.V1.API.SJ_POSTS_UPDATE, { postId }),
        json: body || {}
      }),

      // DELETE /sj/posts/:postId
      remove: (postId) => DD.V1.ajax({
        method: "DELETE",
        url: DD.V1.url(DD.V1.API.SJ_POSTS_DELETE, { postId })
      }),

      // POST /sj/posts/:postId/view
      view: (postId) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.SJ_POSTS_VIEW, { postId })
      }),
    },

    Comments: {
      // GET /sj/posts/:postId/comments
      list: (postId, query) => DD.V1.ajax({
        url: DD.V1.url(DD.V1.API.SJ_COMMENTS_LIST, { postId }, query || {})
      }),

      // POST /sj/posts/:postId/comments
      create: (postId, body) => DD.V1.ajax({
        method: "POST",
        url: DD.V1.url(DD.V1.API.SJ_COMMENTS_CREATE, { postId }),
        json: body || {}
      }),

      // PUT /sj/comments/:commentId
      update: (commentId, body) => DD.V1.ajax({
        method: "PUT",
        url: DD.V1.url(DD.V1.API.SJ_COMMENTS_UPDATE, { commentId }),
        json: body || {}
      }),

      // DELETE /sj/comments/:commentId
      remove: (commentId) => DD.V1.ajax({
        method: "DELETE",
        url: DD.V1.url(DD.V1.API.SJ_COMMENTS_DELETE, { commentId })
      }),
    },
  };

})(window);