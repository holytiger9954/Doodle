/* dd.api.v1.js (DD /api/v1/dd/posts* 5 endpoints) */
(function (w) {
  "use strict";
  if (!w.$) throw new Error("jQuery($) not found.");

  const DD = (w.DD = w.DD || {});
  DD.V1 = DD.V1 || {};
  DD.V1.URI = "http://116.36.205.25:15180";
  DD.V1.BASE = DD.V1.URI + "/api/v1";

  DD.V1.API = Object.freeze({
    POSTS_LIST: "/dd/posts",                     // GET
    POSTS_CREATE: "/dd/posts",                   // POST
    POSTS_DETAIL: "/dd/posts/:postNo",           // GET
    COMMENTS_LIST: "/dd/posts/:postNo/comments", // GET
    COMMENTS_ADD: "/dd/posts/:postNo/comments"   // POST
  });

  const qs = (o) =>
    !o ? "" : Object.keys(o).map(k => {
      const v=o[k]; if (v===undefined||v===null||v==="") return "";
      return encodeURIComponent(k)+"="+encodeURIComponent(String(v));
    }).filter(Boolean).join("&");

  DD.V1.url = (path, params, query) => {
    let p = path || "";
    if (params) Object.keys(params).forEach(k => p = p.replace(":"+k, encodeURIComponent(String(params[k]))));
    const u = (DD.V1.BASE + p);
    const q = qs(query);
    return q ? (u + "?" + q) : u;
  };

  DD.V1.ajax = (opt) => {
    const o = Object.assign({ method:"GET", dataType:"json", timeout:15000 }, opt);
    if (o.json != null) { o.contentType="application/json; charset=utf-8"; o.data=JSON.stringify(o.json); delete o.json; }
    return $.ajax(o);
  };

  const normTags = (tags) => Array.isArray(tags) ? tags.map(String).map(s=>s.trim()).filter(Boolean) : (typeof tags==="string" ? tags : []);

  DD.V1.Posts = {
    // GET /api/v1/dd/posts?q&minLat&maxLat&minLng&maxLng&page&pageSize
    list: (query) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.POSTS_LIST, null, query||{}) }),
    // GET /api/v1/dd/posts/:postNo
    get: (postNo) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.POSTS_DETAIL, { postNo }) }),

    // POST /api/v1/dd/posts
    create: (body) => DD.V1.ajax({
      method:"POST",
      url: DD.V1.url(DD.V1.API.POSTS_CREATE),
      json: {
        authorNo: Number(body?.authorNo),
        title: String(body?.title||"").trim(),
        content: body?.content == null ? null : String(body.content),
        latitude: Number(body?.latitude),
        longitude: Number(body?.longitude),
        tags: normTags(body?.tags)
      }
    })
  };

  DD.V1.Comments = {
    // GET /api/v1/dd/posts/:postNo/comments
    list: (postNo) => DD.V1.ajax({ url: DD.V1.url(DD.V1.API.COMMENTS_LIST, { postNo }) }),

    // POST /api/v1/dd/posts/:postNo/comments
    add: (postNo, body) => DD.V1.ajax({
      method:"POST",
      url: DD.V1.url(DD.V1.API.COMMENTS_ADD, { postNo }),
      json: {
        authorNo: Number(body?.authorNo),
        content: String(body?.content||"").trim(),
        parentCommentNo: body?.parentCommentNo == null ? null : Number(body.parentCommentNo)
      }
    })
  };
})(window);