// Vercel 서버리스 함수: 멤버 DB (관리자 토큰 필요)
//   GET  /api/members           → 목록
//   POST /api/members {member}  → 추가
import { verifyToken } from '../lib/auth.js';
import { sheetList, sheetAdd, sheetStatus, sheetRemove, sheetEdit, sheetDelAttend, sheetClean } from '../lib/sheet.js';

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

  const SERVER_VER = 'srv-2';
  try {
    if (req.method === 'GET') {
      const data = await sheetList();
      if (data && typeof data === 'object') data.serverVersion = SERVER_VER;  // 서버 버전 표식
      res.status(200).json(data);
      return;
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};
      let result;
      if (body.action === 'status') result = await sheetStatus(body.nick, body.status);
      else if (body.action === 'remove') result = await sheetRemove(body.nick);
      else if (body.action === 'edit') result = await sheetEdit(body.nick, body.newNick, body.memo);
      else if (body.action === 'delAttend') result = await sheetDelAttend(body.nick, body.date, body.dateKey);
      else if (body.action === 'cleanBlanks') result = await sheetClean();
      else if (body.action === 'add' || (!body.action && body.member)) result = await sheetAdd(body.member);
      else result = { error: 'unknown action: ' + (body.action || '(none)') };  // 모르는 명령은 add로 흘리지 않음
      res.status(result && result.error ? 502 : 200).json(result);
      return;
    }
    res.status(405).json({ error: 'Use GET or POST' });
  } catch (e) {
    res.status(502).json({ error: 'Members request failed' });
  }
}
