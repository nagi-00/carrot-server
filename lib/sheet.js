// 관리자 구글 시트(Apps Script 웹앱) 연동 (의존성 없음 · Node 18+ fetch)
// SHEET_WEBHOOK_URL: 관리자가 자기 시트에 배포한 Apps Script 웹앱 주소
export async function sheetList() {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, { redirect: 'follow' });
  return await r.json();
}

export async function sheetAdd(member) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', member: member || {} })
  });
  return await r.json();
}

export async function sheetAttend(record) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'attend', record: record || {} })
  });
  return await r.json();
}
