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

export async function sheetStatus(nick, status) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'status', nick: nick, status: status })
  });
  return await r.json();
}

export async function sheetEdit(nick, newNick, memo) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'edit', nick: nick, newNick: newNick, memo: memo })
  });
  return await r.json();
}

export async function sheetRemove(nick) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove', nick: nick })
  });
  return await r.json();
}

// 빈(닉네임 없는) 멤버 행 일괄 정리
export async function sheetClean() {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cleanBlanks' })
  });
  return await r.json();
}

// 특정 출석 기록(닉네임 + 날짜) 삭제. dateKey(시트가 정규화한 날짜키)가 있으면 함께 전달.
export async function sheetDelAttend(nick, date, dateKey) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return { error: 'No SHEET_WEBHOOK_URL configured' };
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delAttend', nick: nick, date: date, dateKey: dateKey })
  });
  return await r.json();
}
