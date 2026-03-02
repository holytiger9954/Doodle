/* api-test.js
 * - 목적: UI 없이 DD/LODG(TB)/SJ API 저장/조회 스모크 테스트
 * - 사용: phi/api-test.html 열고 버튼 클릭
 */
(function (w) {
  "use strict";

  const $log = () => $("#log");
  const now = () => new Date().toISOString();

  function logLine(...args) {
    const msg = args.map(a => (typeof a === "string" ? a : JSON.stringify(a, null, 2))).join(" ");
    $log().append(`[${now()}] ${msg}\n`);
  }

  function logBlock(title, obj) {
    $log().append(`\n==== ${title} ====\n`);
    $log().append(`${typeof obj === "string" ? obj : JSON.stringify(obj, null, 2)}\n`);
  }

  function randId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  function applyBase(baseUri) {
    const b = String(baseUri || "").trim();
    if (!b) return;
    w.DD.V1.URI = b;
    w.DD.V1.BASE = b + "/api/v1";
    logLine("BASE set:", w.DD.V1.BASE);
  }

  async function safeCall(name, fn) {
    try {
      const r = await fn();
      logBlock(name, r);
      return r;
    } catch (e) {
      // jQuery ajax error: e.responseJSON, e.status, e.responseText
      const info = {
        message: e?.message || String(e),
        status: e?.status,
        responseJSON: e?.responseJSON,
        responseText: e?.responseText,
      };
      logBlock(name + " (ERROR)", info);
      return null;
    }
  }

  // ==========================
  // DD tests
  // ==========================
  async function runDD() {
    logLine("[DD] start");

    // 1) create post
    const created = await safeCall("DD.Posts.create", () => w.DD.V1.Posts.create({
      authorNo: 1,
      title: "흡연구역 발견",
      content: "여기 바람 덜 불어서 좋음",
      latitude: 36.3504,
      longitude: 127.3845,
      tags: ["흡연", "대전", "실내"],
    }));

    // 서버 응답이 {ok:true, postNo} 또는 {ok:true, item} 등 변동 가능 -> 유연 처리
    const postNo = created?.postNo || created?.item?.postNo || created?.item?.DD_POST_NO || null;
    if (!postNo) {
      logLine("[DD] create 결과에서 postNo를 찾지 못함 (서버 응답 포맷 확인 필요)");
      return;
    }

    // 2) get post
    await safeCall("DD.Posts.get", () => w.DD.V1.Posts.get(postNo));

    // 3) list comments (없는 경우 ok:false or items:[] 둘 다 허용)
    await safeCall("DD.Comments.list", () => w.DD.V1.Comments.list(postNo));

    // 4) add comment
    await safeCall("DD.Comments.add", () => w.DD.V1.Comments.add(postNo, { authorNo: 1, content: "나도 여기 인정", parentCommentNo: null }));

    // 5) list comments again
    await safeCall("DD.Comments.list (after)", () => w.DD.V1.Comments.list(postNo));

    // 6) tags top10
    await safeCall("DD.Tags.top", () => w.DD.V1.Tags.top({ limit: 10, days: 7 }));

    logLine("[DD] done");
  }

  // ==========================
  // LODG tests (숙소 읽기)
  // ==========================
  async function runLODG() {
    logLine("[LODG] start");

    const list = await safeCall("LODG.listProperties", () => w.DD.V1.Lodging.listProperties({ page: 1, pageSize: 5 }));
    const firstId = list?.items?.[0]?.PROPERTY_ID || list?.items?.[0]?.propertyId || list?.items?.[0]?.id;
    if (firstId) {
      await safeCall("LODG.getProperty", () => w.DD.V1.Lodging.getProperty(firstId));
      await safeCall("LODG.rooms", () => w.DD.V1.Lodging.rooms(firstId));
      await safeCall("LODG.reviews", () => w.DD.V1.Lodging.reviews(firstId, { limit: 3, offset: 0 }));
    } else {
      logLine("[LODG] properties list 결과에서 propertyId를 찾지 못함 (데이터/포맷 확인 필요)");
    }

    await safeCall("LODG.listCities", () => w.DD.V1.Lodging.listCities());
    await safeCall("LODG.cityCounts", () => w.DD.V1.Lodging.cityCounts());

    logLine("[LODG] done");
  }

  // ==========================
  // TB tests (검색로그/찜) - 저장 포함
  // ==========================
  async function runTB() {
    logLine("[TB] start");

    // 1) 검색 로그 저장
    await safeCall("TB.Searches.create", () => w.DD.V1.TB.Searches.create({ memberId: null, keyword: "흡연", city: "대전" }));

    // 2) 검색 로그 조회
    await safeCall("TB.Searches.list", () => w.DD.V1.TB.Searches.list({ page: 1, pageSize: 10 }));

    // 3) 찜 토글 (propertyId는 실제 데이터가 있어야 의미 있음)
    //    - 여기선 데모로 propertyId='P1'로 호출 -> 서버가 FK/검증을 강하게 하면 실패할 수 있음
    await safeCall("TB.Wishlist.toggle (demo)", () => w.DD.V1.TB.Wishlist.toggle({ memberId: "1", propertyId: "P1" }));

    // 4) 찜 조회
    await safeCall("TB.Wishlist.list (memberId=1)", () => w.DD.V1.TB.Wishlist.list({ memberId: "1", page: 1, pageSize: 10 }));

    logLine("[TB] done");
  }

  // ==========================
  // SJ tests - 회원 생성/로그인/글/댓글 저장 포함
  // ==========================
  async function runSJ() {
    logLine("[SJ] start");

    const loginId = randId("sj");
    const password = "1234";

    await safeCall("SJ.Auth.checkLoginId", () => w.DD.V1.SJ.Auth.checkLoginId({ loginId }));

    const signup = await safeCall("SJ.Auth.signup", () => w.DD.V1.SJ.Auth.signup({ loginId, password, nickname: "tester", email: null }));

    const login = await safeCall("SJ.Auth.login", () => w.DD.V1.SJ.Auth.login({ loginId, password }));
    const userId = login?.user?.userId || signup?.userId || signup?.user?.userId;

    if (!userId) {
      logLine("[SJ] userId를 얻지 못함 (SJ_USERS 스키마/응답 포맷 확인 필요)");
      return;
    }

    const createdPost = await safeCall("SJ.Posts.create", () => w.DD.V1.SJ.Posts.create({
      authorId: userId,
      title: "SJ 테스트 글",
      content: "내용",
      tags: ["테스트"],
    }));

    const postId = createdPost?.postId || createdPost?.item?.postId;
    if (!postId) {
      logLine("[SJ] postId를 얻지 못함");
      return;
    }

    await safeCall("SJ.Posts.get", () => w.DD.V1.SJ.Posts.get(postId));
    await safeCall("SJ.Posts.list", () => w.DD.V1.SJ.Posts.list({ page: 1, pageSize: 5 }));

    await safeCall("SJ.Comments.create", () => w.DD.V1.SJ.Comments.create(postId, { authorId: userId, content: "첫 댓글", parentCommentId: null }));
    await safeCall("SJ.Comments.list", () => w.DD.V1.SJ.Comments.list(postId, { page: 1, pageSize: 20 }));

    logLine("[SJ] done");
  }

  $(function () {
    // default base preset
    $("#baseUri").val(w.DD?.V1?.URI || "");

    $("#applyBase").on("click", () => applyBase($("#baseUri").val()));
    $("#clearLog").on("click", () => $log().text(""));

    $("#runDD").on("click", runDD);
    $("#runLODG").on("click", runLODG);
    $("#runTB").on("click", runTB);
    $("#runSJ").on("click", runSJ);
  });
})(window);
