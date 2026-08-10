// Vercel 서버리스 함수:
//   POST /api/attend  { record: {...} } → 출석 기록 저장 (공개, 토큰 불필요)
//   GET  /api/attend                    → 닉네임 목록만 반환 (자동완성용, 공개)
import { sheetAttend, sheetList } from '../lib/sheet.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method === 'GET') {
    // 자동완성용 닉네임 목록 (탈퇴 제외, 닉네임만 공개 — 다른 정보는 내리지 않음)
    try {
      const data = await sheetList();
      const nicks = ((data && data.members) || [])
        .filter((m) => m && m.nick && String(m.status || '').indexOf('탈퇴') < 0)
        .map((m) => String(m.nick).trim());
      res.status(200).json({ nicks: nicks });
    } catch (e) {
      res.status(502).json({ error: 'nick list failed' });
    }
    return;
  }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use GET or POST' }); return; }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const record = body && body.record;
    if (!record || !record.nick) { res.status(400).json({ error: '닉네임이 필요합니다.' }); return; }
    const result = await sheetAttend(record);
    res.status(result && result.error ? 502 : 200).json(result);
  } catch (e) {
    res.status(502).json({ error: 'Attend failed' });
  }
}
