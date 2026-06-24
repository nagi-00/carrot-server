// 로컬 실행용 서버 (의존성 없음 · Node 18+)
// 실행: node local-server.js  →  http://localhost:3000/api/search?q=데미안
import http from 'http';
import { searchBooks } from './lib/aladin.js';

const port = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const u = new URL(req.url, 'http://localhost:' + port);
  if (u.pathname === '/api/search') {
    const q = u.searchParams.get('q');
    const k = u.searchParams.get('k');
    try {
      const result = await searchBooks(q, k);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Search failed' }));
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}).listen(port, () => {
  console.log('Book search server running on http://localhost:' + port);
  console.log('Try: http://localhost:' + port + '/api/search?q=데미안');
});
