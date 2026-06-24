// Vercel 서버리스 함수: GET /api/search?q=제목[&k=TTB키]
// Vercel은 /api 폴더의 파일을 자동으로 서버리스 함수로 띄웁니다.
import { searchBooks } from '../lib/aladin.js';

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
      const code = result.error.indexOf('TTB') !== -1 ? 500 : 502;
      res.status(code).json(result);
      return;
    }
    res.status(200).json(result);
  } catch (e) {
    res.status(502).json({ error: 'Search failed' });
  }
}
