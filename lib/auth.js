// 관리자 인증 코어 (의존성 없음 · Node 내장 crypto)
// 비밀번호는 PBKDF2 해시로만 다루며, 평문은 저장하지 않습니다.
import crypto from 'crypto';

export function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  try {
    const h = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) { return false; }
}

// 환경변수 ADMINS: [{"id":"...","salt":"...","hash":"..."}] 형태의 JSON 문자열
export function loadAdmins() {
  try { return JSON.parse(process.env.ADMINS || '[]'); } catch (e) { return []; }
}

// HMAC 서명 토큰 (base64url(payload).base64url(sig))
export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

export function verifyToken(token, secret) {
  if (!token || token.indexOf('.') === -1) return null;
  const parts = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) return null;
  } catch (e) { return null; }
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); } catch (e) { return null; }
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}
