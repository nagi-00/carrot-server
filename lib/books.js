// 책 검색 핵심 로직 (의존성 없음 · Node 18+ 전역 fetch)
// 알라딘 OpenAPI 종료 대응: 카카오(다음 책) 검색을 주력, Google Books를 보조로 사용합니다.
// 반환 형태는 기존 lib/aladin.js의 searchBooks()와 완전히 동일 → 프론트엔드 수정 불필요.
//
// 필요한 환경변수:
//   KAKAO_REST_KEY  (필수) developers.kakao.com > 내 애플리케이션 > 앱 키 > REST API 키
//   GOOGLE_BOOKS_KEY (선택) 없어도 동작합니다.

const KAKAO_URL = 'https://dapi.kakao.com/v3/search/book';
const GOOGLE_URL = 'https://www.googleapis.com/books/v1/volumes';

// 카카오 썸네일(R120x174)은 영수증에 쓰기엔 화질이 부족합니다.
// URL의 fname에 담긴 원본 주소를 그대로 사용합니다.
function upscaleKakaoCover(url) {
  if (!url) return '';
  try {
    const m = String(url).match(/[?&]fname=([^&]+)/);
    if (m) {
      const original = decodeURIComponent(m[1]);
      if (/^https?:\/\//.test(original)) return original;
    }
  } catch (e) { /* 파싱 실패 시 썸네일을 그대로 사용 */ }
  return url;
}

// 저자 배열을 기존 알라딘 포맷("홍길동" · 괄호 주석 제거)에 맞춥니다.
function joinAuthors(authors, translators) {
  const list = [];
  if (Array.isArray(authors)) list.push(...authors);
  if (Array.isArray(translators) && translators.length) {
    list.push(...translators.map((t) => t + ' 옮김'));
  }
  return list.join(', ').replace(/\s*\(.*?\)/g, '').trim();
}

// HTML 태그·엔티티 제거 (Google Books description에 태그가 섞여 옵니다)
function stripTags(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// ISBN13만 뽑아냅니다. 카카오는 "8983711892 9788983711892" 형태로 둘을 함께 줍니다.
function pickIsbn13(isbnField) {
  const parts = String(isbnField || '').trim().split(/\s+/);
  const thirteen = parts.find((p) => p.length === 13);
  return thirteen || parts[0] || '';
}

async function searchKakao(q) {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) return { error: 'No KAKAO_REST_KEY configured' };

  const url = KAKAO_URL
    + '?query=' + encodeURIComponent(q)
    + '&target=title'   // 제목 검색 (알라딘의 QueryType=Title과 동일한 의도)
    + '&size=50';       // 카카오 최대값

  const resp = await fetch(url, {
    headers: { 'Authorization': 'KakaoAK ' + key }
  });

  if (resp.status === 401 || resp.status === 403) {
    return { error: 'KAKAO key rejected (' + resp.status + ')' };
  }
  if (resp.status === 429) {
    return { error: '검색 요청이 몰렸습니다. 잠시 후 다시 시도해 주세요.' };
  }
  if (!resp.ok) return { error: 'Kakao search failed (' + resp.status + ')' };

  let data;
  try { data = await resp.json(); }
  catch (e) { return { error: 'Search parse failed' }; }

  const docs = (data && data.documents) || [];
  return docs.map((d) => ({
    title: d.title || '',
    author: joinAuthors(d.authors, d.translators),
    cover: upscaleKakaoCover(d.thumbnail || ''),
    description: stripTags(d.contents || ''),
    publisher: d.publisher || '',
    genre: '',                    // 카카오는 분류를 주지 않습니다 (아래 보강 참고)
    toc: '',                      // 카카오는 목차를 주지 않습니다
    isbn: pickIsbn13(d.isbn),     // 신규 필드 — 나중에 보강·중복제거에 씁니다
    link: d.url || ''             // 다음 책 상세 페이지
  }));
}

async function searchGoogle(q) {
  const key = process.env.GOOGLE_BOOKS_KEY;
  const url = GOOGLE_URL
    + '?q=' + encodeURIComponent('intitle:' + q)
    + '&maxResults=40&country=KR&printType=books'
    + (key ? '&key=' + encodeURIComponent(key) : '');

  const resp = await fetch(url);
  if (!resp.ok) return [];

  let data;
  try { data = await resp.json(); }
  catch (e) { return []; }

  const items = (data && data.items) || [];
  return items.map((it) => {
    const v = it.volumeInfo || {};
    const img = v.imageLinks || {};
    const ids = v.industryIdentifiers || [];
    const isbn13 = (ids.find((x) => x.type === 'ISBN_13') || {}).identifier || '';
    return {
      title: v.title || '',
      author: (v.authors || []).join(', '),
      // Google 표지는 http로 오고 zoom=1이 기본입니다. https + 조금 더 크게.
      cover: String(img.thumbnail || '').replace('http://', 'https://').replace('&zoom=1', '&zoom=2'),
      description: stripTags(v.description || ''),
      publisher: v.publisher || '',
      genre: (v.categories || []).join(' > '),
      toc: '',
      isbn: isbn13,
      link: v.infoLink || ''
    };
  });
}

// 제목+저자 기준으로 두 소스를 합칩니다. 카카오 결과가 우선이며,
// 카카오에 표지나 분류가 비어 있으면 Google 쪽 값으로 그 칸만 채웁니다.
function merge(primary, secondary) {
  const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
  const keyOf = (b) => (b.isbn ? 'i:' + b.isbn : 't:' + norm(b.title) + '|' + norm(b.author));

  const out = [];
  const index = {};

  primary.forEach((b) => {
    const k = keyOf(b);
    if (k in index) return;
    index[k] = out.length;
    out.push(b);
  });

  secondary.forEach((b) => {
    const k = keyOf(b);
    if (k in index) {
      const cur = out[index[k]];
      if (!cur.cover && b.cover) cur.cover = b.cover;
      if (!cur.genre && b.genre) cur.genre = b.genre;
      if (!cur.description && b.description) cur.description = b.description;
      if (!cur.publisher && b.publisher) cur.publisher = b.publisher;
      return;
    }
    // 카카오에 없던 책은 뒤에 덧붙입니다 (외서 등)
    index[k] = out.length;
    out.push(b);
  });

  return out;
}

export async function searchBooks(q, k) {
  // 두 번째 인자 k는 기존 시그니처 호환용입니다.
  // 예전에는 요청별 TTB 키였고, 지금은 요청별 카카오 키로 해석합니다.
  if (!q || !q.trim()) return [];
  const query = q.trim();

  // 요청별 키가 넘어오면 환경변수보다 우선 적용
  const savedKey = process.env.KAKAO_REST_KEY;
  if (k && k.trim()) process.env.KAKAO_REST_KEY = k.trim();

  try {
    const kakao = await searchKakao(query);

    // 카카오가 실패했으면 Google만으로라도 결과를 냅니다.
    if (kakao && kakao.error) {
      const fallback = await searchGoogle(query).catch(() => []);
      if (fallback.length) return fallback;
      return { error: kakao.error };
    }

    // 카카오 결과가 충분하면 굳이 Google을 부르지 않습니다 (호출량 절약)
    const needsHelp = kakao.length === 0 || kakao.some((b) => !b.cover || !b.genre);
    if (!needsHelp) return kakao;

    const google = await searchGoogle(query).catch(() => []);
    return merge(kakao, google);
  } finally {
    if (savedKey === undefined) delete process.env.KAKAO_REST_KEY;
    else process.env.KAKAO_REST_KEY = savedKey;
  }
}
