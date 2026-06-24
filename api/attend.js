// Vercel 서버리스 함수: POST /api/attend  { record: {...} }
// 멤버(비로그인)가 제출하는 출석 기록 → 시트에 저장. 공개 엔드포인트(토큰 불필요).
import { sheetAttend } from '../lib/sheet.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return; }

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
