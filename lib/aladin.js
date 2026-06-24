// 알라딘 책 검색 핵심 로직 (의존성 없음 · Node 18+ 전역 fetch 사용)
// k(요청별 키)가 있으면 그것을, 없으면 환경변수 TTB_KEY를 사용합니다.
export async function searchBooks(q, k) {
  const ttbkey = (k && k.trim()) ? k.trim() : process.env.TTB_KEY;
  if (!ttbkey) return { error: 'No TTB key configured' };
  if (!q || !q.trim()) return [];

  const url = 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx'
    + '?ttbkey=' + encodeURIComponent(ttbkey)
    + '&Query=' + encodeURIComponent(q)
    + '&QueryType=Title&MaxResults=20&start=1&SearchTarget=Book'
    + '&output=js&Version=20131101&Cover=Big';

  const resp = await fetch(url);
  let text = (await resp.text()).trim();
  if (text.endsWith(';')) text = text.slice(0, -1);

  let data;
  try { data = JSON.parse(text); }
  catch (e) { return { error: 'Search parse failed' }; }

  if (data && data.errorCode) return { error: data.errorMessage || 'Aladin error' };
  if (!data.item) return [];

  return data.item.map((i) => ({
    title: i.title,
    author: (i.author || '').replace(/\s*\(.*?\)/g, '').trim(),
    cover: (i.cover || '').replace('http://', 'https://'),
    description: i.description || '',
    publisher: i.publisher || '',
    genre: i.categoryName || '',
    toc: i.toc || ''
  }));
}
