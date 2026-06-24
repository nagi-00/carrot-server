# 책 검색 서버 (검색 전용)

독서모임 출석 페이지의 "오늘 읽은 책" 검색을 위한 독립 서버입니다.
알라딘 TTB API를 감싸 `GET /api/search?q=제목` 으로 책 정보를 돌려줍니다.
의존성이 없고(Node 18+ 내장 fetch), 노션 저장 같은 다른 기능은 들어 있지 않습니다.

## 응답 형태

```json
[
  {
    "title": "데미안",
    "author": "헤르만 헤세",
    "cover": "https://image.aladin.co.kr/.../cover/xxxx.jpg",
    "description": "줄거리 요약...",
    "publisher": "민음사",
    "genre": "소설/시/희곡 > 독일소설",
    "toc": "목차..."
  }
]
```

TTB 키가 없으면 `{ "error": "No TTB key configured" }` 를 돌려줍니다.

## 1) Vercel 배포 (권장 — 멤버가 아무것도 입력하지 않아도 됨)

1. 이 `book-search-server` 폴더를 새 GitHub 저장소로 올립니다.
2. Vercel에서 **New Project → 그 저장소 임포트**.
3. **Settings → Environment Variables** 에 추가:
   - Name: `TTB_KEY`
   - Value: 본인의 알라딘 TTB 키
   - (추가 후 **Redeploy** 해야 반영됩니다.)
4. 배포가 끝나면 주소가 생깁니다: `https://<프로젝트>.vercel.app`
5. 확인: 브라우저에서 `https://<프로젝트>.vercel.app/api/search?q=데미안` 을 열어 책 JSON이 보이면 성공.
6. 출석 페이지(`attendance.html`)의 `BOOK_API` 한 줄을 이 주소로 바꿉니다.

> Vercel은 `/api` 폴더의 파일을 자동으로 서버리스 함수로 띄웁니다. 별도 설정 파일이 필요 없습니다.

## 2) 로컬 실행 (시험용)

준비물: Node.js 18 이상.

```bash
# TTB 키를 환경변수로 넣고 실행
# Windows (cmd):
set TTB_KEY=ttbXXXXXXXXXXXX && node local-server.js
# macOS / Linux:
TTB_KEY=ttbXXXXXXXXXXXX node local-server.js
```

실행되면 `http://localhost:3000/api/search?q=데미안` 으로 확인할 수 있습니다.
이 경우 출석 페이지의 `BOOK_API` 는 `http://localhost:3000` 으로 두면 됩니다.

## 파일 구성

- `api/search.js` — Vercel 서버리스 함수 (배포용 엔드포인트)
- `local-server.js` — 로컬 실행용 서버 (의존성 없음)
- `lib/aladin.js` — 알라딘 검색 핵심 로직 (둘이 공유)
- `.env.example` — 환경변수 예시
