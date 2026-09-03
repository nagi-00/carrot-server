// Vercel 서버리스 함수: GET /api/search?q=제목[&k=카카오 REST 키]
import { searchBooks } from '../lib/books.js';

export default async function handler(req, res) {
  // CORS (출석 페이지에서 브라우저로 직접 호출)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const q = req.query.q;
  const k = req.query.k;
  try {
    const result = await searchBooks(q, k);
    if (result && result.error) {
      const code = /KAKAO|GOOGLE/.test(result.error) ? 500 : 502;
      res.status(code).json(result);
      return;
    }

    // 표지를 자기 프록시(/api/img) 경유로 바꿔 CORS·캔버스 오염을 함께 해결
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const base = proto + '://' + host;
    const proxied = result.map((b) => ({
      ...b,
      cover: b.cover ? base + '/api/img?url=' + encodeURIComponent(b.cover) : ''
    }));

    res.status(200).json(proxied);
  } catch (e) {
    res.status(502).json({ error: 'Search failed' });
  }
}
