// Vercel 서버리스 함수: 멤버 DB (관리자 토큰 필요)
//   GET  /api/members           → 목록
//   POST /api/members {member}  → 추가
import { verifyToken } from '../lib/auth.js';
import { sheetList, sheetAdd, sheetStatus, sheetRemove } from '../lib/sheet.js';

function authed(req) {
  const h = req.headers['authorization'] || '';
  const token = h.replace(/^Bearer\s+/i, '');
  return verifyToken(token, process.env.ADMIN_SECRET);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!authed(req)) { res.status(401).json({ error: '관리자 인증이 필요합니다.' }); return; }

  try {
    if (req.method === 'GET') {
      res.status(200).json(await sheetList());
      return;
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};
      let result;
      if (body.action === 'status') result = await sheetStatus(body.nick, body.status);
      else if (body.action === 'remove') result = await sheetRemove(body.nick);
      else result = await sheetAdd(body.member);
      res.status(result && result.error ? 502 : 200).json(result);
      return;
    }
    res.status(405).json({ error: 'Use GET or POST' });
  } catch (e) {
    res.status(502).json({ error: 'Members request failed' });
  }
}
