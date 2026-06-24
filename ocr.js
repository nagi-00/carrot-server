// OCR.space 래퍼 (의존성 없음 · Node 18+ 전역 fetch)
// base64Image: "data:image/...;base64,...." 형태의 데이터 URL을 그대로 받습니다.
export async function ocrImage(base64Image) {
  const apikey = process.env.OCR_SPACE_KEY;
  if (!apikey) return { error: 'No OCR key configured' };
  if (!base64Image) return { error: 'No image' };

  const params = new URLSearchParams();
  params.append('base64Image', base64Image);
  params.append('language', 'kor');   // 한국어 (Engine 1)
  params.append('isOverlayRequired', 'false');
  params.append('scale', 'true');
  params.append('detectOrientation', 'true');

  const resp = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'apikey': apikey, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const data = await resp.json();

  if (data.IsErroredOnProcessing) {
    const msg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : (data.ErrorMessage || 'OCR error');
    return { error: msg };
  }
  const text = (data.ParsedResults && data.ParsedResults[0] && data.ParsedResults[0].ParsedText) || '';
  return { text };
}
