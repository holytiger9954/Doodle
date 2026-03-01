# PHI (Personal)

- 목적: **본인 전용** 지도 화면(흡연구역 + 감정 스팟 + 태그 TOP10 + 댓글)
- 구현: 정적 HTML/JS/CSS (카카오맵)
- 저장: 기본은 `localStorage` (API 붙이기 전 프로토타입)

## 실행
- `doodle/phi/index.html` 더블클릭(또는 Live Server)

## 데이터
- posts: `localStorage['phi_posts_v1']`
- comments: `localStorage['phi_comments_v1']`

## 다음 단계(백엔드 붙일 때)
- GET `/api/v1/dd/posts` → markers 로드
- POST `/api/v1/dd/posts` → 등록
- GET `/api/v1/dd/posts/:postNo/comments` → 댓글 로드
- POST `/api/v1/dd/posts/:postNo/comments` → 댓글 등록

(위 URL은 제안. 서버 쪽 실제 라우트에 맞춰 연결하면 됨)
