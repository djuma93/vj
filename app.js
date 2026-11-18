'use strict';
/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => iso(new Date());
const addDays = (d, k) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + k); return iso(x); };
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const num = v => { const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
let FC = null;
const fmt = (n, c) => nf.format(Math.round(n * 100) / 100) + ' ' + (c || FC || S.profile.currency);
const fmtK = (n, c) => { const a = Math.abs(n), s = n < 0 ? '−' : ''; return s + (a >= 1e6 ? (a / 1e6).toFixed(1).replace('.', ',') + ' млн' : a >= 1e4 ? Math.round(a / 1e3) + ' тыс' : nf.format(Math.round(a))) + ' ' + (c || S.profile.currency); };
const curs = () => [S.profile.currency, ...(S.profile.extra || []).filter(c => c && c !== S.profile.currency)];
const oc = o => o.cur || S.profile.currency;
const sums = ops => { const m = {}; ops.forEach(o => m[oc(o)] = (m[oc(o)] || 0) + o.amount); return Object.entries(m).map(([c, v]) => fmt(v, c)).join(' · ') || fmt(0); };
const total = (ops, f) => ops.filter(f).reduce((s, o) => s + o.amount, 0);
const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MON_S = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const monthName = m => { const [y, mm] = m.split('-'); return MONTHS[+mm - 1] + ' ' + y; };
const dmy = d => d ? d.split('-').reverse().join('.') : '';
const dm = d => { const x = new Date(d + 'T12:00'); return x.getDate() + ' ' + MON_S[x.getMonth()]; };
const dayLabel = d => { const t = today(); if (d === t) return 'Сегодня'; if (d === addDays(t, 1)) return 'Завтра'; if (d === addDays(t, -1)) return 'Вчера'; return new Date(d + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }); };
const shiftMonth = (m, k) => { const [y, mm] = m.split('-').map(Number); return iso(new Date(y, mm - 1 + k, 1)).slice(0, 7); };
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
async function sha(s) {
  if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return 'x' + h.toString(16);
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }
const P = {
  plus: 'M12 5v14M5 12h14', home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z', wallet: 'M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 7l11-3v3M16 13h.01',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z', slides: 'M3 5h18v11H3zM8 20h8M12 16v4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', in: 'M12 4v12M6 11l6 6 6-6M5 20h14', out: 'M12 20V8M6 13l6-6 6 6M5 4h14', bag: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
  cash: 'M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', ok: 'M5 12l5 5 9-10', copy: 'M9 9h10v11H9zM5 15V4h10', cal: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4',
  go: 'M9 6l6 6-6 6', back: 'M15 6l-6 6 6 6', swap: 'M7 8h12l-3-3M17 16H5l3 3', plane: 'M3 13l18-8-6 16-3-7z', doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6', play: 'M8 5v14l11-7z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', close: 'M6 6l12 12M18 6L6 18', clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', flag: 'M5 21V4h11l-2 4 2 4H5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', chart: 'M5 20V11M12 20V5M19 20v-6M3 20h18', archive: 'M4 5h16v4H4zM5 9v10h14V9M10 13h4', lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', mail: 'M3 6h18v12H3zM3 7l9 6 9-6', dup: 'M8 8h12v12H8zM4 16V4h12'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

/* ================= storage ================= */
const DB = {
  db: null,
  open() { return new Promise(res => { try { const r = indexedDB.open('vj-ledger', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { this.db = r.result; res(); }; r.onerror = () => res(); } catch (e) { res(); } }); },
  get(k) { return new Promise(res => { if (!this.db) { try { res(JSON.parse(localStorage.getItem(k))); } catch (e) { res(null); } return; } const r = this.db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); }); },
  set(k, v) { if (!this.db) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } return; } this.db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); }
};
const LETTERS = [
  ['Запрос на бронь отеля', 'Добрый день!\n\nПрошу забронировать номер:\n— Гость: [ФИО]\n— Даты: с [дата] по [дата]\n— Категория номера: [категория]\n— Пожелания: ранний заезд / поздний выезд, тихий этаж\n\nПрошу прислать подтверждение и условия отмены.\n\nС уважением,\nВиолетта'],
  ['Подтверждение встречи', 'Добрый день, [имя]!\n\nПодтверждаю встречу с [руководитель]:\n— Дата и время: [дата], [время]\n— Место / ссылка: [адрес или ссылка]\n— Тема: [тема]\n\nЕсли планы изменятся, пожалуйста, дайте знать заранее.\n\nС уважением,\nВиолетта'],
  ['Перенос встречи', 'Добрый день, [имя]!\n\nК сожалению, встречу [дата, время] необходимо перенести. Предлагаю варианты:\n— [вариант 1]\n— [вариант 2]\n\nПодскажите, пожалуйста, какой удобнее.\n\nС уважением,\nВиолетта'],
  ['Маршрут для руководителя', 'Маршрут: [город], [даты]\n\n✈ Вылет: [дата, время], рейс [номер], терминал [ ]\n🏨 Отель: [название], [адрес], бронь № [ ]\n🚘 Трансфер: [время], водитель [имя, телефон]\n\nВстречи:\n— [дата, время] · [с кем] · [адрес]\n— [дата, время] · [с кем] · [адрес]\n\n✈ Обратно: [дата, время], рейс [номер]'],
  ['Благодарность партнёру', 'Добрый день, [имя]!\n\nБлагодарю за встречу и продуктивное обсуждение. Как договорились, направляю [материалы / следующие шаги]:\n— [пункт 1]\n— [пункт 2]\n\nБудем рады продолжить сотрудничество.\n\nС уважением,\nВиолетта']
];
const fresh = () => ({ v: 2, profile: { name: 'Виолетта', currency: '₽', extra: ['$', '€'], budget: 0, pin: null, ready: false }, ops: [], tasks: [], trips: [], decks: [], templates: LETTERS.map(([title, body]) => ({ id: uid(), title, body })), recon: [], closed: {}, log: [] });
let S = fresh();
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => DB.set('state', S), 150); if (window.Cloud) Cloud.touch(); };
const ui = { tab: 'home', fin: 'ops', filter: 'all', month: today().slice(0, 7), q: '', as: 'list', day: null, deck: null };

/* ================= money model ================= */
const CAT_C = ['Билеты', 'Отель', 'Такси и транспорт', 'Представительские', 'Офис и канцелярия', 'Подарки', 'Курьер и доставка', 'Прочее'];
const CAT_P = ['Продукты', 'Кафе', 'Транспорт', 'Покупки', 'Здоровье', 'Красота', 'Дом', 'Прочее'];
const TYPE = { expense: 'Расход', income: 'Поступление', transfer: 'Перевод', return: 'Возврат компании', exchange: 'Обмен валюты' };
/* ---- курсы валют ---- */
const ISO = { '₽': 'RUB', '$': 'USD', '€': 'EUR', '₸': 'KZT', '£': 'GBP', '¥': 'CNY', '₺': 'TRY', '₾': 'GEL', '֏': 'AMD', '₴': 'UAH', 'сум': 'UZS' };
const code = c => ISO[c] || (/^[A-Za-z]{3}$/.test(c || '') ? c.toUpperCase() : null);
let ratesBusy = null;
function getRates(force) {
  const R = S.rates; if (!force && R && Date.now() - R.at < 2 * 3600e3) return Promise.resolve(R);
  if (ratesBusy) return ratesBusy;
  ratesBusy = (async () => {
    const next = { ...(S.rates || {}) };
    try { const j = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' }).then(x => x.json()); if (j.result === 'success') { next.mk = j.rates; next.mkAt = j.time_last_update_unix * 1000; } } catch (e) { }
    try { const c = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', { cache: 'no-store' }).then(x => x.json()); const v = { RUB: 1 }; Object.values(c.Valute).forEach(x => v[x.CharCode] = x.Value / x.Nominal); next.cb = v; next.cbAt = c.Date; } catch (e) { }
    if (next.mk || next.cb) { next.at = Date.now(); S.rates = next; DB.set('state', S); }
    ratesBusy = null; return S.rates;
  })();
  return ratesBusy;
}
// сколько единиц `to` за 1 единицу `from`
function rateOf(from, to, src = 'mk') {
  const R = S.rates, a = code(from), b = code(to); if (!R || !a || !b || a === b) return a && a === b ? 1 : null;
  if (src === 'mk') return R.mk && R.mk[a] && R.mk[b] ? R.mk[b] / R.mk[a] : null;
  return R.cb && R.cb[a] && R.cb[b] ? R.cb[a] / R.cb[b] : null;
}
const nf4 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 });
const rateText = (r, from, to) => !r ? '—' : r >= 1 ? `1 ${from} = ${nf4.format(+r.toPrecision(6))} ${to}` : `1 ${to} = ${nf4.format(+(1 / r).toPrecision(6))} ${from}`;
const OWN = { company: 'Компания', personal: 'Личные' };
const ACC = { card: 'Карта', cash: 'Наличные' };
function balances(ops = S.ops, cur = S.profile.currency) {
  const b = { card: { company: 0, personal: 0 }, cash: { company: 0, personal: 0 } };
  for (const o of ops) {
    if (o.type === 'exchange') { if (oc(o) === cur) b[o.account][o.owner] -= o.amount; if (o.toCur === cur) b[o.toAccount || o.account][o.owner] += o.toAmount; continue; }
    if (oc(o) !== cur) continue;
    if (o.type === 'income') b[o.account][o.owner] += o.amount;
    else if (o.type === 'transfer') { b[o.account][o.owner] -= o.amount; b[o.toAccount][o.owner] += o.amount; }
    else b[o.account][o.owner] -= o.amount;
  }
  b.company = b.card.company + b.cash.company; b.personal = b.card.personal + b.cash.personal;
  b.cardT = b.card.company + b.card.personal; b.cashT = b.cash.company + b.cash.personal;
  return b;
}
const accText = o => o.type === 'transfer' || (o.type === 'exchange' && o.toAccount && o.toAccount !== o.account) ? ACC[o.account] + ' → ' + ACC[o.toAccount] : ACC[o.account];
const exText = o => `${nf.format(o.amount)} ${oc(o)} → ${nf.format(o.toAmount)} ${o.toCur}`;
const opTitle = o => o.note || o.category || (o.type === 'exchange' ? `Обмен ${oc(o)} → ${o.toCur}` : o.type === 'transfer' ? (o.account === 'card' ? 'Снятие наличных' : 'Внесение на карту') : o.type === 'income' ? (o.owner === 'company' ? 'От компании' : 'Личный доход') : TYPE[o.type]);
const opSign = o => o.type === 'income' ? 1 : o.type === 'transfer' || o.type === 'exchange' ? 0 : -1;
const describe = o => `${dmy(o.date)} · ${TYPE[o.type]} · ${o.type === 'exchange' ? exText(o) + ' (' + rateText(o.toAmount / o.amount, oc(o), o.toCur) + ')' : nf.format(o.amount) + ' ' + oc(o)} · ${OWN[o.owner]} · ${accText(o)}${o.category ? ' · ' + o.category : ''}${o.note ? ' · ' + o.note : ''}${o.receipt ? ' · чек' : ''}`;
const DEV = () => { try { return localStorage.getItem('vj-device') || ''; } catch (e) { return ''; } };
const log = t => { S.log.push({ at: new Date().toISOString(), t, by: DEV() }); };
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
    else if (/^сня/.test(l)) r.type = 'transfer';
    else if (/^(обмен|поменя|купила?\s*вал)/.test(l)) r.type = 'exchange';
    else if (/^верну/.test(l)) r.type = 'return';
    else if (/^(\$|дол|бакс|usd)/.test(l) && curs().includes('$')) r.cur = '$';
    else if (/^(€|евро|eur)/.test(l) && curs().includes('€')) r.cur = '€';
    else if (!/^(от|на|в|за)$/.test(l)) rest.push(w);
  }
  r.note = rest.join(' ');
  const n = r.note.toLowerCase(), c = r.owner === 'company';
  const G = [[/такси|метро|бензин|парков|трансфер/, c ? 'Такси и транспорт' : 'Транспорт'], [/билет|авиа|жд|перел/, 'Билеты'], [/отел|гостин/, 'Отель'], [/кафе|ресторан|обед|ужин|кофе/, c ? 'Представительские' : 'Кафе'], [/продукт|магазин|супермаркет/, 'Продукты'], [/подар|цвет/, 'Подарки'], [/курьер|достав/, 'Курьер и доставка'], [/канц|бумаг|офис/, 'Офис и канцелярия'], [/аптек|врач/, 'Здоровье']];
  for (const [re, cat] of G) if (re.test(n) && (c ? CAT_C : CAT_P).includes(cat)) { r.category = cat; break; }
  return r;
}

/* ================= tasks model ================= */
const TCAT = ['Поездки', 'Встречи', 'Документы', 'Звонки', 'Покупки', 'Личное'];
function parseTask(text) {
  const r = { important: false }; let t = ' ' + text + ' ';
  if (/!/.test(t)) { r.important = true; t = t.replace(/!+/g, ' '); }
  const tm = t.match(/\s(?:в\s)?(\d{1,2}):(\d{2})(?=\s)/i); if (tm) { r.time = tm[1].padStart(2, '0') + ':' + tm[2]; t = t.replace(tm[0], ' '); }
  const T = today(); let m;
  if ((m = t.match(/\s(сегодня)(?=\s)/i))) r.due = T;
  else if ((m = t.match(/\s(послезавтра)(?=\s)/i))) r.due = addDays(T, 2);
  else if ((m = t.match(/\s(завтра)(?=\s)/i))) r.due = addDays(T, 1);
  else if ((m = t.match(/\s(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?(?=\s)/))) { let y = m[3] ? +m[3] : new Date().getFullYear(); if (y < 100) y += 2000; r.due = y + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); }
  else if ((m = t.match(/\s(?:в\s|во\s)?(понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресенье)(?=\s)/i))) {
    const k = ['воскрес', 'понед', 'вторн', 'сред', 'четв', 'пятн', 'суббот'].findIndex(p => m[1].toLowerCase().startsWith(p));
    r.due = addDays(T, (k - new Date().getDay() + 7) % 7);
  }
  if (m) t = t.replace(m[0], ' ');
  const title = t.replace(/^\s*(задача|напомни(ть)?)[:\s]+/i, '').replace(/\s+/g, ' ').trim();
  r.title = title.charAt(0).toUpperCase() + title.slice(1);
  const l = title.toLowerCase();
  r.cat = /позвон|звон|созвон/.test(l) ? 'Звонки' : /билет|рейс|отел|трансфер|виз|поездк/.test(l) ? 'Поездки' : /встреч|переговор|ужин|обед|ресторан/.test(l) ? 'Встречи' : /договор|документ|презентац|отч[её]т|письм|счёт|счет/.test(l) ? 'Документы' : /купи|заказ/.test(l) ? 'Покупки' : '';
  return r;
}
const isUrgent = x => x.due && x.due <= addDays(today(), 1);
const byDue = (a, b) => (a.due || '9').localeCompare(b.due || '9') || (a.time || '99').localeCompare(b.time || '99');

/* ================= io ================= */
function compress(file) {
  return new Promise(res => { const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1100 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.6)); }; img.onerror = () => res(null); img.src = fr.result; }; fr.onerror = () => res(null); fr.readAsDataURL(file); });
}
async function saveFile(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  try { const f = new File([blob], name, { type: mime }); if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [f] }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function makeIcs(title, date, opt = {}) {
  const st = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', d = date.replace(/-/g, ''), clean = s => s.replace(/[,;\\]/g, ' ');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VJ//RU', 'BEGIN:VEVENT', 'UID:' + uid() + '@vj', 'DTSTAMP:' + st, opt.time ? 'DTSTART:' + d + 'T' + opt.time.replace(':', '') + '00' : 'DTSTART;VALUE=DATE:' + d];
  if (opt.time) L.push('DURATION:PT30M'); if (opt.rrule) L.push('RRULE:' + opt.rrule);
  L.push('SUMMARY:' + clean(title), 'BEGIN:VALARM', 'TRIGGER:' + (opt.time ? '-PT15M' : 'PT9H'), 'ACTION:DISPLAY', 'DESCRIPTION:' + clean(title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
  return saveFile('napominanie.ics', L.join('\r\n'), 'text/calendar');
}

/* ================= charts ================= */
const PAL = ['#0B8062', '#C27C12', '#3F6FC2', '#C2453A', '#7A5BB8', '#7E8F1F'], OTHER = '#A39D8F';
function catItems(ops, list) {
  const m = {}; ops.forEach(o => { let i = list.indexOf(o.category); if (i < 0 || i > 5) i = 6; m[i] = (m[i] || 0) + o.amount; });
  return Object.keys(m).map(Number).sort((a, b) => a - b).map(i => ({ k: i < 6 ? list[i] : 'Прочее', v: m[i], c: i < 6 ? PAL[i] : OTHER }));
}
function donut(items, { size = 132, w = 16, center = '', sub = '' } = {}) {
  const r = (size - w) / 2, C = 2 * Math.PI * r, tot = items.reduce((s, i) => s + i.v, 0), h = size / 2, gap = items.length > 1 ? 2 : 0; let off = 0;
  const segs = tot ? items.map(i => { const len = Math.max(0.5, i.v / tot * C - gap); const s = `<circle r="${r}" cx="${h}" cy="${h}" fill="none" stroke="${i.c}" stroke-width="${w}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${h} ${h})"><title>${esc(i.k)}: ${Math.round(i.v / tot * 100)}%</title></circle>`; off += i.v / tot * C; return s; }).join('') : '';
  return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"><circle r="${r}" cx="${h}" cy="${h}" fill="none" stroke="var(--track)" stroke-width="${w}"/>${segs}<text x="${h}" y="${h - 2}" text-anchor="middle" class="d-c">${esc(center)}</text><text x="${h}" y="${h + 15}" text-anchor="middle" class="d-s">${esc(sub)}</text></svg>`;
}
function legend(items, f = v => fmtK(v)) {
  const tot = items.reduce((s, i) => s + i.v, 0) || 1;
  return `<div class="legend">${[...items].sort((a, b) => b.v - a.v).map(i => `<div class="lg"><i style="background:${i.c}"></i><span>${esc(i.k)}</span><b>${f(i.v)}</b><small>${Math.round(i.v / tot * 100)}%</small></div>`).join('')}</div>`;
}
function ring(p, { size = 64, w = 6, label = '', color = 'var(--em)' } = {}) {
  const r = (size - w) / 2, C = 2 * Math.PI * r, h = size / 2, len = Math.max(0, Math.min(1, p)) * C;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle r="${r}" cx="${h}" cy="${h}" fill="none" stroke="var(--track)" stroke-width="${w}"/><circle r="${r}" cx="${h}" cy="${h}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${len} ${C}" transform="rotate(-90 ${h} ${h})"/><text x="${h}" y="${h + 5}" text-anchor="middle" class="r-t">${esc(label)}</text></svg>`;
}

/* ================= slides ================= */
const THEMES = { emerald: 'Изумруд', ivory: 'Слоновая кость', noir: 'Ночь' };
const LAYOUTS = { title: 'Титул', section: 'Раздел', bullets: 'Пункты', text: 'Текст', stats: 'Цифры', two: 'Две колонки', timeline: 'Таймлайн', quote: 'Цитата', end: 'Финал' };
const HINT = { title: 'Подзаголовок станет надписью над названием', section: 'Подзаголовок: короткое пояснение к разделу', bullets: 'Каждый пункт с новой строки, лучше 3–5 пунктов', text: 'Один-два абзаца', stats: 'До 4 строк в виде «цифра — подпись», например «+18% — рост выручки»', two: 'Левая колонка, затем строка ---, затем правая. Первая строка колонки станет её заголовком', timeline: 'Строки в виде «когда — что», например «10:00 — Открытие»', quote: 'Текст цитаты. Подзаголовок: автор', end: 'Текст: контакты или призыв к действию' };
const pair = x => { const m = x.match(/^(.+?)\s+[—–-]\s+(.+)$/) || x.match(/^([^:]{1,24}):\s*(.+)$/); return m ? [m[1], m[2]] : ['', x]; };
function slideHTML(s, d, i) {
  const t = esc(s.title || ''), sub = esc(s.sub || ''), ls = lines(s.body), n = d.slides.length; let inner = '';
  switch (s.layout) {
    case 'title': inner = `${sub ? `<div class="s-kicker">${sub}</div>` : ''}<div class="s-h1">${t}</div><div class="s-rule"></div><div class="s-meta">${esc(d.author || S.profile.name)}${d.date ? ' · ' + dm(d.date) + ' ' + d.date.slice(0, 4) : ''}</div>`; break;
    case 'section': inner = `<div class="s-num">${String(d.slides.slice(0, i + 1).filter(x => x.layout === 'section').length).padStart(2, '0')}</div><div class="s-h1">${t}</div>${sub ? `<div class="s-sub">${sub}</div>` : ''}`; break;
    case 'bullets': inner = `<div class="s-h2">${t}</div><ul class="s-list">${ls.slice(0, 7).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; break;
    case 'text': inner = `<div class="s-h2">${t}</div><p class="s-p">${esc(s.body || '')}</p>`; break;
    case 'stats': { const it = ls.slice(0, 4).map(pair); inner = `<div class="s-h2">${t}</div><div class="s-stats" style="--n:${Math.max(1, it.length)}">${it.map(([a, b]) => `<div><b>${esc(a || b)}</b><span>${a ? esc(b) : ''}</span></div>`).join('')}</div>`; break; }
    case 'two': { const cols = String(s.body || '').split(/^\s*-{3,}\s*$/m).slice(0, 2).map(lines); inner = `<div class="s-h2">${t}</div><div class="s-two">${cols.map(c => `<div><h4>${esc(c[0] || '')}</h4>${c.slice(1).map(x => `<p>${esc(x)}</p>`).join('')}</div>`).join('')}</div>`; break; }
    case 'timeline': inner = `<div class="s-h2">${t}</div><ol class="s-tl">${ls.slice(0, 6).map(pair).map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ol>`; break;
    case 'quote': inner = `<div class="s-q">«${esc(s.body || '')}»</div>${sub ? `<div class="s-rule"></div><div class="s-meta">${sub}</div>` : ''}`; break;
    case 'end': inner = `<div class="s-h1">${t}</div><div class="s-rule"></div>${sub ? `<div class="s-sub">${sub}</div>` : ''}${s.body ? `<p class="s-p" style="margin-top:2cqw">${esc(s.body)}</p>` : ''}`; break;
  }
  return `<div class="slide th-${d.theme} l-${s.layout}"><div class="s-in">${inner}</div><div class="s-foot"><span>${esc(d.title)}</span><span>${i + 1} / ${n}</span></div><div class="s-mono">VJ</div></div>`;
}
const SL = (layout, title, sub, body) => ({ id: uid(), layout, title, sub: sub || '', body: body || '' });
const DECKS = {
  pitch: { name: 'Предложение', desc: 'Питч для клиента или партнёра', theme: 'emerald', make: () => [
    SL('title', 'Название проекта', 'Коммерческое предложение'),
    SL('text', 'Задача', '', 'В двух-трёх предложениях: какую проблему клиента мы решаем и почему это важно именно сейчас.'),
    SL('bullets', 'Наше решение', '', 'Что именно мы предлагаем\nКак это меняет результат для клиента\nЧем мы отличаемся от альтернатив\nЧто клиент получает уже в первый месяц'),
    SL('timeline', 'Как мы работаем', '', 'Шаг 1 — Знакомство и аудит\nШаг 2 — План и согласование\nШаг 3 — Запуск\nШаг 4 — Результат и отчёт'),
    SL('stats', 'Цифры', '', '3× — рост ключевого показателя\n24 ч — время запуска\n98% — довольных клиентов'),
    SL('two', 'Условия', '', 'Стандарт\nОсновной объём работ\nСрок: 2 недели\n---\nПремиум\nРасширенный объём\nПерсональный менеджер'),
    SL('end', 'Следующий шаг', 'Согласуем встречу на этой неделе', 'Имя · телефон · почта')] },
  report: { name: 'Отчёт', desc: 'Итоги месяца, квартала, проекта', theme: 'ivory', make: () => [
    SL('title', 'Итоги периода', 'Отчёт о результатах'),
    SL('stats', 'Главное в цифрах', '', '+18% — выручка к прошлому периоду\n42 — новых клиента\n4,9 — средняя оценка'),
    SL('bullets', 'Что сделано', '', 'Запустили …\nЗакрыли сделку с …\nОптимизировали …'),
    SL('two', 'План и факт', '', 'План\nПоказатель A: 100\nПоказатель B: 50\n---\nФакт\nПоказатель A: 112\nПоказатель B: 46'),
    SL('quote', 'Вывод', 'Главный вывод периода', '', ),
    SL('timeline', 'Планы', '', 'Декабрь — …\nЯнварь — …\nФевраль — …'),
    SL('end', 'Спасибо', 'Вопросы и обсуждение')] },
  event: { name: 'Мероприятие', desc: 'Программа, тайминг, логистика', theme: 'noir', make: () => [
    SL('title', 'Название мероприятия', 'Программа'),
    SL('text', 'Цель', '', 'Зачем мы собираемся и какой результат хотим получить по итогам дня.'),
    SL('timeline', 'Программа дня', '', '10:00 — Сбор гостей и кофе\n10:30 — Открытие\n12:00 — Основная сессия\n14:00 — Обед\n16:00 — Итоги и нетворкинг'),
    SL('bullets', 'Участники', '', 'Имя Фамилия — роль\nИмя Фамилия — роль\nИмя Фамилия — роль'),
    SL('two', 'Логистика', '', 'Место\nАдрес\nПарковка и трансфер\n---\nКонтакты\nОрганизатор\nТелефон'),
    SL('end', 'До встречи', 'Дата · место')] },
  brief: { name: 'Бриф встречи', desc: 'Подготовка руководителя к встрече', theme: 'ivory', make: () => [
    SL('title', 'Встреча с [компания]', 'Бриф для руководителя'),
    SL('two', 'Кто будет', '', 'С нашей стороны\nИмя — роль\n---\nСо стороны партнёра\nИмя — роль\nИмя — роль'),
    SL('text', 'Цель встречи', '', 'Какое решение или договорённость нужно получить.'),
    SL('timeline', 'Повестка', '', '5 мин — Знакомство\n15 мин — Обсуждение условий\n10 мин — Вопросы\n5 мин — Следующие шаги'),
    SL('bullets', 'Важно помнить', '', 'Ключевой интерес партнёра\nЧувствительные темы\nНаши границы по условиям'),
    SL('end', 'Ожидаемый результат', 'Подписание / договорённость о пилоте')] },
  blank: { name: 'С чистого листа', desc: 'Титул и финал', theme: 'emerald', make: () => [SL('title', 'Название', 'Подзаголовок'), SL('end', 'Спасибо', 'Контакты')] }
};
DECKS.report.make = (f => () => { const s = f(); s[4].body = 'Главный вывод периода одной фразой.'; return s; })(DECKS.report.make);
function newDeck(kind) { const k = DECKS[kind]; const d = { id: uid(), title: k.make()[0].title, theme: k.theme, author: S.profile.name, date: today(), slides: k.make(), at: new Date().toISOString() }; S.decks.unshift(d); save(); return d; }
function deckFromTrip(x) {
  const ln = lines(x.notes), done = x.check.filter(c => c.done).map(c => c.t), todo = x.check.filter(c => !c.done).map(c => c.t);
  const days = x.from && x.to ? Math.round((new Date(x.to) - new Date(x.from)) / 864e5) + 1 : 1;
  const d = { id: uid(), title: x.title, theme: 'ivory', author: S.profile.name, date: x.from || today(), at: new Date().toISOString(), slides: [
    SL('title', x.title, x.place ? 'Маршрут · ' + x.place : 'Маршрут поездки'),
    SL('stats', 'Коротко', '', `${days} — ${plural(days, 'день', 'дня', 'дней')} в поездке\n${x.from ? dm(x.from) : '—'} — начало\n${x.to ? dm(x.to) : '—'} — возвращение`),
    SL('timeline', 'Программа', '', ln.length ? ln.join('\n') : 'Дата — Вылет, рейс, терминал\nДата — Встреча с …\nДата — Обратный рейс'),
    SL('two', 'Подготовка', '', 'Готово\n' + (done.join('\n') || '—') + '\n---\nВ работе\n' + (todo.join('\n') || 'Всё готово')),
    SL('end', 'Хорошей поездки', S.profile.name + ' · на связи 24/7')] };
  S.decks.unshift(d); save(); return d;
}

/* ================= shared view parts ================= */
function opRow(o) {
  if (o.type === 'exchange') return `<button class="item" data-a="editOp" data-id="${o.id}"><span class="dot c">${ic('swap')}</span><span class="mid"><div class="t">${esc(opTitle(o))}</div><div class="s">${OWN[o.owner]} · ${rateText(o.toAmount / o.amount, oc(o), o.toCur)}</div></span><span class="a ex"><b>+${fmt(o.toAmount, o.toCur)}</b><small>−${fmt(o.amount, oc(o))}</small></span></button>`;
  const s = opSign(o), c = o.owner === 'company', ico = o.type === 'income' ? 'in' : o.type === 'transfer' ? 'swap' : o.type === 'return' ? 'out' : c ? 'bag' : 'wallet';
  return `<button class="item" data-a="editOp" data-id="${o.id}"><span class="dot ${c ? 'c' : ''}">${ic(ico)}</span><span class="mid"><div class="t">${esc(opTitle(o))}</div><div class="s">${OWN[o.owner]} · ${accText(o)}${o.receipt ? ' · чек' : ''}</div></span><span class="a ${s > 0 ? 'plus' : ''}">${s > 0 ? '+' : s < 0 ? '−' : ''}${fmt(o.amount, oc(o))}</span></button>`;
}
function taskRow(x) {
  const t = today(), over = !x.done && x.due && x.due < t;
  const meta = [x.due ? (over ? `<em class="red">${dayLabel(x.due)}</em>` : dayLabel(x.due)) : '', x.time || '', x.cat ? `<i class="cdot" style="background:${PAL[TCAT.indexOf(x.cat)] || OTHER}"></i>${esc(x.cat)}` : ''].filter(Boolean).join(' · ');
  return `<div class="item task ${x.done ? 'done' : ''}"><button class="check ${x.done ? 'on' : ''}" data-a="toggleTask" data-id="${x.id}" aria-label="Готово">${x.done ? ic('ok') : ''}</button><button class="mid" data-a="editTask" data-id="${x.id}"><div class="t">${x.important ? `<span class="flag">${ic('flag')}</span>` : ''}${esc(x.title)}</div>${meta ? `<div class="s">${meta}</div>` : ''}</button></div>`;
}
function nudges() {
  const n = [], t = today(), last = S.recon[S.recon.length - 1];
  if (S.ops.length && (!last || (Date.now() - new Date(last.date + 'T12:00')) / 864e5 > 7)) n.push(['swap', 'Сверка', last ? 'больше недели назад' : 'сверьте остаток с банком', 'recon']);
  const pm = shiftMonth(t.slice(0, 7), -1);
  if (!S.closed[pm] && S.ops.some(o => o.date.slice(0, 7) === pm)) n.push(['archive', 'Закрыть месяц', monthName(pm), 'archive']);
  const nr = S.ops.filter(o => o.type === 'expense' && o.owner === 'company' && !o.receipt && !S.closed[o.date.slice(0, 7)]).length;
  if (nr) n.push(['bag', 'Без чека', nr + ' ' + plural(nr, 'расход', 'расхода', 'расходов') + ' компании', 'noReceipt']);
  if (!window.FIREBASE_CONFIG && S.ops.length && (!S.lastBackup || (Date.now() - S.lastBackup) / 864e5 > 14)) n.push(['copy', 'Копия', S.lastBackup ? 'старше двух недель' : 'сохраните данные', 'backup']);
  return n;
}
const monthSwitch = () => `<div class="mswitch"><button data-a="month" data-k="-1" aria-label="Назад">${ic('back')}</button><b>${monthName(ui.month)}</b>${S.closed[ui.month] ? '<span class="tag em">закрыт</span>' : ''}<button data-a="month" data-k="1" aria-label="Вперёд">${ic('go')}</button></div>`;
const segm = (key, opts) => `<div class="seg">${opts.map(([k, t]) => `<button class="${ui[key] === k ? 'on' : ''}" data-a="seg" data-key="${key}" data-k="${k}">${t}</button>`).join('')}</div>`;
const head = (title, sub) => `<header class="head"><div><h1 class="title">${title}</h1>${sub ? `<p class="lead">${sub}</p>` : ''}</div><button class="mono" data-a="settings" aria-label="Настройки">VJ</button></header>`;

function ratesCard() {
  const base = S.profile.currency, other = curs().slice(1).filter(c => code(c) && code(base));
  if (!other.length) return '';
  const cells = other.map(c => { const r = rateOf(c, base), cb = rateOf(c, base, 'cb'); return `<div><small>${esc(c)}</small><b>${r ? nf.format(+r.toFixed(r < 10 ? 3 : 2)) : '—'}</b>${cb && code(base) === 'RUB' ? `<em>ЦБ ${nf.format(+cb.toFixed(cb < 10 ? 3 : 2))}</em>` : ''}</div>`; }).join('');
  return `<button class="rates" data-a="exchange"><div class="rates-h"><span>Курс к ${esc(base)}</span><span>${S.rates && S.rates.at ? 'обновлено ' + new Date(S.rates.mkAt || S.rates.at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'загружается…'} · обменять ${ic('go')}</span></div><div class="rates-v">${cells}</div></button>`;
}
/* ================= views ================= */
const V = {};
V.home = () => {
  const b = balances(), t = today(), m = t.slice(0, 7), h = new Date().getHours(), hi = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const mo = S.ops.filter(o => o.date.slice(0, 7) === m && oc(o) === S.profile.currency);
  const cIn = total(mo, o => o.type === 'income' && o.owner === 'company'), cOut = total(mo, o => o.type === 'expense' && o.owner === 'company'), pOut = total(mo, o => o.type === 'expense' && o.owner === 'personal');
  const agenda = S.tasks.filter(x => !x.done && x.due && x.due <= t).sort(byDue), doneT = S.tasks.filter(x => x.done && (x.doneAt || '').slice(0, 10) === t).length, all = agenda.length + doneT;
  const trip = S.trips.filter(x => (x.to || x.from || '') >= t).sort((a, c) => (a.from || '').localeCompare(c.from || ''))[0];
  const other = curs().slice(1).map(c => [c, balances(S.ops, c)]).filter(([, x]) => x.company || x.personal).map(([c, x]) => `<span>${esc(c)}: компании <b>${fmt(x.company, c)}</b> · личные <b>${fmt(x.personal, c)}</b></span>`).join('');
  const share = Math.abs(b.card.company) + Math.abs(b.cash.company), pc = share ? Math.abs(b.card.company) / share * 100 : 100;
  const bud = S.profile.budget, nd = nudges(), items = catItems(mo.filter(o => o.type === 'expense' && o.owner === 'company'), CAT_C);
  const recent = [...S.ops].sort(byDate).reverse().slice(0, 3);
  return `<header class="head"><div><p class="eyebrow">${new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1 class="title">${hi}, ${esc(S.profile.name)}</h1></div><button class="mono" data-a="settings" aria-label="Настройки">VJ</button></header>
  <section class="hero">
    <div class="hero-top"><span class="lbl">${b.company < 0 ? 'Компания должна мне' : 'Деньги компании у меня'}</span><span class="sig">VJ</span></div>
    <div class="amt">${fmt(Math.abs(b.company))}</div>
    <div class="split" title="Карта и наличные"><i style="width:${pc}%"></i></div>
    <div class="sub"><span><em class="k1"></em>Карта <b>${fmt(b.card.company)}</b></span><span><em class="k2"></em>Наличные <b>${fmt(b.cash.company)}</b></span></div>
    <div class="hero-foot"><div><small>Получено в ${MONTHS[+m.slice(5) - 1].replace(/ь$/, 'е').replace(/й$/, 'е').replace(/т$/, 'те')}</small><b>+${fmtK(cIn)}</b></div><div><small>Потрачено на компанию</small><b>−${fmtK(cOut)}</b></div></div>
    ${other ? `<div class="hero-cur">${other}</div>` : ''}
  </section>
  <div class="duo">
    <button class="stat" data-a="seg" data-key="fin" data-k="stats" data-tab="money"><div class="lbl">Мои личные</div><div class="amt">${fmtK(b.personal)}</div>
      ${bud ? `<div class="bar"><i style="width:${Math.min(100, pOut / bud * 100)}%" class="${pOut > bud ? 'over' : ''}"></i></div><div class="hint">${pOut > bud ? 'бюджет превышен на ' + fmtK(pOut - bud) : 'осталось ' + fmtK(bud - pOut) + ' из бюджета'}</div>` : `<div class="hint">потрачено за месяц ${fmtK(pOut)}</div>`}</button>
    <button class="stat row-stat" data-a="tab" data-tab="assist">${ring(all ? doneT / all : 0, { size: 58, label: all ? `${doneT}/${all}` : '—' })}<div><div class="lbl">Сегодня</div><div class="hint">${agenda.length ? agenda.length + ' ' + plural(agenda.length, 'задача', 'задачи', 'задач') + ' в работе' : all ? 'всё сделано' : 'задач нет'}</div></div></button>
  </div>
  ${ratesCard()}
  ${nd.length ? `<div class="attn">${nd.map(([i, t1, t2, a]) => `<button class="att" data-a="${a}"><i>${ic(i)}</i><b>${t1}</b><span>${t2}</span></button>`).join('')}</div>` : ''}
  ${agenda.length || trip ? `<div class="sec"><h2>На сегодня</h2><button data-a="tab" data-tab="assist">Все дела</button></div>
    ${trip ? `<button class="trip-mini" data-a="trip" data-id="${trip.id}"><span class="dot c">${ic('plane')}</span><span class="mid"><div class="t">${esc(trip.title)}</div><div class="s">${trip.from ? dayLabel(trip.from) : ''}${trip.place ? ' · ' + esc(trip.place) : ''}</div></span>${ring(trip.check.length ? trip.check.filter(c => c.done).length / trip.check.length : 0, { size: 40, w: 4, label: '' })}</button>` : ''}
    ${agenda.length ? `<div class="list">${agenda.slice(0, 4).map(taskRow).join('')}</div>` : ''}` : ''}
  ${items.length ? `<div class="sec"><h2>Расходы компании · ${MONTHS[+m.slice(5) - 1]}</h2><button data-a="seg" data-key="fin" data-k="stats" data-tab="money">Аналитика</button></div>
    <div class="card chart-card">${donut(items, { size: 120, w: 14, center: fmtK(cOut).replace(' ' + S.profile.currency, ''), sub: S.profile.currency })}${legend(items.slice(0), fmtK)}</div>` : ''}
  ${recent.length ? `<div class="sec"><h2>Последние операции</h2><button data-a="tab" data-tab="money">Все</button></div><div class="list">${recent.map(opRow).join('')}</div>` :
    `<div class="card welcome-card"><h3>С чего начать</h3><p>Нажмите <b>+</b> внизу экрана. Там всё: расход, поступление от компании, задача, поездка или презентация. Можно просто написать строкой: «такси 3500 компания».</p></div>`}`;
};

V.money = () => {
  const top = head('Деньги', 'Компания и личные · карта и наличные') + segm('fin', [['ops', 'Операции'], ['stats', 'Аналитика'], ['archive', 'Архив']]);
  if (ui.fin === 'stats') return top + statsView();
  if (ui.fin === 'archive') return top + archiveView();
  const q = ui.q.trim().toLowerCase();
  const ops = S.ops.filter(o => o.date.slice(0, 7) === ui.month && (ui.filter === 'all' || (ui.filter === 'noreceipt' ? (o.type === 'expense' && o.owner === 'company' && !o.receipt) : o.owner === ui.filter)) && (!q || (opTitle(o) + ' ' + (o.category || '') + ' ' + o.amount).toLowerCase().includes(q))).sort(byDate).reverse();
  let html = '', day = '';
  const dayOut = d => total(ops.filter(o => o.date === d && oc(o) === S.profile.currency), o => o.type === 'expense' || o.type === 'return');
  for (const o of ops) { if (o.date !== day) { if (day) html += '</div>'; day = o.date; const out = dayOut(day); html += `<div class="day"><span>${dayLabel(day)}</span>${out ? `<span>−${fmt(out)}</span>` : ''}</div><div class="list">`; } html += opRow(o); }
  if (day) html += '</div>';
  const F2 = [['all', 'Все'], ['company', 'Компания'], ['personal', 'Личные'], ['noreceipt', 'Без чека']];
  return top + monthSwitch() + `<label class="search">${ic('search')}<input type="search" data-c="q" value="${esc(ui.q)}" placeholder="Поиск по операциям"></label>
  <div class="chips">${F2.map(([k, t]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-a="filter" data-f="${k}">${t}</button>`).join('')}</div>
  <div id="opsList">${html || '<div class="empty"><b>Нет операций</b>За этот месяц с таким фильтром ничего нет.</div>'}</div>`;
};
function statsView() {
  const m = ui.month, cur = S.profile.currency, mo = S.ops.filter(o => o.date.slice(0, 7) === m && oc(o) === cur);
  const cIn = total(mo, o => o.type === 'income' && o.owner === 'company'), cExp = mo.filter(o => o.type === 'expense' && o.owner === 'company'), pExp = mo.filter(o => o.type === 'expense' && o.owner === 'personal');
  const cOut = total(cExp, () => true), pOut = total(pExp, () => true), bud = S.profile.budget;
  const ci = catItems(cExp, CAT_C), pi = catItems(pExp, CAT_P);
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(m, i - 5)), vals = months.map(x => total(S.ops.filter(o => o.date.slice(0, 7) === x && oc(o) === cur), o => o.type === 'expense' && o.owner === 'company')), mx = Math.max(...vals, 1);
  return monthSwitch() + `<div class="tri"><div><small>От компании</small><b>+${fmtK(cIn)}</b></div><div><small>Расходы компании</small><b>${fmtK(cOut)}</b></div><div><small>Личные расходы</small><b>${fmtK(pOut)}</b></div></div>
  <div class="sec"><h2>Расходы компании по статьям</h2></div>
  ${ci.length ? `<div class="card chart-card">${donut(ci, { center: fmtK(cOut).replace(' ' + cur, ''), sub: cur })}${legend(ci)}</div>` : '<div class="card empty">Расходов компании в этом месяце нет</div>'}
  <div class="sec"><h2>Расходы компании за полгода</h2></div>
  <div class="card"><div class="bars">${months.map((x, i) => `<div class="bcol ${x === m ? 'cur' : ''}" title="${monthName(x)}: ${fmt(vals[i])}"><span class="bv">${x === m && vals[i] ? fmtK(vals[i]).replace(' ' + cur, '') : ''}</span><i style="height:${Math.max(vals[i] ? 3 : 0, vals[i] / mx * 100)}%"></i><small>${MON_S[+x.slice(5) - 1]}</small></div>`).join('')}</div></div>
  <div class="sec"><h2>Личные расходы</h2><button data-a="budget">${bud ? 'Бюджет ' + fmtK(bud) : 'Задать бюджет'}</button></div>
  ${bud ? `<div class="card"><div class="kv"><span>Потрачено из бюджета</span><b>${fmtK(pOut)} / ${fmtK(bud)}</b></div><div class="bar big"><i style="width:${Math.min(100, pOut / bud * 100)}%" class="${pOut > bud ? 'over' : ''}"></i></div></div>` : ''}
  ${pi.length ? `<div class="card chart-card" style="margin-top:10px">${donut(pi, { center: fmtK(pOut).replace(' ' + cur, ''), sub: cur })}${legend(pi)}</div>` : '<div class="card empty" style="margin-top:10px">Личных расходов в этом месяце нет</div>'}
  <p class="note">Аналитика считается в основной валюте (${esc(cur)}).</p>`;
}
function archiveView() {
  const ms = [...new Set(S.ops.map(o => o.date.slice(0, 7)))].sort().reverse(), cur = today().slice(0, 7), last = S.recon[S.recon.length - 1];
  return `<div class="card recon-card"><div><h3>Сверка с банком</h3><p>${last ? 'Последняя ' + dmy(last.date) + (last.dCard || last.dCash ? ' · было расхождение' : ' · сошлось') : 'Сравните учёт с реальным остатком'}</p></div><button class="btn sm" data-a="recon">Сверить</button></div>
  <div class="sec"><h2>Месяцы и отчёты</h2></div>
  ${ms.length ? `<div class="list">${ms.map(m => `<div class="item"><span class="dot ${S.closed[m] ? '' : 'c'}">${ic(S.closed[m] ? 'lock' : 'cal')}</span><span class="mid"><div class="t cap">${monthName(m)}</div><div class="s">${S.closed[m] ? 'закрыт ' + dmy(S.closed[m].at.slice(0, 10)) : 'открыт'}</div></span><button class="btn ghost sm" data-a="report" data-m="${m}">Отчёт</button>${!S.closed[m] && m < cur ? `<button class="btn sm" data-a="closeMonth" data-m="${m}">Закрыть</button>` : ''}</div>`).join('')}</div>` : '<div class="card empty">Отчёты появятся после первых операций</div>'}
  <p class="note">Закрытый месяц нельзя изменить: в отчёте фиксируется контрольный код. Любые правки и удаления пишутся в журнал.</p>
  <div class="row" style="margin-top:12px"><button class="btn ghost" data-a="showLog">Журнал изменений</button><button class="btn ghost" data-a="backup">Резервная копия</button></div>`;
}

V.assist = () => {
  const t = today(), open = S.tasks.filter(x => !x.done), over = open.filter(x => x.due && x.due < t).length, tod = open.filter(x => x.due === t).length, imp = open.filter(x => x.important).length;
  const ws = weekStart(), we = addDays(ws, 6), wk = S.tasks.filter(x => x.due && x.due >= ws && x.due <= we), wd = wk.filter(x => x.done).length;
  const top = head('Помощник', 'Задачи, поездки и всё, что нельзя забыть') +
    `<div class="card pulse">${ring(wk.length ? wd / wk.length : 0, { size: 76, w: 7, label: wk.length ? Math.round(wd / wk.length * 100) + '%' : '—' })}<div class="pulse-r"><div class="lbl">Неделя</div><div class="pulse-n"><div><b>${tod}</b><small>сегодня</small></div><div class="${over ? 'red' : ''}"><b>${over}</b><small>просрочено</small></div><div><b>${imp}</b><small>важных</small></div></div></div></div>
    <form class="quick" data-form="taskQuick"><input type="text" name="q" placeholder="Завтра 15:00 позвонить в отель !" autocomplete="off"><button class="icon-btn" aria-label="Добавить">${ic('plus')}</button></form>
    <p class="hint">Дата и время распознаются сами: «завтра», «пятница», «20.12», «15:00». Знак «!» — важно.</p>` +
    segm('as', [['list', 'Список'], ['matrix', 'Матрица'], ['week', 'Неделя'], ['trips', 'Поездки']]);
  if (ui.as === 'matrix') return top + matrixView();
  if (ui.as === 'week') return top + weekView();
  if (ui.as === 'trips') return top + tripsView();
  const tm = addDays(t, 1), w7 = addDays(t, 7), G = [['Просрочено', x => x.due && x.due < t], ['Сегодня', x => x.due === t], ['Завтра', x => x.due === tm], ['На неделе', x => x.due > tm && x.due <= w7], ['Позже', x => x.due > w7], ['Без срока', x => !x.due]];
  const sorted = open.sort(byDue), done = S.tasks.filter(x => x.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 6);
  return top + (sorted.length ? G.map(([n, f]) => { const xs = sorted.filter(f); return xs.length ? `<div class="sec"><h2>${n} · ${xs.length}</h2></div><div class="list">${xs.map(taskRow).join('')}</div>` : ''; }).join('') : '<div class="card empty"><b>Всё сделано</b>Добавьте задачу строкой выше или кнопкой «+».</div>') +
    (done.length ? `<div class="sec"><h2>Недавно выполнено</h2></div><div class="list">${done.map(taskRow).join('')}</div>` : '');
};
function matrixView() {
  const open = S.tasks.filter(x => !x.done).sort(byDue);
  const Q = [['Сделать сейчас', 'важно и срочно', x => x.important && isUrgent(x), 'q1'], ['Запланировать', 'важно, не срочно', x => x.important && !isUrgent(x), 'q2'], ['Быстро закрыть', 'срочно, не важно', x => !x.important && isUrgent(x), 'q3'], ['Когда будет время', 'не срочно и не важно', x => !x.important && !isUrgent(x), 'q4']];
  return `<div class="matrix"><span class="ax ax-y">важность ↑</span><span class="ax ax-x">срочность →</span>${[Q[1], Q[0], Q[3], Q[2]].map(([n, s, f, c]) => { const xs = open.filter(f); return `<div class="mq ${c}"><div class="mq-h"><b>${n}</b><span>${xs.length}</span></div><small>${s}</small>${xs.slice(0, 4).map(x => `<button class="mq-t" data-a="editTask" data-id="${x.id}">${esc(x.title)}</button>`).join('')}${xs.length > 4 ? `<small>и ещё ${xs.length - 4}</small>` : ''}</div>`; }).join('')}</div>
  <p class="note">Срочно — срок сегодня, завтра или уже прошёл. Важно — задачи со знаком «!».</p>`;
}
function weekView() {
  const ws = weekStart(), days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)), t = today();
  const data = days.map(d => { const xs = S.tasks.filter(x => x.due === d); return { d, open: xs.filter(x => !x.done).length, done: xs.filter(x => x.done).length }; });
  const mx = Math.max(1, ...data.map(x => x.open + x.done)), sel = ui.day && days.includes(ui.day) ? ui.day : t >= ws && t <= days[6] ? t : ws;
  const xs = S.tasks.filter(x => x.due === sel).sort(byDue), open = S.tasks.filter(x => !x.done);
  const ci = TCAT.map((c, i) => ({ k: c, v: open.filter(x => x.cat === c).length, c: PAL[i] })).filter(x => x.v); const none = open.filter(x => !TCAT.includes(x.cat)).length; if (none) ci.push({ k: 'Без типа', v: none, c: OTHER });
  return `<div class="card"><div class="lg-row"><span><i style="background:var(--em)"></i>В работе</span><span><i style="background:var(--gold)"></i>Готово</span></div>
    <div class="bars week">${data.map((x, i) => `<button class="bcol ${x.d === sel ? 'cur' : ''} ${x.d === t ? 'today' : ''}" data-a="pickDay" data-d="${x.d}" title="${dayLabel(x.d)}: в работе ${x.open}, готово ${x.done}"><span class="bv">${x.open + x.done || ''}</span><span class="stack" style="height:${(x.open + x.done) / mx * 100}%"><i class="o" style="flex:${x.open}"></i><i class="g" style="flex:${x.done}"></i></span><small>${WD[i]}</small></button>`).join('')}</div></div>
  <div class="sec"><h2>${dayLabel(sel)}</h2><button data-a="editTask" data-due="${sel}">Добавить</button></div>
  ${xs.length ? `<div class="list">${xs.map(taskRow).join('')}</div>` : '<div class="card empty">На этот день задач нет</div>'}
  ${ci.length ? `<div class="sec"><h2>Нагрузка по типам</h2></div><div class="card chart-card">${donut(ci, { center: String(open.length), sub: plural(open.length, 'задача', 'задачи', 'задач') })}${legend(ci, v => String(v))}</div>` : ''}`;
}
function tripsView() {
  const tr = [...S.trips].sort((a, b) => (b.from || '').localeCompare(a.from || ''));
  return `<button class="btn" style="margin-top:14px" data-a="editTrip">${ic('plus')} Новая поездка или событие</button>` + (tr.length ? tr.map(x => {
    const d = x.check.filter(c => c.done).length, tops = S.ops.filter(o => o.tripId === x.id);
    return `<button class="card trip-card" data-a="trip" data-id="${x.id}">${ring(x.check.length ? d / x.check.length : 0, { size: 54, w: 5, label: x.check.length ? Math.round(d / x.check.length * 100) + '%' : '' })}<div class="mid"><h3>${esc(x.title)}</h3><p>${esc(x.place || '')}${x.from ? (x.place ? ' · ' : '') + dm(x.from) + (x.to && x.to !== x.from ? ' – ' + dm(x.to) : '') : ''}</p>${tops.length ? `<p>расходы ${sums(tops)}</p>` : ''}</div>${ic('go')}</button>`;
  }).join('') : '<div class="card empty" style="margin-top:12px"><b>Нет поездок</b>Командировки и мероприятия с чек-листом, расходами и маршрутом для руководителя.</div>');
}

V.studio = () => {
  if (ui.deck) { const d = S.decks.find(x => x.id === ui.deck); if (d) return deckEditor(d); ui.deck = null; }
  return head('Студия', 'Презентации и документы за пару минут') +
    `<div class="sec"><h2>Новая презентация</h2></div><div class="tpl-grid">${Object.entries(DECKS).map(([k, x]) => { const sl = x.make(), d = { title: '', theme: x.theme, slides: sl, author: S.profile.name }; return `<button class="tpl" data-a="newDeck" data-k="${k}"><div class="thumb">${slideHTML(sl[0], d, 0)}</div><b>${x.name}</b><small>${x.desc} · ${sl.length} ${plural(sl.length, 'слайд', 'слайда', 'слайдов')}</small></button>`; }).join('')}</div>
  ${S.decks.length ? `<div class="sec"><h2>Мои презентации</h2></div><div class="list">${S.decks.map(d => `<button class="item" data-a="openDeck" data-id="${d.id}"><span class="mthumb">${slideHTML(d.slides[0], d, 0)}</span><span class="mid"><div class="t">${esc(d.title)}</div><div class="s">${d.slides.length} ${plural(d.slides.length, 'слайд', 'слайда', 'слайдов')} · ${THEMES[d.theme]}</div></span>${ic('go')}</button>`).join('')}</div>` : ''}
  <div class="sec"><h2>Шаблоны писем</h2><button data-a="editTpl">Новый</button></div>
  <div class="list">${S.templates.map(x => `<div class="item"><span class="dot c">${ic('mail')}</span><button class="mid" data-a="editTpl" data-id="${x.id}"><div class="t">${esc(x.title)}</div><div class="s">${esc(x.body.split('\n').find(l => l.trim()) || '')}</div></button><button class="btn ghost sm" data-a="copyTpl" data-id="${x.id}">${ic('copy')}</button></div>`).join('')}</div>`;
};
function deckEditor(d) {
  return `<div class="ed-top"><button class="back" data-a="closeDeck">${ic('back')} Студия</button><button class="btn ghost sm" data-a="deckMeta">${ic('edit')} Название</button></div>
  <h1 class="title">${esc(d.title)}</h1><p class="lead">${d.slides.length} ${plural(d.slides.length, 'слайд', 'слайда', 'слайдов')} · нажмите на слайд, чтобы изменить</p>
  <div class="chips">${Object.entries(THEMES).map(([k, n]) => `<button class="chip ${d.theme === k ? 'on' : ''}" data-a="deckTheme" data-k="${k}"><i class="sw th-${k}"></i>${n}</button>`).join('')}</div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="play">${ic('play')} Показать</button><button class="btn ghost" data-a="deckPdf">${ic('doc')} PDF</button></div>
  <div class="slides-grid">${d.slides.map((s, i) => `<button class="sthumb" data-a="editSlide" data-i="${i}"><div class="thumb">${slideHTML(s, d, i)}</div><span>${i + 1} · ${LAYOUTS[s.layout]}</span></button>`).join('')}
    <button class="sthumb add" data-a="addSlide"><div class="thumb">${ic('plus')}<span>Слайд</span></div></button></div>
  <button class="btn danger" style="margin-top:22px" data-a="delDeck">Удалить презентацию</button>`;
}

/* ================= render ================= */
function render() {
  if (!S.profile.ready) { $('#tabbar').hidden = true; $('#view').innerHTML = onboarding(); return; }
  $('#tabbar').hidden = false;
  $('#view').innerHTML = V[ui.tab]();
  const T = [['home', 'Обзор', 'home'], ['money', 'Деньги', 'wallet'], null, ['assist', 'Помощник', 'spark'], ['studio', 'Студия', 'slides']];
  $('#tabbar').innerHTML = T.map(t => t ? `<button class="${ui.tab === t[0] ? 'on' : ''}" data-a="tab" data-tab="${t[0]}">${ic(t[2])}<span>${t[1]}</span></button>` : `<button class="plus" data-a="create" aria-label="Создать">${ic('plus')}</button>`).join('');
}
function onboarding() {
  return `<div class="welcome"><div class="big">VJ</div><h1 class="title" style="margin:6px 0 0">Личный кабинет</h1><p>Деньги, дела и презентации в одном месте</p></div>
  <form data-form="start">
    <label class="f"><span>Как к вам обращаться</span><input type="text" name="name" value="Виолетта"></label>
    <div class="flabel" style="margin-top:14px">Основная валюта</div>
    <div class="seg">${['₽', '₸', '$', '€', 'AED'].map((c, i) => `<label><input type="radio" name="cur" value="${c}" ${i ? '' : 'checked'}><span>${c}</span></label>`).join('')}</div>
    <div class="sec"><h2>Сколько денег сейчас</h2></div>
    <div class="row"><label class="f" style="margin:0"><span>Карта: компании</span><input type="text" inputmode="decimal" name="cc" placeholder="0"></label><label class="f" style="margin:0"><span>Карта: личные</span><input type="text" inputmode="decimal" name="cp" placeholder="0"></label></div>
    <div class="row" style="margin-top:12px"><label class="f" style="margin:0"><span>Наличные: компании</span><input type="text" inputmode="decimal" name="nc" placeholder="0"></label><label class="f" style="margin:0"><span>Наличные: личные</span><input type="text" inputmode="decimal" name="np" placeholder="0"></label></div>
    <button class="btn gold" style="margin-top:22px">Начать</button>
    ${window.FIREBASE_CONFIG ? '<button type="button" class="btn ghost" style="margin-top:10px" data-a="cloud">У меня уже есть аккаунт</button>' : ''}
  </form>`;
}

/* ================= sheets ================= */
function sheet(html) { const b = $('#sheetBody'); b.innerHTML = `<button class="sheet-x" data-a="closeSheet" aria-label="Закрыть">${ic('close')}</button>` + html; b.style.transform = ''; $('#sheet').hidden = false; document.documentElement.classList.add('modal'); b.scrollTop = 0; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; $('#sheetBody').style.transform = ''; document.documentElement.classList.remove('modal'); if (ui.tab === 'studio' && ui.deck) render(); }
const radio = (name, opts, val) => `<div class="seg">${opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}" ${v === val ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>`;
const select = (name, opts, val) => `<select name="${name}">${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
const tile = (a, ico, t, s, data = '', cls = '') => `<button class="tile ${cls}" data-a="${a}" ${data}><i>${ic(ico)}</i><b>${t}</b>${s ? `<small>${s}</small>` : ''}</button>`;
function createSheet() {
  sheet(`<h2>Создать</h2>
  <form class="quick" data-form="smart" style="margin-top:0"><input type="text" name="q" placeholder="такси 3500 компания" autocomplete="off"><button class="icon-btn" aria-label="Распознать">${ic('go')}</button></form>
  <p class="hint">Пишите как в заметках: «такси 3500 компания», «пришло 50000», «завтра 15:00 позвонить в отель !»</p>
  <div class="sec"><h2>Деньги</h2></div>
  <div class="tiles">${tile('newOp', 'in', 'От компании', 'аванс, перевод', 'data-type="income" data-owner="company"', 'g')}${tile('newOp', 'bag', 'Расход компании', 'с чеком', 'data-type="expense" data-owner="company"', 'g')}${tile('newOp', 'wallet', 'Личный расход', '', 'data-type="expense" data-owner="personal"')}${tile('newOp', 'cash', 'Наличные', 'снять или внести', 'data-type="transfer" data-owner="company"')}${tile('exchange', 'swap', 'Обмен валют', 'по актуальному курсу', '', 'g')}${tile('newOp', 'out', 'Вернуть компании', 'остаток денег', 'data-type="return" data-owner="company"')}</div>
  <div class="sec"><h2>Дела</h2></div>
  <div class="tiles three">${tile('editTask', 'spark', 'Задача', '')}${tile('editTrip', 'plane', 'Поездка', '')}${tile('pickDeck', 'slides', 'Презентация', '')}</div>`);
}
function exchangeSheet(o = {}) {
  const cs = curs(), ed = !!o.id;
  if (cs.length < 2) return sheet(`<h2>Обмен валют</h2><div class="card"><p>Добавьте вторую валюту в настройках: «Имя и валюты» → «Другие валюты», например «$, €».</p></div><button class="btn" style="margin-top:14px" data-a="profile">Открыть настройки</button>`);
  const from = o.cur || S.profile.currency, to = o.toCur || cs.find(c => c !== from);
  sheet(`<h2>${ed ? 'Обмен валюты' : 'Обмен валют'}</h2>
  <form data-form="exch"><input type="hidden" name="id" value="${o.id || ''}">
    <div class="xbox"><div class="flabel">Отдаю</div><div class="xrow"><input class="amount-in" type="text" inputmode="decimal" name="amount" value="${o.amount || ''}" placeholder="0" autocomplete="off">${select('cur', cs, from)}</div></div>
    <div class="xswap"><button type="button" data-a="xFlip" aria-label="Поменять местами">${ic('swap')}</button></div>
    <div class="xbox"><div class="flabel">Получаю</div><div class="xrow"><input class="amount-in" type="text" inputmode="decimal" name="toAmount" value="${o.toAmount || ''}" placeholder="0" autocomplete="off">${select('toCur', cs, to)}</div></div>
    <div class="card xinfo" id="xinfo"></div>
    <div class="flabel" style="margin-top:14px">Чьи деньги</div>${radio('owner', [['company', 'Компании'], ['personal', 'Личные']], o.owner || 'company')}
    <div class="row"><div style="flex:1"><div class="flabel" style="margin-top:14px">Откуда</div>${radio('account', [['card', 'Карта'], ['cash', 'Нал.']], o.account || 'cash')}</div><div style="flex:1"><div class="flabel" style="margin-top:14px">Куда</div>${radio('toAccount', [['card', 'Карта'], ['cash', 'Нал.']], o.toAccount || 'cash')}</div></div>
    <label class="f"><span>Где меняли</span><input type="text" name="note" value="${esc(o.note || '')}" placeholder="Банк, обменник"></label>
    <div class="row"><label class="f"><span>Дата</span><input type="date" name="date" value="${o.date || today()}"></label>
    <label class="f"><span>Чек</span><span class="file-btn">${ic('plus')} ${o.receipt ? 'Заменить' : 'Фото чека'}<input type="file" name="receipt" accept="image/*"></span></label></div>
    ${o.receipt ? `<img class="rcpt" src="${o.receipt}" alt="Чек">` : ''}
    <button class="btn" style="margin-top:20px">Сохранить обмен</button>
    ${ed ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delOp" data-id="${o.id}">Удалить</button>` : ''}
  </form>`);
  xUpdate();
  getRates().then(() => xUpdate());
}
function xUpdate() {
  const f = $('form[data-form=exch]'), box = $('#xinfo'); if (!f || !box) return;
  const a = num(f.amount.value), b = num(f.toAmount.value), from = f.cur.value, to = f.toCur.value;
  if (from === to) { box.innerHTML = '<p class="red">Выберите разные валюты</p>'; return; }
  const mk = rateOf(from, to), cb = rateOf(from, to, 'cb'), mine = a > 0 && b > 0 ? b / a : null, R = S.rates || {};
  const diff = mine && mk ? (mine / mk - 1) * 100 : null;
  box.innerHTML = `${mine ? `<div class="kv"><span>Ваш курс</span><b>${rateText(mine, from, to)}</b></div>` : ''}
    <div class="kv"><span>Рыночный</span><b>${rateText(mk, from, to)}</b></div>
    ${cb ? `<div class="kv"><span>ЦБ РФ${R.cbAt ? ' на ' + new Date(R.cbAt).toLocaleDateString('ru-RU') : ''}</span><b>${rateText(cb, from, to)}</b></div>` : ''}
    ${diff !== null ? `<div class="kv"><span>Разница с рынком</span><b class="${diff < -1.5 ? 'red' : ''}">${diff > 0 ? '+' : ''}${diff.toFixed(2).replace('.', ',')}%${a ? ' · ' + (diff < 0 ? 'потеря ' : 'выгода ') + fmt(Math.abs(b - a * mk), to) : ''}</b></div>` : ''}
    <div class="xbtns">${mk && a ? `<button type="button" class="btn ghost sm" data-a="xFill" data-src="mk">По рынку</button>` : ''}${cb && a ? `<button type="button" class="btn ghost sm" data-a="xFill" data-src="cb">По ЦБ</button>` : ''}<button type="button" class="btn ghost sm" data-a="xRefresh">${ic('swap')} Обновить</button></div>
    <p class="note" style="margin-top:6px">${R.mkAt ? 'Рынок: ' + new Date(R.mkAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ', open.er-api.com. ' : 'Курсы недоступны без интернета. '}Введите сумму, которую реально получили: она и попадёт в учёт.</p>`;
}
function opSheet(o = {}) {
  if (o.type === 'exchange' && !(o.id && S.closed[o.date.slice(0, 7)])) return exchangeSheet(o);
  const ed = !!o.id, locked = ed && S.closed[o.date.slice(0, 7)];
  if (locked) return sheet(`<h2>${esc(opTitle(o))}</h2><div class="card">${[['Дата', dmy(o.date)], ['Тип', TYPE[o.type]], ['Сумма', o.type === 'exchange' ? exText(o) : fmt(o.amount, oc(o))], ['Чьи деньги', OWN[o.owner]], ['Счёт', accText(o)], ['Категория', o.category || '—'], ['Комментарий', o.note || '—']].map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>${o.receipt ? `<img class="rcpt" src="${o.receipt}" alt="Чек">` : ''}<p class="note">Месяц закрыт: операция хранится в архиве без изменений.</p>`);
  const type = o.type || 'expense', owner = o.owner || 'company';
  sheet(`<h2>${ed ? 'Операция' : 'Новая операция'}</h2>
  <form data-form="op" data-type="${type}" data-owner="${owner}">
    <input type="hidden" name="id" value="${o.id || ''}">
    ${radio('type', [['expense', 'Расход'], ['income', 'Приход'], ['transfer', 'Наличные'], ['return', 'Возврат']], type)}
    <label class="f"><span>Сумма</span><input class="amount-in" type="text" inputmode="decimal" name="amount" value="${o.amount || ''}" placeholder="0" autocomplete="off"></label>
    ${curs().length > 1 ? `<div style="margin-top:8px">${radio('cur', curs().map(c => [c, c]), o.cur || S.profile.currency)}</div>` : ''}
    <div class="f-owner"><div class="flabel" style="margin-top:14px">Чьи деньги</div>${radio('owner', [['company', 'Компании'], ['personal', 'Личные']], owner)}</div>
    <div class="f-account"><div class="flabel" style="margin-top:14px">Счёт</div>${radio('account', [['card', 'Карта'], ['cash', 'Наличные']], o.account || 'card')}</div>
    <div class="f-dir"><div class="flabel" style="margin-top:14px">Направление</div>${radio('dir', [['c2n', 'Снять с карты'], ['n2c', 'Внести на карту']], o.account === 'cash' ? 'n2c' : 'c2n')}</div>
    <label class="f f-cat f-catc"><span>Категория</span>${select('catC', CAT_C, o.category)}</label>
    <label class="f f-cat f-catp"><span>Категория</span>${select('catP', CAT_P, o.category)}</label>
    ${S.trips.length ? `<label class="f f-cat f-trip"><span>Поездка или событие</span>${select('trip', [['', 'Не привязывать'], ...S.trips.map(t => [t.id, t.title])], o.tripId || '')}</label>` : ''}
    <label class="f"><span>Комментарий</span><input type="text" name="note" value="${esc(o.note || '')}" placeholder="На что или от кого"></label>
    <div class="row"><label class="f"><span>Дата</span><input type="date" name="date" value="${o.date || today()}"></label>
    <label class="f f-rcpt"><span>Чек</span><span class="file-btn">${ic('plus')} ${o.receipt ? 'Заменить' : 'Фото чека'}<input type="file" name="receipt" accept="image/*"></span></label></div>
    ${o.receipt ? `<img class="rcpt f-rcpt" src="${o.receipt}" alt="Чек">` : ''}
    <button class="btn" style="margin-top:20px">Сохранить</button>
    ${ed ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delOp" data-id="${o.id}">Удалить</button>` : ''}
  </form>`);
}
function reconSheet() {
  const b = balances();
  sheet(`<h2>Сверка с банком</h2><p class="lead">Введите, сколько денег есть на самом деле. Приложение покажет расхождение.</p>
  <form data-form="recon"><div class="card"><div class="kv"><span>По учёту на карте</span><b>${fmt(b.cardT)}</b></div><div class="kv"><span>По учёту наличными</span><b>${fmt(b.cashT)}</b></div></div>
  <label class="f"><span>На карте по факту</span><input type="text" inputmode="decimal" name="card" placeholder="${nf.format(b.cardT)}"></label>
  <label class="f"><span>Наличных по факту</span><input type="text" inputmode="decimal" name="cash" placeholder="${nf.format(b.cashT)}"></label>
  <button class="btn" style="margin-top:18px">Сверить</button></form>
  ${S.recon.length ? `<div class="sec"><h2>История</h2></div><div class="list">${[...S.recon].reverse().slice(0, 8).map(r => `<div class="item"><span class="mid"><div class="t">${dmy(r.date)}</div><div class="s">карта ${fmt(r.dCard)} · наличные ${fmt(r.dCash)}</div></span><span class="tag ${r.dCard || r.dCash ? 'red' : 'em'}">${r.dCard || r.dCash ? 'расхождение' : 'сошлось'}</span></div>`).join('')}</div>` : ''}`);
}
function reportData(m) {
  const before = S.ops.filter(o => o.date < m + '-01'), ops = S.ops.filter(o => o.date.slice(0, 7) === m).sort(byDate);
  const used = [...new Set(ops.map(oc).concat(ops.filter(o => o.toCur).map(o => o.toCur)))];
  const per = curs().concat(used.filter(c => !curs().includes(c))).map(cur => {
    const mine = ops.filter(o => oc(o) === cur && o.type !== 'exchange'), sum = f => mine.filter(f).reduce((s, o) => s + o.amount, 0), cats = {};
    const exOut = ops.filter(o => o.type === 'exchange' && oc(o) === cur).reduce((s, o) => s + o.amount, 0), exIn = ops.filter(o => o.type === 'exchange' && o.toCur === cur).reduce((s, o) => s + o.toAmount, 0);
    mine.filter(o => o.type === 'expense' && o.owner === 'company').forEach(o => cats[o.category || 'Прочее'] = (cats[o.category || 'Прочее'] || 0) + o.amount);
    return { cur, n: mine.length + (exOut || exIn ? 1 : 0), exOut, exIn, open: balances(before, cur), close: balances(before.concat(ops), cur), cats, cIn: sum(o => o.type === 'income' && o.owner === 'company'), cOut: sum(o => o.type === 'expense' && o.owner === 'company'), cRet: sum(o => o.type === 'return'), pIn: sum(o => o.type === 'income' && o.owner === 'personal'), pOut: sum(o => o.type === 'expense' && o.owner === 'personal') };
  }).filter((p, i) => i === 0 || p.n || p.open.company || p.open.personal);
  return { ops, per };
}
const opsDigest = ops => sha(JSON.stringify(ops.map(o => [o.id, o.date, o.type, o.amount, oc(o), o.owner, o.account, o.toAccount || '', o.category || '', o.note || '', o.receipt ? o.receipt.length : 0])));
function openReport(html) { $('#report').innerHTML = html; $('#report').hidden = false; $('#report').scrollTop = 0; document.documentElement.classList.add('modal'); }
function showReport(m) {
  const d = reportData(m), c = S.closed[m], trip = id => (S.trips.find(t => t.id === id) || {}).title || '', rc = d.ops.filter(o => o.receipt);
  openReport(`<div class="rep"><div class="rep-bar"><button class="btn sm" data-a="print">Печать / PDF</button><button class="btn ghost sm" data-a="csv" data-m="${m}">Excel (CSV)</button><button class="btn ghost sm" data-a="closeReport">Закрыть</button></div>
  <h1>Отчёт за ${monthName(m)}</h1><div class="meta">${esc(S.profile.name)} · сформирован ${new Date().toLocaleString('ru-RU')}<br>${c ? `Месяц закрыт ${new Date(c.at).toLocaleString('ru-RU')}. Контрольный код: ${c.hash}` : 'ЧЕРНОВИК: месяц не закрыт, данные могут измениться.'}</div>
  ${d.per.map(p => (FC = p.cur, `<h2>Деньги компании, ${esc(p.cur)}</h2><table>
    <tr><td>Остаток на начало месяца</td><td class="n">${fmt(p.open.company)}</td></tr><tr><td>Получено от компании</td><td class="n">+${fmt(p.cIn)}</td></tr>
    <tr><td>Потрачено на нужды компании</td><td class="n">−${fmt(p.cOut)}</td></tr><tr><td>Возвращено компании</td><td class="n">−${fmt(p.cRet)}</td></tr>
    ${p.exOut || p.exIn ? `<tr><td>Обмен валюты (все деньги): продано / куплено</td><td class="n">−${fmt(p.exOut)} / +${fmt(p.exIn)}</td></tr>` : ''}
    <tr><td><b>Остаток на конец месяца</b> (карта ${fmt(p.close.card.company)}, наличные ${fmt(p.close.cash.company)})</td><td class="n"><b>${fmt(p.close.company)}</b></td></tr></table>
  ${Object.keys(p.cats).length ? `<h2>Расходы компании по статьям, ${esc(p.cur)}</h2><table>${Object.entries(p.cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${fmt(v)}</td></tr>`).join('')}</table>` : ''}
  <h2>Личные деньги, ${esc(p.cur)}</h2><table><tr><td>Остаток на начало</td><td class="n">${fmt(p.open.personal)}</td></tr><tr><td>Поступило</td><td class="n">+${fmt(p.pIn)}</td></tr><tr><td>Потрачено</td><td class="n">−${fmt(p.pOut)}</td></tr><tr><td><b>Остаток на конец</b></td><td class="n"><b>${fmt(p.close.personal)}</b></td></tr></table>`)).join('')}${(FC = null, '')}
  <h2>Все операции (${d.ops.length})</h2><table><tr><th>№</th><th>Дата</th><th>Операция</th><th>Чьи</th><th>Счёт</th><th>Комментарий</th><th>Чек</th><th class="n">Сумма</th></tr>
  ${d.ops.map((o, i) => `<tr><td>${i + 1}</td><td>${dmy(o.date)}</td><td>${TYPE[o.type]}${o.category ? '<br>' + esc(o.category) : ''}</td><td>${OWN[o.owner]}</td><td>${accText(o)}</td><td>${esc(o.note || '')}${o.tripId ? '<br><i>' + esc(trip(o.tripId)) + '</i>' : ''}</td><td>${o.receipt ? 'есть' : '—'}</td><td class="n">${o.type === 'exchange' ? esc(exText(o)) + '<br><small>' + esc(rateText(o.toAmount / o.amount, oc(o), o.toCur)) + (o.market ? ', рынок ' + esc(rateText(o.market, oc(o), o.toCur)) : '') + '</small>' : (opSign(o) > 0 ? '+' : opSign(o) < 0 ? '−' : '') + nf.format(o.amount) + ' ' + esc(oc(o))}</td></tr>`).join('')}</table>
  ${rc.length ? `<h2>Приложение: чеки (${rc.length})</h2><div class="rc">${rc.map(o => `<figure><img src="${o.receipt}" alt=""><figcaption>№ ${d.ops.indexOf(o) + 1} · ${dmy(o.date)} · ${nf.format(o.amount)} ${esc(oc(o))} · ${esc(opTitle(o))}</figcaption></figure>`).join('')}</div>` : ''}</div>`);
}
function csv(m) {
  const d = reportData(m), q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const rows = [['Дата', 'Тип', 'Чьи деньги', 'Счёт', 'Категория', 'Сумма', 'Валюта', 'Комментарий', 'Чек', 'Поездка']].concat(d.ops.map(o => [dmy(o.date), TYPE[o.type], OWN[o.owner], accText(o), o.category || '', String((opSign(o) || 1) * o.amount).replace('.', ','), oc(o), (o.type === 'exchange' ? 'получено ' + nf.format(o.toAmount) + ' ' + o.toCur + '; ' : '') + (o.note || ''), o.receipt ? 'есть' : 'нет', (S.trips.find(t => t.id === o.tripId) || {}).title || '']));
  rows.push([]); d.per.forEach(p => rows.push(['Остаток денег компании на конец', '', '', '', '', String(p.close.company).replace('.', ','), p.cur], ['Остаток личных на конец', '', '', '', '', String(p.close.personal).replace('.', ','), p.cur]));
  saveFile(`otchet-${m}.csv`, '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv');
}
function tripSheet(id) {
  const x = S.trips.find(t => t.id === id); if (!x) return;
  const ops = S.ops.filter(o => o.tripId === id), d = x.check.filter(c => c.done).length;
  sheet(`<div class="trip-head">${ring(x.check.length ? d / x.check.length : 0, { size: 62, w: 6, label: x.check.length ? Math.round(d / x.check.length * 100) + '%' : '' })}<div><h2 style="margin:0">${esc(x.title)}</h2><p class="lead" style="margin:2px 0 0">${esc(x.place || '')} ${x.from ? dm(x.from) + (x.to && x.to !== x.from ? ' – ' + dm(x.to) : '') : ''}</p></div></div>
  ${x.notes ? `<div class="card"><p class="pre">${esc(x.notes)}</p></div>` : ''}
  <div class="sec"><h2>Чек-лист · ${d} из ${x.check.length}</h2></div><div class="list">${x.check.map((c, i) => `<button class="item ${c.done ? 'done' : ''}" data-a="toggleCheck" data-id="${id}" data-i="${i}"><span class="check ${c.done ? 'on' : ''}">${c.done ? ic('ok') : ''}</span><span class="mid"><div class="t">${esc(c.t)}</div></span></button>`).join('')}</div>
  <form class="quick" data-form="addCheck"><input type="hidden" name="id" value="${id}"><input type="text" name="t" placeholder="Добавить пункт"><button class="icon-btn" aria-label="Добавить">${ic('plus')}</button></form>
  <div class="sec"><h2>Расходы · ${ops.length ? sums(ops) : 'нет'}</h2><button data-a="newOp" data-type="expense" data-owner="company" data-trip="${id}">Добавить</button></div>${ops.length ? `<div class="list">${ops.map(opRow).join('')}</div>` : ''}
  <div class="tiles three" style="margin-top:18px">${tile('tripDeck', 'slides', 'Маршрут', 'презентация', `data-id="${id}"`, 'g')}${x.from ? tile('icsTrip', 'cal', 'Календарь', '', `data-id="${id}"`) : ''}${tile('editTrip', 'edit', 'Изменить', '', `data-id="${id}"`)}</div>`);
}
function slideSheet(i) {
  const d = S.decks.find(x => x.id === ui.deck), s = d && d.slides[i]; if (!s) return;
  sheet(`<h2>Слайд ${i + 1}</h2><div class="thumb big" id="spv">${slideHTML(s, d, i)}</div>
  <form data-form="slide" data-i="${i}">
    <div class="flabel" style="margin-top:14px">Макет</div>
    <div class="chips wrap">${Object.entries(LAYOUTS).map(([k, n]) => `<label class="chip-r"><input type="radio" name="layout" value="${k}" ${s.layout === k ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
    <label class="f"><span>Заголовок</span><input type="text" name="title" value="${esc(s.title)}"></label>
    <label class="f"><span id="subL">${s.layout === 'quote' ? 'Автор' : 'Подзаголовок'}</span><input type="text" name="sub" value="${esc(s.sub)}"></label>
    <label class="f"><span>Текст</span><textarea name="body" rows="6">${esc(s.body)}</textarea></label>
    <p class="hint" id="slHint">${HINT[s.layout]}</p>
    <button class="btn" style="margin-top:12px">Готово</button>
    <div class="row icons" style="margin-top:10px"><button type="button" class="btn ghost" data-a="moveSlide" data-i="${i}" data-k="-1" aria-label="Выше">${ic('up')}</button><button type="button" class="btn ghost" data-a="moveSlide" data-i="${i}" data-k="1" aria-label="Ниже">${ic('down')}</button><button type="button" class="btn ghost" data-a="dupSlide" data-i="${i}" aria-label="Копия">${ic('dup')}</button><button type="button" class="btn danger" data-a="delSlide" data-i="${i}" aria-label="Удалить">${ic('trash')}</button></div>
  </form>`);
}
function settingsSheet() {
  const it = (a, ico, t, s) => `<button class="item" data-a="${a}"><span class="dot">${ic(ico)}</span><span class="mid"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</span>${ic('go')}</button>`;
  sheet(`<div class="prof"><div class="mono big">VJ</div><div><h2 style="margin:0">${esc(S.profile.name)}</h2><p class="lead" style="margin:0">Личный кабинет</p></div></div>
  <div class="sec"><h2>Профиль</h2></div><div class="list">${it('profile', 'user', 'Имя и валюты', esc(curs().join(' · ')))}${it('budget', 'chart', 'Бюджет на месяц', S.profile.budget ? fmt(S.profile.budget) : 'не задан')}${it('pin', 'lock', 'PIN-код', S.profile.pin ? 'включён' : 'выключен')}</div>
  <div class="sec"><h2>Контроль</h2></div><div class="list">${it('reminders', 'bell', 'Напоминания в календарь', 'операции, сверка, закрытие месяца')}${it('recon', 'swap', 'Сверка с банком', '')}${it('showLog', 'list', 'Журнал изменений', 'записей: ' + S.log.length)}${it('device', 'user', 'Подпись устройства', DEV() || 'не задана')}${it('exchange', 'swap', 'Обмен валют и курсы', '')}</div>
  <div class="sec"><h2>Данные</h2></div><div class="list">${window.FIREBASE_CONFIG ? it('cloud', 'archive', 'Облако', Cloud.status()) : ''}${it('backup', 'copy', 'Сохранить резервную копию', S.lastBackup ? 'последняя ' + new Date(S.lastBackup).toLocaleDateString('ru-RU') : 'ещё не сохранялась')}
    <label class="item"><span class="dot">${ic('in')}</span><span class="mid"><div class="t">Восстановить из копии</div><div class="s">заменит текущие данные</div></span>${ic('go')}<input type="file" accept=".json,application/json" data-c="restore" hidden></label></div>
  <p class="note" style="text-align:center">VJ · версия 2.0</p>`);
}

/* ================= present & print ================= */
let show = null;
function play(i = 0) { const d = S.decks.find(x => x.id === ui.deck); if (!d) return; show = { d, i }; $('#show').hidden = false; document.documentElement.classList.add('modal'); drawShow(); try { const r = document.documentElement.requestFullscreen; r && r.call(document.documentElement).catch(() => { }); } catch (e) { } }
function drawShow() {
  if (!show) return; const { d, i } = show, w = Math.min(innerWidth, innerHeight * 16 / 9);
  $('#show').innerHTML = `<div class="show-slide" style="width:${w}px">${slideHTML(d.slides[i], d, i)}</div><div class="show-ui"><span>${i + 1} / ${d.slides.length}</span><button data-a="showClose" aria-label="Закрыть">${ic('close')}</button></div>${innerHeight > innerWidth ? '<div class="show-hint">Поверните телефон для показа на весь экран</div>' : ''}`;
}
function stepShow(k) { if (!show) return; const n = show.d.slides.length, j = show.i + k; if (j < 0) return; if (j >= n) return A.showClose(); show.i = j; drawShow(); }
function deckPrint(d) {
  let st = $('#pagestyle'); if (!st) { st = document.createElement('style'); st.id = 'pagestyle'; document.head.appendChild(st); }
  st.textContent = '@page{size:297mm 167.06mm;margin:0}';
  openReport(`<div class="rep deck-print"><div class="rep-bar"><button class="btn sm" data-a="print">Сохранить PDF / печать</button><button class="btn ghost sm" data-a="closeReport">Закрыть</button></div>${d.slides.map((s, i) => `<div class="pslide">${slideHTML(s, d, i)}</div>`).join('')}</div>`);
}

/* ================= actions ================= */
const curDeck = () => S.decks.find(x => x.id === ui.deck);
const A = {
  closeSheet, create: createSheet, settings: settingsSheet,
  tab(d) { ui.tab = d.tab; if (d.tab !== 'studio') ui.deck = null; render(); window.scrollTo(0, 0); },
  seg(d) { ui[d.key] = d.k; if (d.tab) ui.tab = d.tab; render(); if (d.tab) window.scrollTo(0, 0); },
  noReceipt() { ui.tab = 'money'; ui.fin = 'ops'; ui.filter = 'noreceipt'; render(); },
  archive() { closeSheet(); ui.tab = 'money'; ui.fin = 'archive'; render(); },
  newOp(d) { opSheet({ type: d.type, owner: d.owner, tripId: d.trip }); },
  editOp(d) { const o = S.ops.find(x => x.id === d.id); if (o) opSheet(o); },
  delOp(d) { const i = S.ops.findIndex(x => x.id === d.id); if (i < 0 || !confirm('Удалить операцию? Запись об удалении останется в журнале.')) return; log('Удалена операция: ' + describe(S.ops[i])); S.ops.splice(i, 1); save(); closeSheet(); render(); toast('Удалено'); },
  filter(d) { ui.filter = d.f; render(); }, month(d) { ui.month = shiftMonth(ui.month, +d.k); render(); },
  recon: reconSheet,
  report(d) { closeSheet(); showReport(d.m); },
  closeReport() { $('#report').hidden = true; $('#report').innerHTML = ''; const st = $('#pagestyle'); if (st) st.remove(); document.documentElement.classList.remove('modal'); },
  print() { window.print(); }, csv(d) { csv(d.m); },
  async closeMonth(d) { if (!confirm(`Закрыть ${monthName(d.m)}? После этого операции месяца нельзя будет изменить или удалить.`)) return; const ops = S.ops.filter(o => o.date.slice(0, 7) === d.m).sort(byDate); S.closed[d.m] = { at: new Date().toISOString(), hash: await opsDigest(ops), count: ops.length }; log(`Закрыт месяц ${monthName(d.m)}: операций ${ops.length}, код ${S.closed[d.m].hash.slice(0, 12)}…`); save(); render(); toast('Месяц закрыт'); },
  showLog() { sheet(`<h2>Журнал изменений</h2>${S.log.length ? `<div class="list">${[...S.log].reverse().slice(0, 200).map(l => `<div class="item"><span class="mid"><div class="s">${new Date(l.at).toLocaleString('ru-RU')}${l.by ? ' · ' + esc(l.by) : ''}</div><div class="wrap-t">${esc(l.t)}</div></span></div>`).join('')}</div>` : '<div class="empty">Записей пока нет.</div>'}`); },
  reminders() { sheet(`<h2>Напоминания</h2><p class="lead">Откроется событие для календаря айфона. Добавьте его, и календарь будет напоминать сам.</p><div class="list">
    <button class="item" data-a="ics" data-k="day"><span class="dot">${ic('clock')}</span><span class="mid"><div class="t">Каждый вечер в 20:00</div><div class="s">внести операции за день</div></span>${ic('cal')}</button>
    <button class="item" data-a="ics" data-k="week"><span class="dot">${ic('swap')}</span><span class="mid"><div class="t">Каждое воскресенье</div><div class="s">сверить остаток с банком</div></span>${ic('cal')}</button>
    <button class="item" data-a="ics" data-k="month"><span class="dot c">${ic('archive')}</span><span class="mid"><div class="t">Первого числа</div><div class="s">закрыть месяц и сохранить отчёт</div></span>${ic('cal')}</button></div>`); },
  ics(d) { const t = today(); if (d.k === 'day') makeIcs('VJ: внести операции за день', t, { time: '20:00', rrule: 'FREQ=DAILY' }); else if (d.k === 'week') makeIcs('VJ: сверить остаток с банком', t, { time: '19:00', rrule: 'FREQ=WEEKLY;BYDAY=SU' }); else makeIcs('VJ: закрыть месяц и сохранить отчёт', t, { time: '10:00', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1' }); },
  profile() { sheet(`<h2>Имя и валюты</h2><form data-form="profile"><label class="f"><span>Имя</span><input type="text" name="name" value="${esc(S.profile.name)}"></label><label class="f"><span>Основная валюта (знак)</span><input type="text" name="cur" value="${esc(S.profile.currency)}" maxlength="4"></label><label class="f"><span>Другие валюты через запятую</span><input type="text" name="extra" value="${esc((S.profile.extra || []).join(', '))}" placeholder="$, €"></label><button class="btn" style="margin-top:18px">Сохранить</button></form>`); },
  budget() { sheet(`<h2>Бюджет на месяц</h2><p class="lead">Сколько личных денег вы планируете тратить в месяц. На главном экране появится шкала остатка.</p><form data-form="budget"><label class="f"><span>Сумма, ${esc(S.profile.currency)}</span><input class="amount-in" type="text" inputmode="decimal" name="b" value="${S.profile.budget || ''}" placeholder="0"></label><button class="btn" style="margin-top:18px">Сохранить</button></form>`); },
  pin() { sheet(`<h2>PIN-код</h2><form data-form="pin"><label class="f"><span>Новый PIN, 4 цифры</span><input type="password" inputmode="numeric" name="pin" maxlength="4" autocomplete="off"></label><button class="btn" style="margin-top:18px">Установить</button>${S.profile.pin ? '<button type="button" class="btn danger" style="margin-top:10px" data-a="pinOff">Отключить PIN</button>' : ''}</form>`); },
  pinOff() { S.profile.pin = null; save(); closeSheet(); render(); toast('PIN отключён'); },
  async backup() { S.lastBackup = Date.now(); await saveFile(`vj-kopiya-${today()}.json`, JSON.stringify(S), 'application/json'); save(); render(); },
  toggleTask(d) { const x = S.tasks.find(t => t.id === d.id); if (x) { x.done = !x.done; x.doneAt = x.done ? new Date().toISOString() : null; save(); render(); if (x.done) toast('Готово'); } },
  editTask(d) {
    const x = S.tasks.find(t => t.id === d.id) || { due: d.due || '' };
    sheet(`<h2>${x.id ? 'Задача' : 'Новая задача'}</h2><form data-form="task"><input type="hidden" name="id" value="${x.id || ''}">
    <label class="f"><span>Что сделать</span><input type="text" name="title" value="${esc(x.title || '')}" placeholder="Забронировать переговорную"></label>
    <div class="row"><label class="f"><span>Срок</span><input type="date" name="due" value="${x.due || ''}"></label><label class="f"><span>Время</span><input type="time" name="time" value="${x.time || ''}"></label></div>
    <div class="flabel" style="margin-top:14px">Тип</div><div class="chips wrap">${['', ...TCAT].map(c => `<label class="chip-r"><input type="radio" name="cat" value="${c}" ${(x.cat || '') === c ? 'checked' : ''}><span>${c ? `<i class="cdot" style="background:${PAL[TCAT.indexOf(c)]}"></i>` + c : 'Без типа'}</span></label>`).join('')}</div>
    <label class="switch"><input type="checkbox" name="imp" ${x.important ? 'checked' : ''}><span></span>Важная задача</label>
    <label class="f"><span>Заметка</span><textarea name="note" rows="3">${esc(x.note || '')}</textarea></label>
    <button class="btn" style="margin-top:18px">Сохранить</button>
    ${x.id ? `<div class="row" style="margin-top:10px">${x.due ? `<button type="button" class="btn ghost" data-a="icsTask" data-id="${x.id}">${ic('cal')} В календарь</button>` : ''}<button type="button" class="btn danger" data-a="delTask" data-id="${x.id}">Удалить</button></div>` : ''}</form>`);
  },
  delTask(d) { S.tasks = S.tasks.filter(t => t.id !== d.id); save(); closeSheet(); render(); },
  icsTask(d) { const x = S.tasks.find(t => t.id === d.id); if (x) makeIcs(x.title, x.due, { time: x.time }); },
  pickDay(d) { ui.day = d.d; render(); },
  trip(d) { tripSheet(d.id); },
  editTrip(d) { const x = S.trips.find(t => t.id === d.id) || {}; sheet(`<h2>${x.id ? 'Поездка' : 'Новая поездка или событие'}</h2><form data-form="trip"><input type="hidden" name="id" value="${x.id || ''}"><label class="f"><span>Название</span><input type="text" name="title" value="${esc(x.title || '')}" placeholder="Командировка в Дубай"></label><label class="f"><span>Место</span><input type="text" name="place" value="${esc(x.place || '')}"></label><div class="row"><label class="f"><span>Начало</span><input type="date" name="from" value="${x.from || ''}"></label><label class="f"><span>Конец</span><input type="date" name="to" value="${x.to || ''}"></label></div><label class="f"><span>Программа: каждая строка «когда — что»</span><textarea name="notes" rows="5" placeholder="12.12 09:40 — Вылет SU 520, терминал B&#10;12.12 15:00 — Встреча с партнёром">${esc(x.notes || '')}</textarea></label><button class="btn" style="margin-top:18px">Сохранить</button>${x.id ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delTrip" data-id="${x.id}">Удалить</button>` : ''}</form>`); },
  delTrip(d) { if (!confirm('Удалить поездку? Расходы останутся в учёте.')) return; S.trips = S.trips.filter(t => t.id !== d.id); S.ops.forEach(o => { if (o.tripId === d.id) delete o.tripId; }); save(); closeSheet(); render(); },
  toggleCheck(d) { const x = S.trips.find(t => t.id === d.id); if (x) { x.check[+d.i].done = !x.check[+d.i].done; save(); render(); tripSheet(d.id); } },
  icsTrip(d) { const x = S.trips.find(t => t.id === d.id); if (x) makeIcs(x.title, x.from); },
  tripDeck(d) { const x = S.trips.find(t => t.id === d.id); if (!x) return; const dk = deckFromTrip(x); closeSheet(); ui.tab = 'studio'; ui.deck = dk.id; render(); window.scrollTo(0, 0); toast('Маршрут собран из поездки'); },
  pickDeck() { sheet(`<h2>Новая презентация</h2><div class="tpl-grid">${Object.entries(DECKS).map(([k, x]) => { const sl = x.make(); return `<button class="tpl" data-a="newDeck" data-k="${k}"><div class="thumb">${slideHTML(sl[0], { title: '', theme: x.theme, slides: sl }, 0)}</div><b>${x.name}</b><small>${x.desc}</small></button>`; }).join('')}</div>`); },
  newDeck(d) { const dk = newDeck(d.k); closeSheet(); ui.tab = 'studio'; ui.deck = dk.id; render(); window.scrollTo(0, 0); },
  openDeck(d) { ui.deck = d.id; render(); window.scrollTo(0, 0); },
  closeDeck() { ui.deck = null; render(); },
  deckTheme(d) { const x = curDeck(); x.theme = d.k; save(); render(); },
  deckMeta() { const x = curDeck(); sheet(`<h2>Презентация</h2><form data-form="deckMeta"><label class="f"><span>Название</span><input type="text" name="title" value="${esc(x.title)}"></label><label class="f"><span>Автор на титуле</span><input type="text" name="author" value="${esc(x.author || '')}"></label><label class="f"><span>Дата на титуле</span><input type="date" name="date" value="${x.date || ''}"></label><button class="btn" style="margin-top:18px">Сохранить</button></form>`); },
  delDeck() { if (!confirm('Удалить презентацию?')) return; S.decks = S.decks.filter(x => x.id !== ui.deck); ui.deck = null; save(); render(); },
  editSlide(d) { slideSheet(+d.i); },
  addSlide() { sheet(`<h2>Новый слайд</h2><div class="tiles">${Object.entries(LAYOUTS).map(([k, n]) => tile('addSlideOf', { title: 'slides', section: 'flag', bullets: 'list', text: 'doc', stats: 'chart', two: 'grid', timeline: 'clock', quote: 'mail', end: 'ok' }[k], n, '', `data-k="${k}"`)).join('')}</div>`); },
  addSlideOf(d) { const x = curDeck(); const s = SL(d.k, LAYOUTS[d.k], '', ''); x.slides.splice(Math.max(1, x.slides.length - (x.slides[x.slides.length - 1].layout === 'end' ? 1 : 0)), 0, s); save(); slideSheet(x.slides.indexOf(s)); },
  moveSlide(d) { const x = curDeck(), i = +d.i, j = i + +d.k; if (j < 0 || j >= x.slides.length) return; [x.slides[i], x.slides[j]] = [x.slides[j], x.slides[i]]; save(); slideSheet(j); },
  dupSlide(d) { const x = curDeck(), i = +d.i; x.slides.splice(i + 1, 0, { ...x.slides[i], id: uid() }); save(); slideSheet(i + 1); toast('Копия создана'); },
  delSlide(d) { const x = curDeck(); if (x.slides.length < 2) return toast('Нужен хотя бы один слайд'); x.slides.splice(+d.i, 1); save(); closeSheet(); },
  play() { play(0); }, showClose() { show = null; $('#show').hidden = true; $('#show').innerHTML = ''; document.documentElement.classList.remove('modal'); try { document.fullscreenElement && document.exitFullscreen(); } catch (e) { } },
  showTap(d, el, e) { if (swiped) { swiped = false; return; } stepShow(e.clientX > innerWidth / 3 ? 1 : -1); },
  deckPdf() { deckPrint(curDeck()); },
  editTpl(d) { const x = S.templates.find(t => t.id === d.id) || {}; sheet(`<h2>${x.id ? 'Шаблон' : 'Новый шаблон'}</h2><form data-form="tpl"><input type="hidden" name="id" value="${x.id || ''}"><label class="f"><span>Название</span><input type="text" name="title" value="${esc(x.title || '')}"></label><label class="f"><span>Текст</span><textarea name="body" rows="12">${esc(x.body || '')}</textarea></label><div class="row" style="margin-top:18px">${x.id ? `<button type="button" class="btn ghost" data-a="copyTpl" data-id="${x.id}">${ic('copy')} Копировать</button>` : ''}<button class="btn">Сохранить</button></div>${x.id ? `<button type="button" class="btn danger" style="margin-top:10px" data-a="delTpl" data-id="${x.id}">Удалить</button>` : ''}</form>`); },
  delTpl(d) { S.templates = S.templates.filter(t => t.id !== d.id); save(); closeSheet(); render(); },
  async copyTpl(d) { const x = S.templates.find(t => t.id === d.id); try { await navigator.clipboard.writeText(x.body); toast('Текст скопирован'); } catch (e) { toast('Не удалось скопировать'); } },
  key(d) { lockKey(d.k); },
  exchange() { exchangeSheet(); },
  xFlip() { const f = $('form[data-form=exch]'); const c = f.cur.value; f.cur.value = f.toCur.value; f.toCur.value = c; const a = f.amount.value; f.amount.value = f.toAmount.value; f.toAmount.value = a; xUpdate(); },
  xFill(d) { const f = $('form[data-form=exch]'), r = rateOf(f.cur.value, f.toCur.value, d.src); if (r) { f.toAmount.value = String(Math.round(num(f.amount.value) * r * 100) / 100).replace('.', ','); xUpdate(); } },
  async xRefresh() { toast('Обновляю курсы…'); await getRates(true); xUpdate(); render(); toast(S.rates && S.rates.mk ? 'Курсы обновлены' : 'Нет связи с сервером курсов'); },
  device() { sheet(`<h2>Подпись устройства</h2><p class="lead">Имя появится в журнале рядом с каждым изменением, сделанным с этого телефона. Так видно, кто что поправил.</p><form data-form="device"><label class="f"><span>Это устройство</span><input type="text" name="n" value="${esc(DEV())}" placeholder="Например: телефон Виолетты"></label><button class="btn" style="margin-top:18px">Сохранить</button></form>`); },
  fix(d) { const v = +d.d; opSheet({ type: v > 0 ? 'income' : 'expense', owner: 'company', account: d.acc, amount: Math.abs(v) }); }
};
const F = {
  start(fd) {
    S.profile.name = fd.get('name').trim() || 'Виолетта'; S.profile.currency = fd.get('cur'); S.profile.ready = true;
    [['cc', 'card', 'company'], ['cp', 'card', 'personal'], ['nc', 'cash', 'company'], ['np', 'cash', 'personal']].forEach(([k, account, owner]) => { const a = num(fd.get(k)); if (a > 0) S.ops.push({ id: uid(), type: 'income', date: today(), amount: a, account, owner, note: 'Начальный остаток', createdAt: new Date().toISOString() }); });
    log('Начало учёта'); save(); render();
  },
  smart(fd) {
    const q = fd.get('q').trim(); if (!q) return;
    const taskLike = /^(задача|напомни)/i.test(q) || /\d{1,2}:\d{2}/.test(q) || /(^|\s)(сегодня|завтра|послезавтра|понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресенье)(\s|$)/i.test(q) || !/\d/.test(q);
    if (taskLike) { const r = parseTask(q); if (!r.title) return; S.tasks.push({ id: uid(), done: false, ...r }); save(); closeSheet(); ui.tab = 'assist'; ui.as = 'list'; render(); toast('Задача добавлена' + (r.due ? ' · ' + dayLabel(r.due).toLowerCase() : '')); }
    else { const r = parseQuick(q); r.type === 'exchange' ? exchangeSheet({ amount: r.amount, cur: r.cur, owner: r.owner }) : opSheet(r); }
  },
  async exch(fd) {
    const amount = num(fd.get('amount')), toAmount = num(fd.get('toAmount')), cur = fd.get('cur'), toCur = fd.get('toCur'), date = fd.get('date') || today(), id = fd.get('id');
    if (!(amount > 0) || !(toAmount > 0)) return toast('Введите обе суммы'); if (cur === toCur) return toast('Выберите разные валюты');
    if (S.closed[date.slice(0, 7)]) return toast('Этот месяц уже закрыт');
    const o = { type: 'exchange', date, amount, cur, toAmount, toCur, owner: fd.get('owner'), account: fd.get('account'), toAccount: fd.get('toAccount'), note: fd.get('note').trim(), market: rateOf(cur, toCur), cbRate: rateOf(cur, toCur, 'cb') };
    const i = id ? S.ops.findIndex(x => x.id === id) : -1, old = S.ops[i], file = fd.get('receipt');
    if (file && file.size) o.receipt = await compress(file); else if (old && old.receipt) o.receipt = old.receipt;
    if (old) { S.ops[i] = { ...o, id, createdAt: old.createdAt, updatedAt: new Date().toISOString() }; log('Изменён обмен. Было: ' + describe(old) + '. Стало: ' + describe(o)); }
    else { S.ops.push({ ...o, id: uid(), createdAt: new Date().toISOString() }); log('Добавлен обмен: ' + describe(o)); }
    ui.month = date.slice(0, 7); save(); closeSheet(); render(); toast('Обмен сохранён');
  },
  device(fd) { try { localStorage.setItem('vj-device', fd.get('n').trim()); } catch (e) { } closeSheet(); toast('Сохранено'); },
  taskQuick(fd) { const q = fd.get('q').trim(); if (!q) return; const r = parseTask(q); if (!r.title) return; S.tasks.push({ id: uid(), done: false, ...r }); save(); render(); toast('Добавлено' + (r.due ? ' · ' + dayLabel(r.due).toLowerCase() : '') + (r.time ? ' в ' + r.time : '')); },
  async op(fd) {
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
  budget(fd) { S.profile.budget = num(fd.get('b')); save(); closeSheet(); render(); toast(S.profile.budget ? 'Бюджет сохранён' : 'Бюджет отключён'); },
  async pin(fd) { const p = fd.get('pin'); if (!/^\d{4}$/.test(p)) return toast('Нужно 4 цифры'); S.profile.pin = await sha('vj:' + p); save(); closeSheet(); render(); toast('PIN установлен'); },
  task(fd) { const title = fd.get('title').trim(); if (!title) return toast('Введите название'); const id = fd.get('id'); let x = S.tasks.find(t => t.id === id); if (!x) { x = { id: uid(), done: false }; S.tasks.push(x); } Object.assign(x, { title, due: fd.get('due'), time: fd.get('time'), cat: fd.get('cat') || '', important: !!fd.get('imp'), note: fd.get('note').trim() }); save(); closeSheet(); render(); },
  trip(fd) { const title = fd.get('title').trim(); if (!title) return toast('Введите название'); const id = fd.get('id'); let x = S.trips.find(t => t.id === id); if (!x) { x = { id: uid(), check: ['Билеты', 'Отель', 'Трансфер', 'Документы и виза', 'Расписание встреч', 'Маршрут отправлен руководителю'].map(t => ({ t, done: false })) }; S.trips.push(x); } Object.assign(x, { title, place: fd.get('place').trim(), from: fd.get('from'), to: fd.get('to'), notes: fd.get('notes').trim() }); save(); render(); tripSheet(x.id); },
  addCheck(fd) { const x = S.trips.find(t => t.id === fd.get('id')), t = fd.get('t').trim(); if (x && t) { x.check.push({ t, done: false }); save(); render(); tripSheet(x.id); } },
  tpl(fd) { const title = fd.get('title').trim(); if (!title) return toast('Введите название'); const id = fd.get('id'); let x = S.templates.find(t => t.id === id); if (!x) { x = { id: uid() }; S.templates.unshift(x); } Object.assign(x, { title, body: fd.get('body') }); save(); closeSheet(); render(); },
  deckMeta(fd) { const x = curDeck(); x.title = fd.get('title').trim() || x.title; x.author = fd.get('author').trim(); x.date = fd.get('date'); if (x.slides[0] && x.slides[0].layout === 'title') x.slides[0].title = x.title; save(); closeSheet(); },
  slide() { closeSheet(); }
};

/* ================= lock ================= */
let pinBuf = '';
function showLock() { pinBuf = ''; const L = $('#lock'); L.hidden = false; L.innerHTML = `<div class="big">VJ</div><div class="pins">${'<i></i>'.repeat(4)}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '←'].map(k => k === '' ? '<span></span>' : `<button data-a="key" data-k="${k}">${k}</button>`).join('')}</div>`; }
async function lockKey(k) {
  if (k === '←') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < 4) pinBuf += k;
  document.querySelectorAll('#lock .pins i').forEach((el, i) => el.classList.toggle('on', i < pinBuf.length));
  if (pinBuf.length === 4) { if (await sha('vj:' + pinBuf) === S.profile.pin) $('#lock').hidden = true; else { toast('Неверный PIN'); showLock(); } }
}

/* ================= events ================= */
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el) return; const fn = A[el.dataset.a]; if (fn) { if (el.tagName === 'BUTTON' && el.type !== 'submit') e.preventDefault(); fn(el.dataset, el, e); } });
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); const fn = F[f.dataset.form]; if (fn) fn(new FormData(f), f); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.c === 'q') { ui.q = t.value; const pos = t.selectionStart; render(); const n = $('[data-c=q]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } } return; }
  if (t.closest('form[data-form=exch]')) { xUpdate(); return; }
  const f = t.closest('form[data-form=slide]');
  if (f) {
    const d = curDeck(), i = +f.dataset.i, s = d && d.slides[i]; if (!s) return;
    const fd = new FormData(f); s.layout = fd.get('layout'); s.title = fd.get('title'); s.sub = fd.get('sub'); s.body = fd.get('body');
    if (i === 0 && s.layout === 'title') d.title = s.title || d.title;
    $('#spv').innerHTML = slideHTML(s, d, i); $('#slHint').textContent = HINT[s.layout]; $('#subL').textContent = s.layout === 'quote' ? 'Автор' : 'Подзаголовок'; save();
  }
});
document.addEventListener('change', e => {
  const t = e.target, f = t.closest('form[data-form=op]');
  if (t.closest('form[data-form=exch]') && (t.name === 'cur' || t.name === 'toCur')) xUpdate();
  if (f && t.name === 'type') f.dataset.type = t.value;
  if (f && t.name === 'owner') f.dataset.owner = t.value;
  if (t.name === 'receipt' && t.files[0]) { const b = t.closest('.file-btn'); if (b) b.firstChild.nextSibling.textContent = ' Выбрано'; }
  if (t.dataset.c === 'restore' && t.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d.profile || !Array.isArray(d.ops)) throw 0; if (!confirm('Заменить текущие данные данными из копии?')) return; S = Object.assign(fresh(), d); S.profile = Object.assign(fresh().profile, d.profile); save(); closeSheet(); render(); toast('Данные восстановлены'); } catch (err) { toast('Файл не подходит'); } }; fr.readAsText(t.files[0]); }
});
// свайп вниз закрывает нижнее окно
(() => {
  const b = $('#sheetBody'); let y0 = null, dy = 0, drag = false;
  b.addEventListener('touchstart', e => { if (b.scrollTop > 2 || e.target.closest('textarea,input,select')) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; drag = false; }, { passive: true });
  b.addEventListener('touchmove', e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 6) { drag = true; b.style.transition = 'none'; b.style.transform = `translateY(${dy}px)`; if (e.cancelable) e.preventDefault(); } }, { passive: false });
  b.addEventListener('touchend', () => { if (y0 === null) return; y0 = null; if (!drag) return; b.style.transition = 'transform .22s ease'; if (dy > 110) { b.style.transform = 'translateY(110%)'; setTimeout(closeSheet, 200); } else b.style.transform = ''; setTimeout(() => { b.style.transition = ''; }, 240); });
})();
// показ слайдов: свайп и клавиши
let swiped = false;
(() => {
  const s = $('#show'); let x0 = null;
  s.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  s.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) { swiped = true; stepShow(dx < 0 ? 1 : -1); setTimeout(() => { swiped = false; }, 400); } });
  addEventListener('keydown', e => { if (!show) return; if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) stepShow(1); else if (['ArrowLeft', 'PageUp'].includes(e.key)) stepShow(-1); else if (e.key === 'Escape') A.showClose(); });
  addEventListener('resize', () => { if (show) drawShow(); });
})();
let lockedAt = Date.now();
document.addEventListener('visibilitychange', () => { if (document.hidden) { DB.set('state', S); lockedAt = Date.now(); } else if (S.profile.pin && Date.now() - lockedAt > 60000) showLock(); });

(async () => {
  await DB.open(); const d = await DB.get('state');
  if (d && d.profile) { S = Object.assign(fresh(), d); S.profile = Object.assign(fresh().profile, d.profile); if (!Array.isArray(S.decks)) S.decks = []; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
  render(); if (S.profile.pin) showLock();
  if (window.Cloud) Cloud.init();
  if (S.profile.ready && curs().length > 1) getRates().then(() => { if (ui.tab === 'home' && $('#sheet').hidden) render(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
