// Vercel 서버리스 함수: GET /api/img?url=...  표지 이미지 프록시(CORS 허용)
// 책장 이미지를 내보낼 때(html2canvas) 외부 표지가 캔버스를 오염시키지 않도록 중계.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const u = req.query.url;
  if (!u) { res.status(400).end('no url'); return; }
  try {
    const r = await fetch(u);
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).end('img failed');
  }
}
