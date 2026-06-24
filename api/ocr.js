// Vercel 서버리스 함수: POST /api/ocr  { image: "data:image/jpeg;base64,..." }
// 응답: { text: "..." } 또는 { error: "..." }
import { ocrImage } from '../lib/ocr.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return; }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const image = body && body.image;
    if (!image) { res.status(400).json({ error: 'No image' }); return; }
    const result = await ocrImage(image);
    res.status(result.error ? 502 : 200).json(result);
  } catch (e) {
    res.status(502).json({ error: 'OCR failed' });
  }
}
