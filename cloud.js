'use strict';
/* Облако: Firebase Auth + Firestore. Данные шифруются на устройстве (AES-GCM),
   ключ выводится из пароля (PBKDF2). В Firebase уходит не сам пароль, а производное от него значение,
   поэтому ни пароль, ни содержимое учёта в облаке прочитать нельзя. */
window.Cloud = (() => {
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/', CHUNK = 600000;
  let fb = null, user = null, key = null, busy = false, timer, changes = 0, err = '';
  let meta = { base: 0, dirty: false, up: {}, at: 0 };
  const cfg = () => window.FIREBASE_CONFIG;
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('sdk')); document.head.appendChild(s); });
  const b64 = buf => { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const saveMeta = () => DB.set('cloudMeta', meta);

  async function derive(email, pass) {
    const enc = new TextEncoder(), base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
    const p = salt => ({ name: 'PBKDF2', hash: 'SHA-256', iterations: 310000, salt: enc.encode(salt + email.trim().toLowerCase()) });
    const bits = await crypto.subtle.deriveBits(p('vj-auth:'), base, 256);
    const k = await crypto.subtle.deriveKey(p('vj-enc:'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { secret: b64(bits), key: k };
  }
  async function seal(obj, k = key) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(obj))); return b64(iv) + '.' + b64(ct); }
  async function unseal(str, k = key) { const [iv, ct] = str.split('.'); const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, k, unb64(ct)); return JSON.parse(new TextDecoder().decode(pt)); }

  async function init() {
    A.cloud = sheetCloud; A.cloudSync = () => sync(true); A.cloudOut = signOut; F.cloud = submit;
    if (!cfg() || !window.crypto || !crypto.subtle) return;
    try {
      key = await DB.get('cloudKey'); meta = (await DB.get('cloudMeta')) || meta;
      await load(SDK + 'firebase-app-compat.js'); await load(SDK + 'firebase-auth-compat.js'); await load(SDK + 'firebase-firestore-compat.js');
      firebase.initializeApp(cfg()); fb = { auth: firebase.auth(), db: firebase.firestore() };
      fb.auth.onAuthStateChanged(u => { user = u; if (u && key) sync(); render(); });
      window.addEventListener('online', () => sync());
      document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
    } catch (e) { err = 'нет связи с облаком'; }
  }
  function touch() { changes++; if (!meta.dirty) { meta.dirty = true; saveMeta(); } if (!user) return; clearTimeout(timer); timer = setTimeout(() => sync(), 4000); }

  async function pull(ref, remote) {
    const qs = await ref.collection('chunks').get(), parts = [];
    qs.forEach(d => { if (+d.id < remote.n) parts[+d.id] = d.data().d; });
    const st = await unseal(parts.join('')), local = {};
    S.ops.forEach(o => { if (o.receipt && o.receipt !== '@') local[o.id] = o.receipt; });
    await Promise.all(st.ops.filter(o => o.receipt === '@').map(async o => {
      if (local[o.id]) { o.receipt = local[o.id]; return; }
      try { const d = await ref.collection('receipts').doc(o.id).get(); o.receipt = d.exists ? await unseal(d.data().d) : undefined; } catch (e) { o.receipt = undefined; }
    }));
    S = Object.assign(fresh(), st); DB.set('state', S);
    meta = { base: remote.rev, dirty: false, up: {}, at: Date.now() }; S.ops.forEach(o => { if (o.receipt) meta.up[o.id] = 1; });
  }
  async function push(ref, remote) {
    const mark = changes;
    for (const o of S.ops) if (o.receipt && o.receipt !== '@' && !meta.up[o.id]) { await ref.collection('receipts').doc(o.id).set({ d: await seal(o.receipt) }); meta.up[o.id] = 1; }
    const sealed = await seal({ ...S, ops: S.ops.map(o => o.receipt ? { ...o, receipt: '@' } : o) });
    const batch = fb.db.batch(), n = Math.ceil(sealed.length / CHUNK), rev = (remote ? remote.rev : 0) + 1;
    for (let i = 0; i < n; i++) batch.set(ref.collection('chunks').doc(String(i)), { d: sealed.slice(i * CHUNK, (i + 1) * CHUNK) });
    batch.set(ref, { rev, n, at: Date.now() }); await batch.commit();
    meta.base = rev; meta.dirty = changes !== mark; meta.at = Date.now();
  }
  async function sync(manual) {
    if (!fb || !user || !key || busy) return; if (!navigator.onLine) { if (manual) toast('Нет интернета'); return; }
    busy = true; err = '';
    try {
      const ref = fb.db.collection('users').doc(user.uid), snap = await ref.get(), remote = snap.exists ? snap.data() : null;
      if (remote && remote.rev !== meta.base) {
        const mine = meta.dirty && S.profile.ready;
        if (!mine || confirm('В облаке есть более новые данные с другого устройства.\n\nОК: загрузить их из облака.\nОтмена: оставить данные этого устройства и перезаписать облако.')) await pull(ref, remote); else await push(ref, remote);
      } else if (S.profile.ready && (meta.dirty || !remote)) await push(ref, remote);
      else meta.at = Date.now();
      saveMeta(); if (manual) toast('Синхронизировано');
    } catch (e) { err = e && e.name === 'OperationError' ? 'неверный пароль шифрования' : 'ошибка синхронизации'; if (manual) toast('Не удалось: ' + err); }
    busy = false; render();
  }
  async function submit(fd) {
    const email = fd.get('email').trim(), pass = fd.get('pass'), create = fd.get('mode') === 'new';
    if (!/.+@.+\..+/.test(email)) return toast('Проверьте почту'); if (pass.length < 8) return toast('Пароль от 8 символов');
    if (create && pass !== fd.get('pass2')) return toast('Пароли не совпадают');
    toast('Подключаюсь…');
    try {
      const d = await derive(email, pass);
      if (create) await fb.auth.createUserWithEmailAndPassword(email, d.secret); else await fb.auth.signInWithEmailAndPassword(email, d.secret);
      key = d.key; DB.set('cloudKey', key); meta = { base: 0, dirty: S.profile.ready, up: {}, at: 0 }; saveMeta(); user = fb.auth.currentUser;
      closeSheet(); await sync(true);
    } catch (e) {
      const c = (e && e.code) || '';
      toast(c.includes('email-already') ? 'Такой аккаунт уже есть' : /wrong-password|invalid-credential|user-not-found/.test(c) ? 'Неверная почта или пароль' : c.includes('network') ? 'Нет интернета' : c.includes('operation-not-allowed') || c.includes('admin-restricted') ? 'Регистрация закрыта' : 'Не удалось войти');
    }
  }
  async function signOut() { if (meta.dirty && !confirm('Есть изменения, которые ещё не ушли в облако. Всё равно выйти?')) return; await fb.auth.signOut(); key = null; DB.set('cloudKey', null); closeSheet(); render(); toast('Вы вышли. Данные остались на устройстве'); }

  function status() {
    if (!cfg()) return 'не подключено';
    if (!fb) return err || 'загрузка…';
    if (!user || !key) return 'вход не выполнен';
    if (err) return err;
    if (busy) return 'синхронизация…';
    if (meta.dirty) return 'есть изменения, ждут отправки';
    return meta.at ? 'сохранено в ' + new Date(meta.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'подключено';
  }
  function sheetCloud() {
    if (!cfg() || !fb) return sheet(`<h2>Облако</h2><div class="card"><p>${cfg() ? 'Не удалось связаться с облаком. Проверьте интернет и откройте приложение заново.' : 'Облако ещё не подключено. Данные хранятся только на этом устройстве, поэтому делайте резервные копии.'}</p></div><button class="btn ghost" style="margin-top:14px" data-a="closeSheet">Понятно</button>`);
    if (user && key) return sheet(`<h2>Облако</h2><div class="card"><div class="kv"><span>Аккаунт</span><b>${esc(user.email)}</b></div><div class="kv"><span>Состояние</span><b>${status()}</b></div><div class="kv"><span>Защита</span><b>шифрование на устройстве</b></div></div>
      <button class="btn" style="margin-top:16px" data-a="cloudSync">Синхронизировать сейчас</button><button class="btn danger" style="margin-top:10px" data-a="cloudOut">Выйти</button>`);
    sheet(`<h2>Облако</h2><p style="color:var(--muted);margin-top:-6px">Данные шифруются паролем прямо на телефоне. Если забыть пароль, открыть облачную копию не сможет никто, поэтому сохраните его в надёжном месте.</p>
    <form data-form="cloud" data-mode="in"><div data-c="cloudMode">${radio('mode', [['in', 'Войти'], ['new', 'Новый аккаунт']], 'in')}</div>
      <label class="f"><span>Почта</span><input type="text" inputmode="email" name="email" autocomplete="username" autocapitalize="off"></label>
      <label class="f"><span>Пароль</span><input type="password" name="pass" autocomplete="current-password"></label>
      <label class="f f-new"><span>Пароль ещё раз</span><input type="password" name="pass2" autocomplete="new-password"></label>
      <button class="btn" style="margin-top:18px">Продолжить</button></form>`);
  }
  document.addEventListener('change', e => { const f = e.target.closest('form[data-form=cloud]'); if (f && e.target.name === 'mode') f.dataset.mode = e.target.value; });
  return { init, touch, status, _t: { derive, seal, unseal } };
})();
