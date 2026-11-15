'use strict';
/* ===== helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => iso(new Date());
const num = v => { const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
let FC = null; // валюта по умолчанию внутри блока отчёта
const fmt = (n, c) => nf.format(Math.round(n * 100) / 100) + ' ' + (c || FC || S.profile.currency);
const curs = () => [S.profile.currency, ...(S.profile.extra || []).filter(c => c && c !== S.profile.currency)];
const oc = o => o.cur || S.profile.currency;
const sums = ops => { const m = {}; ops.forEach(o => m[oc(o)] = (m[oc(o)] || 0) + o.amount); return Object.entries(m).map(([c, v]) => fmt(v, c)).join(' · ') || fmt(0); };
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const monthName = m => { const [y, mm] = m.split('-'); return MONTHS[+mm - 1] + ' ' + y; };
const dmy = d => d ? d.split('-').reverse().join('.') : '';
const dayLabel = d => { if (d === today()) return 'Сегодня'; const y = new Date(); y.setDate(y.getDate() - 1); if (d === iso(y)) return 'Вчера'; return new Date(d + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }); };
const shiftMonth = (m, k) => { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + k, 1); return iso(d).slice(0, 7); };
async function sha(s) {
  if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return 'x' + h.toString(16);
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }
const P = { plus: 'M12 5v14M5 12h14', home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', tasks: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10', more: 'M5 12h.01M12 12h.01M19 12h.01', in: 'M12 4v12M6 11l6 6 6-6M5 20h14', out: 'M12 20V8M6 13l6-6 6 6M5 4h14', bag: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2', cash: 'M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', ok: 'M5 12l5 5 9-10', copy: 'M9 9h10v11H9zM5 15V4h10', cal: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4', go: 'M9 6l6 6-6 6', swap: 'M7 8h12l-3-3M17 16H5l3 3' };
const ic = n => `<svg class="ic" viewBox="0 0 24 24"><path d="${P[n]}"/></svg>`;

/* ===== storage ===== */
const DB = {
  db: null,
  open() { return new Promise(res => { try { const r = indexedDB.open('vj-ledger', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { this.db = r.result; res(); }; r.onerror = () => res(); } catch (e) { res(); } }); },
  get(k) { return new Promise(res => { if (!this.db) { try { res(JSON.parse(localStorage.getItem(k))); } catch (e) { res(null); } return; } const r = this.db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); }); },
  set(k, v) { if (!this.db) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } return; } this.db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); }
};
const TEMPLATES = [
  ['Запрос на бронь отеля', 'Добрый день!\n\nПрошу забронировать номер:\n— Гость: [ФИО]\n— Даты: с [дата] по [дата]\n— Категория номера: [категория]\n— Пожелания: ранний заезд / поздний выезд, тихий этаж\n\nПрошу прислать подтверждение и условия отмены.\n\nС уважением,\nВиолетта'],
  ['Подтверждение встречи', 'Добрый день, [имя]!\n\nПодтверждаю встречу с [руководитель]:\n— Дата и время: [дата], [время]\n— Место / ссылка: [адрес или ссылка]\n— Тема: [тема]\n\nЕсли планы изменятся, пожалуйста, дайте знать заранее.\n\nС уважением,\nВиолетта'],
  ['Перенос встречи', 'Добрый день, [имя]!\n\nК сожалению, встречу [дата, время] необходимо перенести. Предлагаю варианты:\n— [вариант 1]\n— [вариант 2]\n\nПодскажите, пожалуйста, какой удобнее.\n\nС уважением,\nВиолетта'],
  ['Чек-лист командировки', '☐ Билеты туда и обратно, места выбраны\n☐ Отель: бронь и подтверждение\n☐ Трансфер из аэропорта и обратно\n☐ Документы: паспорт, виза, страховка\n☐ Расписание встреч с адресами и контактами\n☐ Материалы и презентации\n☐ Рестораны / переговорные забронированы\n☐ Маршрут отправлен руководителю одним сообщением'],
  ['Структура презентации', '1. Титульный слайд: тема, дата, спикер\n2. Зачем мы здесь: цель в одной фразе\n3. Ситуация сейчас: 2–3 факта и цифры\n4. Проблема или возможность\n5. Предложение / решение\n6. Как это работает: шаги или схема\n7. Цифры: бюджет, сроки, эффект\n8. Риски и как их закрываем\n9. Что нужно от аудитории: решение, ресурсы\n10. Следующие шаги и контакты']
];
const fresh = () => ({ v: 1, profile: { name: 'Виолетта', currency: '₽', extra: ['$', '€'], pin: null, ready: false }, ops: [], tasks: [], trips: [], templates: TEMPLATES.map(([title, body]) => ({ id: uid(), title, body })), recon: [], closed: {}, log: [] });
let S = fresh();
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => DB.set('state', S), 150); Cloud.touch(); };
const ui = { tab: 'home', filter: 'all', month: today().slice(0, 7), deals: 'tasks' };

/* ===== money ===== */
const CAT_C = ['Билеты', 'Отель', 'Такси и транспорт', 'Представительские', 'Офис и канцелярия', 'Подарки', 'Курьер и доставка', 'Прочее'];
const CAT_P = ['Продукты', 'Кафе', 'Транспорт', 'Покупки', 'Здоровье', 'Красота', 'Дом', 'Прочее'];
const TYPE = { expense: 'Расход', income: 'Поступление', transfer: 'Перевод', return: 'Возврат компании' };
const OWN = { company: 'Компания', personal: 'Личные' };
const ACC = { card: 'Карта', cash: 'Наличные' };
function balances(ops = S.ops, cur = S.profile.currency) {
  const b = { card: { company: 0, personal: 0 }, cash: { company: 0, personal: 0 } };
  for (const o of ops) {
    if (oc(o) !== cur) continue;
    if (o.type === 'income') b[o.account][o.owner] += o.amount;
    else if (o.type === 'transfer') { b[o.account][o.owner] -= o.amount; b[o.toAccount][o.owner] += o.amount; }
    else b[o.account][o.owner] -= o.amount;
  }
  b.company = b.card.company + b.cash.company; b.personal = b.card.personal + b.cash.personal;
  b.cardT = b.card.company + b.card.personal; b.cashT = b.cash.company + b.cash.personal;
  return b;
}
const opTitle = o => o.note || o.category || (o.type === 'transfer' ? (o.account === 'card' ? 'Снятие наличных' : 'Внесение на карту') : o.type === 'income' ? (o.owner === 'company' ? 'От компании' : 'Личный доход') : TYPE[o.type]);
const opSign = o => o.type === 'income' ? 1 : o.type === 'transfer' ? 0 : -1;
const describe = o => `${dmy(o.date)} · ${TYPE[o.type]} · ${nf.format(o.amount)} ${oc(o)} · ${OWN[o.owner]} · ${o.type === 'transfer' ? ACC[o.account] + ' → ' + ACC[o.toAccount] : ACC[o.account]}${o.category ? ' · ' + o.category : ''}${o.note ? ' · ' + o.note : ''}${o.receipt ? ' · чек' : ''}`;
const log = t => { S.log.push({ at: new Date().toISOString(), t }); };
const byDate = (a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || '');

function parseQuick(text) {
  const r = { type: 'expense', owner: 'personal', account: 'card' }; let ownerSet = false;
  const m = text.match(/\d[\d\s]*(?:[.,]\d+)?/); if (m) { r.amount = num(m[0]); text = text.replace(m[0], ' '); }
  const rest = [];
  for (const w of text.trim().split(/\s+/).filter(Boolean)) {
    const l = w.toLowerCase();
    if (/^(комп|раб|фирм)/.test(l)) { r.owner = 'company'; ownerSet = true; }
    else if (/^(личн|себ|мои|моё|мое)/.test(l)) { r.owner = 'personal'; ownerSet = true; }
    else if (/^нал/.test(l)) r.account = 'cash';
    else if (/^карт/.test(l)) r.account = 'card';
    else if (/^(приш|получ|аванс|поступ)/.test(l)) { r.type = 'income'; if (!ownerSet) r.owner = 'company'; }
    else if (/^(сня)/.test(l)) r.type = 'transfer';
    else if (/^верну/.test(l)) r.type = 'return';
    else if (/^(\$|дол|бакс|usd)/.test(l) && curs().includes('$')) r.cur = '$';
    else if (/^(€|евро|eur)/.test(l) && curs().includes('€')) r.cur = '€';
    else rest.push(w);
  }
  r.note = rest.join(' ');
  const n = r.note.toLowerCase(), c = r.owner === 'company';
  const G = [[/такси|метро|бензин|парков|трансфер/, c ? 'Такси и транспорт' : 'Транспорт'], [/билет|авиа|жд|перел/, 'Билеты'], [/отел|гостин/, 'Отель'], [/кафе|ресторан|обед|ужин|кофе/, c ? 'Представительские' : 'Кафе'], [/продукт|магазин|супермаркет/, 'Продукты'], [/подар|цвет/, 'Подарки'], [/курьер|достав/, 'Курьер и доставка'], [/канц|бумаг|офис/, 'Офис и канцелярия'], [/аптек|врач/, 'Здоровье']];
  for (const [re, cat] of G) if (re.test(n) && (c ? CAT_C : CAT_P).includes(cat)) { r.category = cat; break; }
  return r;
}
function compress(file) {
  return new Promise(res => { const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1100 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.6)); }; img.onerror = () => res(null); img.src = fr.result; }; fr.onerror = () => res(null); fr.readAsDataURL(file); });
}
async function saveFile(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  try { const f = new File([blob], name, { type: mime }); if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [f] }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function makeIcs(title, date, opt = {}) {
  const st = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', d = date.replace(/-/g, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VJ//RU', 'BEGIN:VEVENT', 'UID:' + uid() + '@vj', 'DTSTAMP:' + st, opt.time ? 'DTSTART:' + d + 'T' + opt.time + '00' : 'DTSTART;VALUE=DATE:' + d];
  if (opt.time) L.push('DURATION:PT15M'); if (opt.rrule) L.push('RRULE:' + opt.rrule);
  L.push('SUMMARY:' + title.replace(/[,;]/g, ' '), 'BEGIN:VALARM', 'TRIGGER:' + (opt.time ? 'PT0M' : 'PT9H'), 'ACTION:DISPLAY', 'DESCRIPTION:' + title.replace(/[,;]/g, ' '), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
  return saveFile('napominanie.ics', L.join('\r\n'), 'text/calendar');
}

/* ===== views ===== */
function opRow(o) {
  const s = opSign(o), c = o.owner === 'company';
  return `<button class="item" data-a="editOp" data-id="${o.id}"><span class="dot ${c ? 'c' : ''}">${c ? 'К' : 'Л'}</span><span class="mid"><div class="t">${esc(opTitle(o))}</div><div class="s">${OWN[o.owner]} · ${o.type === 'transfer' ? ACC[o.account] + ' → ' + ACC[o.toAccount] : ACC[o.account]}${o.receipt ? ' · чек' : ''}</div></span><span class="a ${s > 0 ? 'plus' : ''}">${s > 0 ? '+' : s < 0 ? '−' : ''}${fmt(o.amount, oc(o))}</span></button>`;
}
function nudges() {
  const n = [], t = today(), last = S.recon[S.recon.length - 1];
  const over = S.tasks.filter(x => !x.done && x.due && x.due <= t).length;
  if (over) n.push(['tasks', `Дела на сегодня и просроченные: ${over}`, 'goDeals']);
  if (S.ops.length && (!last || (Date.now() - new Date(last.date + 'T12:00')) / 864e5 > 7)) n.push(['bell', last ? 'Сверка была больше недели назад' : 'Сверьте остаток с банком', 'recon']);
  const pm = shiftMonth(t.slice(0, 7), -1);
  if (!S.closed[pm] && S.ops.some(o => o.date.slice(0, 7) === pm)) n.push(['cal', `Закройте ${monthName(pm)} и сохраните отчёт`, 'archive']);
  const nr = S.ops.filter(o => o.type === 'expense' && o.owner === 'company' && !o.receipt && !S.closed[o.date.slice(0, 7)]).length;
  if (nr) n.push(['bag', `Расходы компании без чека: ${nr}`, 'noReceipt']);
  if (!window.FIREBASE_CONFIG && S.ops.length && (!S.lastBackup || (Date.now() - S.lastBackup) / 864e5 > 14)) n.push(['copy', S.lastBackup ? 'Резервной копии больше двух недель' : 'Сохраните резервную копию данных', 'backup']);
  return n.map(([i, txt, a]) => `<button class="nudge" data-a="${a}"><i>${ic(i)}</i><span style="flex:1">${txt}</span>${ic('go')}</button>`).join('');
}
const V = {};
V.home = () => {
  const b = balances(), h = new Date().getHours(), hi = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const recent = [...S.ops].sort(byDate).reverse().slice(0, 5), nd = nudges();
  const other = curs().slice(1).map(c => [c, balances(S.ops, c)]).filter(([, x]) => x.company || x.personal || x.cardT || x.cashT)
    .map(([c, x]) => `<div class="kv"><span>${esc(c)} · компании <b>${fmt(x.company, c)}</b></span><span>личные <b>${fmt(x.personal, c)}</b></span></div>`).join('');
  return `<div class="top"><div class="mono">VJ</div><div><h1>${hi}, ${esc(S.profile.name)}</h1><small>${new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</small></div></div>
  <div class="hero"><div class="lbl">${b.company < 0 ? 'Компания должна мне' : 'Деньги компании у меня'}</div><div class="amt">${fmt(Math.abs(b.company))}</div>
    <div class="sub"><span>на карте <b>${fmt(b.card.company)}</b></span><span>наличными <b>${fmt(b.cash.company)}</b></span></div><div class="sig">Violetta</div></div>
  <div class="duo"><div class="stat"><div class="lbl">Мои личные</div><div class="amt">${fmt(b.personal)}</div><div class="hint">карта ${fmt(b.card.personal)}</div></div>
    <div class="stat"><div class="lbl">Всего на карте</div><div class="amt">${fmt(b.cardT)}</div><div class="hint">наличные ${fmt(b.cashT)}</div></div></div>
  ${other ? `<div class="card" style="margin-top:12px;padding:6px 16px">${other}</div>` : ''}
  <form class="quick" data-form="quick"><input type="text" name="q" placeholder="такси 3500 компания" autocomplete="off"><button class="icon-btn" aria-label="Добавить">${ic('go')}</button></form>
  <div class="acts">
    <button class="act g" data-a="newOp" data-type="income" data-owner="company"><i>${ic('in')}</i>Пришло от компании</button>
    <button class="act g" data-a="newOp" data-type="expense" data-owner="company"><i>${ic('bag')}</i>Расход компании</button>
    <button class="act" data-a="newOp" data-type="expense" data-owner="personal"><i>${ic('out')}</i>Личный расход</button>
    <button class="act" data-a="newOp" data-type="transfer" data-owner="company"><i>${ic('cash')}</i>Снять наличные</button></div>
  ${nd ? `<div class="sec"><h2>Напоминания</h2></div>${nd}` : ''}
  <div class="sec"><h2>Последние операции</h2>${recent.length ? '<button data-a="tab" data-tab="ops">Все</button>' : ''}</div>
  ${recent.length ? `<div class="list">${recent.map(opRow).join('')}</div>` : '<div class="card empty"><b>Пока пусто</b>Добавьте первую операцию кнопкой «+» или строкой выше.</div>'}`;
};
V.ops = () => {
  const ops = S.ops.filter(o => o.date.slice(0, 7) === ui.month && (ui.filter === 'all' || (ui.filter === 'noreceipt' ? (o.type === 'expense' && o.owner === 'company' && !o.receipt) : o.owner === ui.filter))).sort(byDate).reverse();
  let html = '', day = '';
  for (const o of ops) { if (o.date !== day) { if (day) html += '</div>'; day = o.date; html += `<div class="day">${dayLabel(day)}</div><div class="list">`; } html += opRow(o); }
  if (day) html += '</div>';
  const F = [['all', 'Все'], ['company', 'Компания'], ['personal', 'Личные'], ['noreceipt', 'Без чека']];
  return `<h1 class="title">Операции</h1>
  <div class="row" style="align-items:center;margin-bottom:12px"><button class="btn ghost sm" style="flex:none" data-a="month" data-k="-1">‹</button><div style="text-align:center;font-weight:600">${monthName(ui.month)} ${S.closed[ui.month] ? '<span class="tag em">закрыт</span>' : ''}</div><button class="btn ghost sm" style="flex:none" data-a="month" data-k="1">›</button></div>
  <div class="chips">${F.map(([k, t]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-a="filter" data-f="${k}">${t}</button>`).join('')}</div>
  ${html || '<div class="empty"><b>Нет операций</b>За этот месяц с таким фильтром ничего нет.</div>'}`;
};
V.deals = () => {
  const seg = `<div class="seg" style="margin-bottom:14px">${[['tasks', 'Задачи'], ['trips', 'Поездки'], ['tpl', 'Шаблоны']].map(([k, t]) => `<button class="${ui.deals === k ? 'on' : ''}" data-a="deals" data-k="${k}">${t}</button>`).join('')}</div>`;
  let body = '';
  if (ui.deals === 'tasks') {
    const t = today(), open = S.tasks.filter(x => !x.done).sort((a, b) => (a.due || '9').localeCompare(b.due || '9')), done = S.tasks.filter(x => x.done).slice(-10).reverse();
    const row = x => `<div class="item ${x.done ? 'done' : ''}"><button class="check ${x.done ? 'on' : ''}" data-a="toggleTask" data-id="${x.id}">${x.done ? ic('ok') : ''}</button><button class="mid" data-a="editTask" data-id="${x.id}" style="text-align:left"><div class="t">${esc(x.title)}</div><div class="s">${x.due ? (x.due < t && !x.done ? '<span class="tag red">просрочено</span> ' : '') + dayLabel(x.due) : 'без срока'}${x.important ? ' · <span class="tag">важно</span>' : ''}</div></button></div>`;
    body = `<button class="btn" data-a="editTask">${ic('plus')} Новая задача</button>
      ${open.length ? `<div class="sec"><h2>В работе</h2></div><div class="list">${open.map(row).join('')}</div>` : '<div class="empty"><b>Всё сделано</b>Поручения и дела со сроками появятся здесь.</div>'}
      ${done.length ? `<div class="sec"><h2>Выполнено</h2></div><div class="list">${done.map(row).join('')}</div>` : ''}`;
  } else if (ui.deals === 'trips') {
    const tr = [...S.trips].sort((a, b) => (b.from || '').localeCompare(a.from || ''));
    body = `<button class="btn" data-a="editTrip">${ic('plus')} Новая поездка или событие</button><div style="height:14px"></div>` + (tr.length ? tr.map(x => { const d = x.check.filter(c => c.done).length, tops = S.ops.filter(o => o.tripId === x.id), sum = tops.length; return `<button class="card" style="width:100%;text-align:left;display:block" data-a="trip" data-id="${x.id}"><h3>${esc(x.title)}</h3><p>${esc(x.place || '')}${x.from ? (x.place ? ' · ' : '') + dmy(x.from) + (x.to && x.to !== x.from ? ' – ' + dmy(x.to) : '') : ''}</p><div style="margin-top:10px;display:flex;gap:8px"><span class="tag em">готово ${d} из ${x.check.length}</span>${sum ? `<span class="tag">расходы ${sums(tops)}</span>` : ''}</div></button>`; }).join('') : '<div class="empty"><b>Нет поездок</b>Командировки, встречи и мероприятия с чек-листом и расходами.</div>');
  } else {
    body = `<button class="btn" data-a="editTpl">${ic('plus')} Новый шаблон</button><div style="height:14px"></div>` + S.templates.map(x => `<div class="card"><h3>${esc(x.title)}</h3><p style="max-height:66px;overflow:hidden">${esc(x.body)}</p><div class="row" style="margin-top:12px"><button class="btn sm" data-a="copyTpl" data-id="${x.id}">${ic('copy')} Скопировать</button><button class="btn ghost sm" data-a="editTpl" data-id="${x.id}">Изменить</button></div></div>`).join('');
  }
  return `<h1 class="title">Дела</h1>${seg}${body}`;
};
V.more = () => `<h1 class="title">Ещё</h1>
  <div class="list">
    <button class="item" data-a="recon"><span class="dot">${ic('swap')}</span><span class="mid"><div class="t">Сверка с банком</div><div class="s">${S.recon.length ? 'последняя ' + dmy(S.recon[S.recon.length - 1].date) : 'ещё не было'}</div></span>${ic('go')}</button>
    <button class="item" data-a="archive"><span class="dot c">${ic('cal')}</span><span class="mid"><div class="t">Архив и отчёты</div><div class="s">закрыто месяцев: ${Object.keys(S.closed).length}</div></span>${ic('go')}</button>
    <button class="item" data-a="showLog"><span class="dot">${ic('list')}</span><span class="mid"><div class="t">Журнал изменений</div><div class="s">записей: ${S.log.length}</div></span>${ic('go')}</button>
    <button class="item" data-a="reminders"><span class="dot c">${ic('bell')}</span><span class="mid"><div class="t">Напоминания в календарь</div><div class="s">операции, сверка, закрытие месяца</div></span>${ic('go')}</button>
  </div>
  <div class="sec"><h2>Настройки</h2></div>
  <div class="list">
    <button class="item" data-a="cloud"><span class="mid"><div class="t">Облако</div><div class="s">${Cloud.status()}</div></span>${ic('go')}</button>
    <button class="item" data-a="profile"><span class="mid"><div class="t">Имя и валюта</div><div class="s">${esc(S.profile.name)} · ${esc(S.profile.currency)}</div></span>${ic('go')}</button>
    <button class="item" data-a="pin"><span class="mid"><div class="t">PIN-код</div><div class="s">${S.profile.pin ? 'включён' : 'выключен'}</div></span>${ic('go')}</button>
    <button class="item" data-a="backup"><span class="mid"><div class="t">Сохранить резервную копию</div><div class="s">файл со всеми данными и чеками</div></span>${ic('go')}</button>
    <label class="item" style="cursor:pointer"><span class="mid"><div class="t">Восстановить из копии</div><div class="s">заменит текущие данные</div></span>${ic('go')}<input type="file" accept=".json,application/json" data-c="restore" hidden></label>
  </div>`;

function render() {
  if (!S.profile.ready) { $('#tabbar').hidden = true; $('#view').innerHTML = onboarding(); return; }
  $('#tabbar').hidden = false;
  $('#view').innerHTML = V[ui.tab]();
  const T = [['home', 'Главная', 'home'], ['ops', 'Операции', 'list'], null, ['deals', 'Дела', 'tasks'], ['more', 'Ещё', 'more']];
  $('#tabbar').innerHTML = T.map(t => t ? `<button class="${ui.tab === t[0] ? 'on' : ''}" data-a="tab" data-tab="${t[0]}">${ic(t[2])}${t[1]}</button>` : `<button class="plus" data-a="newOp" aria-label="Новая операция">${ic('plus')}</button>`).join('');
}
function onboarding() {
  return `<div class="welcome"><div class="big">VJ</div><h1 class="title" style="margin:6px 0 0">Личный кабинет</h1><p>Учёт денег и дела в одном месте</p></div>
  <form data-form="start">
    <label class="f"><span>Как к вам обращаться</span><input type="text" name="name" value="Виолетта"></label>
    <div class="flabel" style="margin-top:14px">Валюта</div>
    <div class="seg">${['₽', '₸', '$', '€', 'AED'].map((c, i) => `<label><input type="radio" name="cur" value="${c}" ${i ? '' : 'checked'}><span>${c}</span></label>`).join('')}</div>
    <div class="sec"><h2>Сколько денег сейчас</h2></div>
    <div class="row"><label class="f" style="margin:0"><span>Карта: компании</span><input type="text" inputmode="decimal" name="cc" placeholder="0"></label><label class="f" style="margin:0"><span>Карта: личные</span><input type="text" inputmode="decimal" name="cp" placeholder="0"></label></div>
    <div class="row" style="margin-top:12px"><label class="f" style="margin:0"><span>Наличные: компании</span><input type="text" inputmode="decimal" name="nc" placeholder="0"></label><label class="f" style="margin:0"><span>Наличные: личные</span><input type="text" inputmode="decimal" name="np" placeholder="0"></label></div>
    <button class="btn gold" style="margin-top:22px">Начать</button>
    ${window.FIREBASE_CONFIG ? '<button type="button" class="btn ghost" style="margin-top:10px" data-a="cloud">У меня уже есть аккаунт</button>' : ''}
  </form>`;
}

/* ===== sheets ===== */
function sheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; $('#sheetBody').scrollTop = 0; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; }
const radio = (name, opts, val) => `<div class="seg">${opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}" ${v === val ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>`;
const select = (name, opts, val) => `<select name="${name}">${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
function opSheet(o = {}) {
  const ed = !!o.id, locked = ed && S.closed[o.date.slice(0, 7)];
  if (locked) return sheet(`<h2>${esc(opTitle(o))}</h2><div class="card">${[['Дата', dmy(o.date)], ['Тип', TYPE[o.type]], ['Сумма', fmt(o.amount, oc(o))], ['Чьи деньги', OWN[o.owner]], ['Счёт', o.type === 'transfer' ? ACC[o.account] + ' → ' + ACC[o.toAccount] : ACC[o.account]], ['Категория', o.category || '—'], ['Комментарий', o.note || '—']].map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>${o.receipt ? `<img class="rcpt" src="${o.receipt}" alt="Чек">` : ''}<p style="color:var(--muted);font-size:13px">Месяц закрыт, операция хранится в архиве без изменений.</p><button class="btn ghost" data-a="closeSheet">Закрыть</button>`);
  const type = o.type || 'expense', owner = o.owner || 'company';
  sheet(`<h2>${ed ? 'Операция' : 'Новая операция'}</h2>
  <form data-form="op" data-type="${type}" data-owner="${owner}">
    <input type="hidden" name="id" value="${o.id || ''}">
    <div data-c="opType">${radio('type', [['expense', 'Расход'], ['income', 'Приход'], ['transfer', 'Наличные'], ['return', 'Возврат']], type)}</div>
    <label class="f"><span>Сумма</span><input class="amount-in" type="text" inputmode="decimal" name="amount" value="${o.amount || ''}" placeholder="0" autocomplete="off"></label>
    ${curs().length > 1 ? `<div style="margin-top:8px">${radio('cur', curs().map(c => [c, c]), o.cur || S.profile.currency)}</div>` : ''}
    <div class="f-owner" data-c="opOwner"><div class="flabel" style="margin-top:14px">Чьи деньги</div>${radio('owner', [['company', 'Компании'], ['personal', 'Личные']], owner)}</div>
    <div class="f-account"><div class="flabel" style="margin-top:14px">Счёт</div>${radio('account', [['card', 'Карта'], ['cash', 'Наличные']], o.account || 'card')}</div>
    <div class="f-dir"><div class="flabel" style="margin-top:14px">Направление</div>${radio('dir', [['c2n', 'Снять с карты'], ['n2c', 'Внести на карту']], o.account === 'cash' ? 'n2c' : 'c2n')}</div>
    <label class="f f-cat f-catc"><span>Категория</span>${select('catC', CAT_C, o.category)}</label>
    <label class="f f-cat f-catp"><span>Категория</span>${select('catP', CAT_P, o.category)}</label>
    ${S.trips.length ? `<label class="f f-cat f-trip"><span>Поездка или событие</span>${select('trip', [['', 'Не привязывать'], ...S.trips.map(t => [t.id, t.title])], o.tripId || '')}</label>` : ''}
    <label class="f"><span>Комментарий</span><input type="text" name="note" value="${esc(o.note || '')}" placeholder="На что или от кого"></label>
    <div class="row"><label class="f"><span>Дата</span><input type="date" name="date" value="${o.date || today()}"></label>
    <label class="f f-rcpt"><span>Чек</span><input type="file" name="receipt" accept="image/*" style="font-size:12px;padding:12px 8px;width:100%"></label></div>
    ${o.receipt ? `<img class="rcpt f-rcpt" src="${o.receipt}" alt="Чек">` : ''}
    <button class="btn" style="margin-top:20px">Сохранить</button>
    ${ed ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delOp" data-id="${o.id}">Удалить</button>` : ''}
  </form>`);
  if (!ed && !o.amount) setTimeout(() => { const i = $('#sheetBody [name=amount]'); i && i.focus(); }, 280);
}
function reconSheet() {
  const b = balances();
  sheet(`<h2>Сверка с банком</h2><p style="color:var(--muted);margin-top:-6px">Введите, сколько денег есть на самом деле. Приложение покажет расхождение.</p>
  <form data-form="recon"><div class="card"><div class="kv"><span>По учёту на карте</span><b>${fmt(b.cardT)}</b></div><div class="kv"><span>По учёту наличными</span><b>${fmt(b.cashT)}</b></div></div>
  <label class="f"><span>На карте по факту</span><input type="text" inputmode="decimal" name="card" placeholder="${nf.format(b.cardT)}"></label>
  <label class="f"><span>Наличных по факту</span><input type="text" inputmode="decimal" name="cash" placeholder="${nf.format(b.cashT)}"></label>
  <button class="btn" style="margin-top:18px">Сверить</button></form>
  ${S.recon.length ? `<div class="sec"><h2>История</h2></div><div class="list">${[...S.recon].reverse().slice(0, 8).map(r => `<div class="item"><span class="mid"><div class="t">${dmy(r.date)}</div><div class="s">карта ${fmt(r.dCard)} · наличные ${fmt(r.dCash)}</div></span><span class="tag ${r.dCard || r.dCash ? 'red' : 'em'}">${r.dCard || r.dCash ? 'расхождение' : 'сошлось'}</span></div>`).join('')}</div>` : ''}`);
}
function archiveSheet() {
  const ms = [...new Set(S.ops.map(o => o.date.slice(0, 7)))].sort().reverse(), cur = today().slice(0, 7);
  sheet(`<h2>Архив и отчёты</h2><p style="color:var(--muted);margin-top:-6px">Закрытый месяц нельзя изменить. В отчёт попадают все операции, чеки и контрольный код.</p>
  ${ms.length ? `<div class="list">${ms.map(m => `<div class="item"><span class="mid"><div class="t" style="text-transform:capitalize">${monthName(m)}</div><div class="s">${S.closed[m] ? 'закрыт ' + dmy(S.closed[m].at.slice(0, 10)) : 'открыт'}</div></span><button class="btn ghost sm" data-a="report" data-m="${m}">Отчёт</button>${!S.closed[m] && m < cur ? `<button class="btn sm" data-a="closeMonth" data-m="${m}">Закрыть</button>` : ''}</div>`).join('')}</div>` : '<div class="empty"><b>Пока нечего архивировать</b>Отчёты появятся после первых операций.</div>'}`);
}
function reportData(m) {
  const before = S.ops.filter(o => o.date < m + '-01'), ops = S.ops.filter(o => o.date.slice(0, 7) === m).sort(byDate);
  const per = curs().concat([...new Set(ops.map(oc))].filter(c => !curs().includes(c))).map(cur => {
    const mine = ops.filter(o => oc(o) === cur), sum = f => mine.filter(f).reduce((s, o) => s + o.amount, 0), cats = {};
    mine.filter(o => o.type === 'expense' && o.owner === 'company').forEach(o => cats[o.category || 'Прочее'] = (cats[o.category || 'Прочее'] || 0) + o.amount);
    return { cur, n: mine.length, open: balances(before, cur), close: balances(before.concat(ops), cur), cats, cIn: sum(o => o.type === 'income' && o.owner === 'company'), cOut: sum(o => o.type === 'expense' && o.owner === 'company'), cRet: sum(o => o.type === 'return'), pIn: sum(o => o.type === 'income' && o.owner === 'personal'), pOut: sum(o => o.type === 'expense' && o.owner === 'personal') };
  }).filter((p, i) => i === 0 || p.n || p.open.company || p.open.personal);
  return { ops, per };
}
const opsDigest = ops => sha(JSON.stringify(ops.map(o => [o.id, o.date, o.type, o.amount, oc(o), o.owner, o.account, o.toAccount || '', o.category || '', o.note || '', o.receipt ? o.receipt.length : 0])));
function showReport(m) {
  const d = reportData(m), c = S.closed[m], trip = id => (S.trips.find(t => t.id === id) || {}).title || '', rc = d.ops.filter(o => o.receipt);
  $('#report').innerHTML = `<div class="rep"><div class="rep-bar"><button class="btn sm" data-a="print">Печать / PDF</button><button class="btn ghost sm" data-a="csv" data-m="${m}">Excel (CSV)</button><button class="btn ghost sm" data-a="closeReport">Закрыть</button></div>
  <h1>Отчёт за ${monthName(m)}</h1><div class="meta">${esc(S.profile.name)} · валюта ${esc(S.profile.currency)} · сформирован ${new Date().toLocaleString('ru-RU')}<br>${c ? `Месяц закрыт ${new Date(c.at).toLocaleString('ru-RU')}. Контрольный код: ${c.hash}` : 'ЧЕРНОВИК: месяц не закрыт, данные могут измениться.'}</div>
  ${d.per.map(d => (FC = d.cur, `<h2>Деньги компании, ${esc(d.cur)}</h2><table>
    <tr><td>Остаток на начало месяца</td><td class="n">${fmt(d.open.company)}</td></tr><tr><td>Получено от компании</td><td class="n">+${fmt(d.cIn)}</td></tr>
    <tr><td>Потрачено на нужды компании</td><td class="n">−${fmt(d.cOut)}</td></tr><tr><td>Возвращено компании</td><td class="n">−${fmt(d.cRet)}</td></tr>
    <tr><td><b>Остаток на конец месяца</b> (карта ${fmt(d.close.card.company)}, наличные ${fmt(d.close.cash.company)})</td><td class="n"><b>${fmt(d.close.company)}</b></td></tr></table>
  ${Object.keys(d.cats).length ? `<h2>Расходы компании по статьям, ${esc(d.cur)}</h2><table>${Object.entries(d.cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${fmt(v)}</td></tr>`).join('')}</table>` : ''}
  <h2>Личные деньги, ${esc(d.cur)}</h2><table><tr><td>Остаток на начало</td><td class="n">${fmt(d.open.personal)}</td></tr><tr><td>Поступило</td><td class="n">+${fmt(d.pIn)}</td></tr><tr><td>Потрачено</td><td class="n">−${fmt(d.pOut)}</td></tr><tr><td><b>Остаток на конец</b></td><td class="n"><b>${fmt(d.close.personal)}</b></td></tr></table>`)).join('')}${(FC = null, '')}
  <h2>Все операции (${d.ops.length})</h2><table><tr><th>№</th><th>Дата</th><th>Операция</th><th>Чьи</th><th>Счёт</th><th>Комментарий</th><th>Чек</th><th class="n">Сумма</th></tr>
  ${d.ops.map((o, i) => `<tr><td>${i + 1}</td><td>${dmy(o.date)}</td><td>${TYPE[o.type]}${o.category ? '<br>' + esc(o.category) : ''}</td><td>${OWN[o.owner]}</td><td>${o.type === 'transfer' ? ACC[o.account] + ' → ' + ACC[o.toAccount] : ACC[o.account]}</td><td>${esc(o.note || '')}${o.tripId ? '<br><i>' + esc(trip(o.tripId)) + '</i>' : ''}</td><td>${o.receipt ? 'есть' : '—'}</td><td class="n">${opSign(o) > 0 ? '+' : opSign(o) < 0 ? '−' : ''}${nf.format(o.amount)} ${esc(oc(o))}</td></tr>`).join('')}</table>
  ${rc.length ? `<h2>Приложение: чеки (${rc.length})</h2><div class="rc">${rc.map(o => `<figure><img src="${o.receipt}" alt=""><figcaption>№ ${d.ops.indexOf(o) + 1} · ${dmy(o.date)} · ${nf.format(o.amount)} ${esc(oc(o))} · ${esc(opTitle(o))}</figcaption></figure>`).join('')}</div>` : ''}</div>`;
  $('#report').hidden = false; $('#report').scrollTop = 0;
}
function csv(m) {
  const d = reportData(m), q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const rows = [['Дата', 'Тип', 'Чьи деньги', 'Счёт', 'Категория', 'Сумма', 'Валюта', 'Комментарий', 'Чек', 'Поездка']].concat(d.ops.map(o => [dmy(o.date), TYPE[o.type], OWN[o.owner], o.type === 'transfer' ? ACC[o.account] + ' → ' + ACC[o.toAccount] : ACC[o.account], o.category || '', String((opSign(o) || 1) * o.amount).replace('.', ','), oc(o), o.note || '', o.receipt ? 'есть' : 'нет', (S.trips.find(t => t.id === o.tripId) || {}).title || '']));
  rows.push([]); d.per.forEach(p => rows.push(['Остаток денег компании на конец', '', '', '', '', String(p.close.company).replace('.', ','), p.cur], ['Остаток личных на конец', '', '', '', '', String(p.close.personal).replace('.', ','), p.cur]));
  saveFile(`otchet-${m}.csv`, '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv');
}
function tripSheet(id) {
  const x = S.trips.find(t => t.id === id); if (!x) return;
  const ops = S.ops.filter(o => o.tripId === id);
  sheet(`<h2>${esc(x.title)}</h2><p style="color:var(--muted);margin-top:-6px">${esc(x.place || '')} ${x.from ? dmy(x.from) + (x.to && x.to !== x.from ? ' – ' + dmy(x.to) : '') : ''}</p>
  ${x.notes ? `<div class="card"><p>${esc(x.notes)}</p></div>` : ''}
  <div class="sec"><h2>Чек-лист</h2></div><div class="list">${x.check.map((c, i) => `<button class="item ${c.done ? 'done' : ''}" data-a="toggleCheck" data-id="${id}" data-i="${i}"><span class="check ${c.done ? 'on' : ''}">${c.done ? ic('ok') : ''}</span><span class="mid"><div class="t">${esc(c.t)}</div></span></button>`).join('')}</div>
  <form class="quick" data-form="addCheck"><input type="hidden" name="id" value="${id}"><input type="text" name="t" placeholder="Добавить пункт"><button class="icon-btn">${ic('plus')}</button></form>
  <div class="sec"><h2>Расходы: ${sums(ops)}</h2></div>${ops.length ? `<div class="list">${ops.map(opRow).join('')}</div>` : '<p style="color:var(--muted);font-size:13.5px">Привяжите расход компании к поездке при добавлении операции.</p>'}
  <div class="row" style="margin-top:18px"><button class="btn ghost" data-a="editTrip" data-id="${id}">Изменить</button>${x.from ? `<button class="btn ghost" data-a="icsTrip" data-id="${id}">В календарь</button>` : ''}</div>`);
}

/* ===== actions ===== */
const A = {
  closeSheet, tab(d) { ui.tab = d.tab; render(); window.scrollTo(0, 0); },
  goDeals() { ui.tab = 'deals'; ui.deals = 'tasks'; render(); },
  noReceipt() { ui.tab = 'ops'; ui.filter = 'noreceipt'; render(); },
  newOp(d) { opSheet({ type: d.type, owner: d.owner }); },
  editOp(d) { const o = S.ops.find(x => x.id === d.id); if (o) opSheet(o); },
  delOp(d) { const i = S.ops.findIndex(x => x.id === d.id); if (i < 0 || !confirm('Удалить операцию? Запись об удалении останется в журнале.')) return; log('Удалена операция: ' + describe(S.ops[i])); S.ops.splice(i, 1); save(); closeSheet(); render(); toast('Удалено'); },
  filter(d) { ui.filter = d.f; render(); }, month(d) { ui.month = shiftMonth(ui.month, +d.k); render(); },
  deals(d) { ui.deals = d.k; render(); },
  recon: reconSheet, archive: archiveSheet,
  report(d) { closeSheet(); showReport(d.m); }, closeReport() { $('#report').hidden = true; $('#report').innerHTML = ''; }, print() { window.print(); }, csv(d) { csv(d.m); },
  async closeMonth(d) { if (!confirm(`Закрыть ${monthName(d.m)}? После этого операции месяца нельзя будет изменить или удалить.`)) return; const ops = S.ops.filter(o => o.date.slice(0, 7) === d.m).sort(byDate); S.closed[d.m] = { at: new Date().toISOString(), hash: await opsDigest(ops), count: ops.length }; log(`Закрыт месяц ${monthName(d.m)}: операций ${ops.length}, код ${S.closed[d.m].hash.slice(0, 12)}…`); save(); render(); archiveSheet(); toast('Месяц закрыт'); },
  showLog() { sheet(`<h2>Журнал изменений</h2>${S.log.length ? `<div class="list">${[...S.log].reverse().slice(0, 200).map(l => `<div class="item"><span class="mid"><div class="s">${new Date(l.at).toLocaleString('ru-RU')}</div><div style="font-size:13.5px;white-space:normal">${esc(l.t)}</div></span></div>`).join('')}</div>` : '<div class="empty">Записей пока нет.</div>'}`); },
  reminders() { sheet(`<h2>Напоминания</h2><p style="color:var(--muted);margin-top:-6px">Откроется файл события. Добавьте его в календарь айфона, и он будет напоминать сам.</p><div class="list">
    <button class="item" data-a="ics" data-k="day"><span class="mid"><div class="t">Каждый вечер в 20:00</div><div class="s">внести операции за день</div></span>${ic('cal')}</button>
    <button class="item" data-a="ics" data-k="week"><span class="mid"><div class="t">Каждое воскресенье</div><div class="s">сверить остаток с банком</div></span>${ic('cal')}</button>
    <button class="item" data-a="ics" data-k="month"><span class="mid"><div class="t">Первого числа</div><div class="s">закрыть месяц и сохранить отчёт</div></span>${ic('cal')}</button></div>`); },
  ics(d) { const t = today(); if (d.k === 'day') makeIcs('VJ: внести операции за день', t, { time: '2000', rrule: 'FREQ=DAILY' }); else if (d.k === 'week') makeIcs('VJ: сверить остаток с банком', t, { time: '1900', rrule: 'FREQ=WEEKLY;BYDAY=SU' }); else makeIcs('VJ: закрыть месяц и сохранить отчёт', t, { time: '1000', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1' }); },
  profile() { sheet(`<h2>Имя и валюта</h2><form data-form="profile"><label class="f"><span>Имя</span><input type="text" name="name" value="${esc(S.profile.name)}"></label><label class="f"><span>Основная валюта (знак)</span><input type="text" name="cur" value="${esc(S.profile.currency)}" maxlength="4"></label><label class="f"><span>Другие валюты через запятую</span><input type="text" name="extra" value="${esc((S.profile.extra || []).join(', '))}" placeholder="$, €"></label><button class="btn" style="margin-top:18px">Сохранить</button></form>`); },
  pin() { sheet(`<h2>PIN-код</h2><form data-form="pin"><label class="f"><span>Новый PIN, 4 цифры</span><input type="password" inputmode="numeric" name="pin" maxlength="4" autocomplete="off"></label><button class="btn" style="margin-top:18px">Установить</button>${S.profile.pin ? '<button type="button" class="btn danger" style="margin-top:10px" data-a="pinOff">Отключить PIN</button>' : ''}</form>`); },
  pinOff() { S.profile.pin = null; save(); closeSheet(); render(); toast('PIN отключён'); },
  async backup() { S.lastBackup = Date.now(); await saveFile(`vj-kopiya-${today()}.json`, JSON.stringify(S), 'application/json'); save(); render(); },
  toggleTask(d) { const x = S.tasks.find(t => t.id === d.id); if (x) { x.done = !x.done; save(); render(); } },
  editTask(d) { const x = S.tasks.find(t => t.id === d.id) || {}; sheet(`<h2>${x.id ? 'Задача' : 'Новая задача'}</h2><form data-form="task"><input type="hidden" name="id" value="${x.id || ''}"><label class="f"><span>Что сделать</span><input type="text" name="title" value="${esc(x.title || '')}" placeholder="Забронировать переговорную"></label><div class="row"><label class="f"><span>Срок</span><input type="date" name="due" value="${x.due || ''}"></label><div class="f" style="margin-top:14px"><div class="flabel">Важность</div>${radio('imp', [['', 'Обычная'], ['1', 'Важно']], x.important ? '1' : '')}</div></div><label class="f"><span>Заметка</span><textarea name="note" style="min-height:80px">${esc(x.note || '')}</textarea></label><button class="btn" style="margin-top:18px">Сохранить</button>${x.id ? `<div class="row" style="margin-top:10px">${x.due ? `<button type="button" class="btn ghost" data-a="icsTask" data-id="${x.id}">В календарь</button>` : ''}<button type="button" class="btn danger" data-a="delTask" data-id="${x.id}">Удалить</button></div>` : ''}</form>`); },
  delTask(d) { S.tasks = S.tasks.filter(t => t.id !== d.id); save(); closeSheet(); render(); },
  icsTask(d) { const x = S.tasks.find(t => t.id === d.id); if (x) makeIcs(x.title, x.due); },
  trip(d) { tripSheet(d.id); },
  editTrip(d) { const x = S.trips.find(t => t.id === d.id) || {}; sheet(`<h2>${x.id ? 'Поездка' : 'Новая поездка или событие'}</h2><form data-form="trip"><input type="hidden" name="id" value="${x.id || ''}"><label class="f"><span>Название</span><input type="text" name="title" value="${esc(x.title || '')}" placeholder="Командировка в Дубай"></label><label class="f"><span>Место</span><input type="text" name="place" value="${esc(x.place || '')}"></label><div class="row"><label class="f"><span>Начало</span><input type="date" name="from" value="${x.from || ''}"></label><label class="f"><span>Конец</span><input type="date" name="to" value="${x.to || ''}"></label></div><label class="f"><span>Заметки: рейсы, брони, контакты</span><textarea name="notes">${esc(x.notes || '')}</textarea></label><button class="btn" style="margin-top:18px">Сохранить</button>${x.id ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delTrip" data-id="${x.id}">Удалить</button>` : ''}</form>`); },
  delTrip(d) { if (!confirm('Удалить поездку? Расходы останутся в учёте.')) return; S.trips = S.trips.filter(t => t.id !== d.id); S.ops.forEach(o => { if (o.tripId === d.id) delete o.tripId; }); save(); closeSheet(); render(); },
  toggleCheck(d) { const x = S.trips.find(t => t.id === d.id); if (x) { x.check[+d.i].done = !x.check[+d.i].done; save(); render(); tripSheet(d.id); } },
  icsTrip(d) { const x = S.trips.find(t => t.id === d.id); if (x) makeIcs(x.title, x.from); },
  editTpl(d) { const x = S.templates.find(t => t.id === d.id) || {}; sheet(`<h2>${x.id ? 'Шаблон' : 'Новый шаблон'}</h2><form data-form="tpl"><input type="hidden" name="id" value="${x.id || ''}"><label class="f"><span>Название</span><input type="text" name="title" value="${esc(x.title || '')}"></label><label class="f"><span>Текст</span><textarea name="body" style="min-height:240px">${esc(x.body || '')}</textarea></label><button class="btn" style="margin-top:18px">Сохранить</button>${x.id ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delTpl" data-id="${x.id}">Удалить</button>` : ''}</form>`); },
  delTpl(d) { S.templates = S.templates.filter(t => t.id !== d.id); save(); closeSheet(); render(); },
  async copyTpl(d) { const x = S.templates.find(t => t.id === d.id); try { await navigator.clipboard.writeText(x.body); toast('Скопировано'); } catch (e) { toast('Не удалось скопировать'); } },
  key(d) { lockKey(d.k); }
};
const F = {
  start(fd) {
    S.profile.name = fd.get('name').trim() || 'Виолетта'; S.profile.currency = fd.get('cur'); S.profile.ready = true;
    [['cc', 'card', 'company'], ['cp', 'card', 'personal'], ['nc', 'cash', 'company'], ['np', 'cash', 'personal']].forEach(([k, account, owner]) => { const a = num(fd.get(k)); if (a > 0) S.ops.push({ id: uid(), type: 'income', date: today(), amount: a, account, owner, note: 'Начальный остаток', createdAt: new Date().toISOString() }); });
    log('Начало учёта'); save(); render();
  },
  quick(fd) { const q = fd.get('q').trim(); if (!q) return; opSheet(parseQuick(q)); },
  async op(fd, form) {
    const amount = num(fd.get('amount')); if (!(amount > 0)) return toast('Введите сумму');
    const type = fd.get('type'), date = fd.get('date') || today(), id = fd.get('id');
    if (S.closed[date.slice(0, 7)]) return toast('Этот месяц уже закрыт');
    const owner = type === 'return' ? 'company' : fd.get('owner');
    const o = { type, date, amount, owner, cur: fd.get('cur') || S.profile.currency, note: fd.get('note').trim() };
    if (type === 'transfer') { const c = fd.get('dir') === 'c2n'; o.account = c ? 'card' : 'cash'; o.toAccount = c ? 'cash' : 'card'; } else o.account = fd.get('account');
    if (type === 'expense') { o.category = fd.get(owner === 'company' ? 'catC' : 'catP'); if (owner === 'company' && fd.get('trip')) o.tripId = fd.get('trip'); }
    const i = id ? S.ops.findIndex(x => x.id === id) : -1, old = S.ops[i], file = fd.get('receipt');
    if (file && file.size && (type === 'expense' || type === 'return')) o.receipt = await compress(file); else if (old && old.receipt) o.receipt = old.receipt;
    if (old) { S.ops[i] = { ...o, id, createdAt: old.createdAt, updatedAt: new Date().toISOString() }; log('Изменена операция. Было: ' + describe(old) + '. Стало: ' + describe(o)); }
    else { S.ops.push({ ...o, id: uid(), createdAt: new Date().toISOString() }); log('Добавлена операция: ' + describe(o)); }
    ui.month = date.slice(0, 7); save(); closeSheet(); render(); toast('Сохранено');
  },
  recon(fd) {
    const b = balances(), fc = fd.get('card').trim(), fn = fd.get('cash').trim();
    const dCard = fc === '' ? 0 : Math.round((num(fc) - b.cardT) * 100) / 100, dCash = fn === '' ? 0 : Math.round((num(fn) - b.cashT) * 100) / 100;
    S.recon.push({ date: today(), dCard, dCash }); log(`Сверка: расхождение по карте ${nf.format(dCard)}, по наличным ${nf.format(dCash)}`); save(); render();
    const line = (t, d, acc) => d ? `<div class="card"><h3>${t}: ${d > 0 ? 'лишние' : 'не хватает'} ${fmt(Math.abs(d))}</h3><p>${d > 0 ? 'Вероятно, не внесено поступление.' : 'Вероятно, не внесён расход.'}</p><button class="btn sm" style="margin-top:12px" data-a="fix" data-acc="${acc}" data-d="${d}">Внести операцию</button></div>` : '';
    sheet(`<h2>${dCard || dCash ? 'Есть расхождение' : 'Всё сошлось'}</h2>${dCard || dCash ? line('Карта', dCard, 'card') + line('Наличные', dCash, 'cash') : '<div class="card"><p>Учёт совпадает с фактическими остатками.</p></div>'}<button class="btn ghost" style="margin-top:14px" data-a="closeSheet">Готово</button>`);
  },
  profile(fd) { S.profile.name = fd.get('name').trim() || S.profile.name; S.profile.currency = fd.get('cur').trim() || S.profile.currency; S.profile.extra = fd.get('extra').split(',').map(s => s.trim()).filter(Boolean); save(); closeSheet(); render(); },
  async pin(fd) { const p = fd.get('pin'); if (!/^\d{4}$/.test(p)) return toast('Нужно 4 цифры'); S.profile.pin = await sha('vj:' + p); save(); closeSheet(); render(); toast('PIN установлен'); },
  task(fd) { const title = fd.get('title').trim(); if (!title) return toast('Введите название'); const id = fd.get('id'), x = S.tasks.find(t => t.id === id) || (S.tasks.push({ id: uid(), done: false }), S.tasks[S.tasks.length - 1]); Object.assign(x, { title, due: fd.get('due'), important: !!fd.get('imp'), note: fd.get('note').trim() }); save(); closeSheet(); render(); },
  trip(fd) { const title = fd.get('title').trim(); if (!title) return toast('Введите название'); const id = fd.get('id'); let x = S.trips.find(t => t.id === id); if (!x) { x = { id: uid(), check: ['Билеты', 'Отель', 'Трансфер', 'Документы и виза', 'Расписание встреч', 'Маршрут отправлен руководителю'].map(t => ({ t, done: false })) }; S.trips.push(x); } Object.assign(x, { title, place: fd.get('place').trim(), from: fd.get('from'), to: fd.get('to'), notes: fd.get('notes').trim() }); save(); render(); tripSheet(x.id); },
  addCheck(fd) { const x = S.trips.find(t => t.id === fd.get('id')), t = fd.get('t').trim(); if (x && t) { x.check.push({ t, done: false }); save(); render(); tripSheet(x.id); } },
  tpl(fd) { const title = fd.get('title').trim(); if (!title) return toast('Введите название'); const id = fd.get('id'), x = S.templates.find(t => t.id === id) || (S.templates.unshift({ id: uid() }), S.templates[0]); Object.assign(x, { title, body: fd.get('body') }); save(); closeSheet(); render(); }
};
A.fix = d => { const v = +d.d; opSheet({ type: v > 0 ? 'income' : 'expense', owner: 'company', account: d.acc, amount: Math.abs(v) }); };

/* ===== lock ===== */
let pinBuf = '';
function showLock() { pinBuf = ''; const L = $('#lock'); L.hidden = false; L.innerHTML = `<div class="big">VJ</div><div class="pins">${'<i></i>'.repeat(4)}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '←'].map(k => k === '' ? '<span></span>' : `<button data-a="key" data-k="${k}">${k}</button>`).join('')}</div>`; }
async function lockKey(k) {
  if (k === '←') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < 4) pinBuf += k;
  document.querySelectorAll('#lock .pins i').forEach((el, i) => el.classList.toggle('on', i < pinBuf.length));
  if (pinBuf.length === 4) { if (await sha('vj:' + pinBuf) === S.profile.pin) $('#lock').hidden = true; else { toast('Неверный PIN'); showLock(); } }
}

/* ===== events ===== */
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el) return; const fn = A[el.dataset.a]; if (fn) { if (el.tagName === 'BUTTON' && el.type !== 'submit') e.preventDefault(); fn(el.dataset, el); } });
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); F[f.dataset.form](new FormData(f), f); });
document.addEventListener('change', e => {
  const t = e.target, f = t.closest('form[data-form=op]');
  if (f && t.name === 'type') f.dataset.type = t.value;
  if (f && t.name === 'owner') f.dataset.owner = t.value;
  if (t.dataset.c === 'restore' && t.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d.profile || !Array.isArray(d.ops)) throw 0; if (!confirm('Заменить текущие данные данными из копии?')) return; S = Object.assign(fresh(), d); save(); render(); toast('Данные восстановлены'); } catch (err) { toast('Файл не подходит'); } }; fr.readAsText(t.files[0]); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { DB.set('state', S); lockedAt = Date.now(); } else if (S.profile.pin && Date.now() - lockedAt > 60000) showLock(); });
let lockedAt = Date.now();

(async () => {
  await DB.open(); const d = await DB.get('state'); if (d && d.profile) S = Object.assign(fresh(), d);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
  render(); if (S.profile.pin) showLock();
  Cloud.init();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
