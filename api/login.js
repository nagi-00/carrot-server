// Vercel 서버리스 함수: POST /api/login  { id, password }
// 응답: { token, id } 또는 { error }
import { verifyPassword, loadAdmins, signToken } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return; }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) { res.status(500).json({ error: 'No ADMIN_SECRET configured' }); return; }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const id = (body && body.id || '').trim();
    const password = (body && body.password) || '';

    const admin = loadAdmins().find(function (a) { return a.id === id; });
    if (!admin || !verifyPassword(password, admin.salt, admin.hash)) {
      res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }
    const token = signToken({ id: admin.id, exp: Date.now() + 8 * 3600 * 1000 }, secret);
    res.status(200).json({ token: token, id: admin.id });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
}
