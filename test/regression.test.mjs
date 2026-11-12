// Regresyon testleri: bağımsız kod incelemesinde bulunan ve düzeltilen kusurlar. Çalıştırma: npm test
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createEnv } from './_env.mjs';

let UI, win, doc;
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const html = (s) => { doc.body.innerHTML = s; };
// jsdom yerleşim hesaplamaz; takvim görünmeyen (kutusuz) girişi açmaz. Görünür gibi davranalım.
const visible = (el) => { el.getClientRects = () => [{ width: 1, height: 1 }]; return el; };
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };

before(async () => { ({ UI, win, doc } = await createEnv()); });
beforeEach(() => { UI.observe(false); html(''); doc.documentElement.style.overflow = ''; });

test('kaydırma kilidi: select ve takvim iç içe açılıp herhangi sırayla kapansa da sayfa kilidi kalmaz', () => {
  for (const order of ['select-first', 'date-first']) {
    html('<select id="s"><option>A</option></select><input id="d" type="text">');
    visible(doc.getElementById('d'));
    const [cs] = UI.select('#s', { sheet: true });
    const [dp] = UI.datepicker('#d', { sheet: true });
    cs.open(); dp.open();
    assert.equal(doc.documentElement.style.overflow, 'hidden', order + ': kilitli');
    if (order === 'select-first') { cs.close(); dp.close(); } else { dp.close(); cs.close(); }
    assert.equal(doc.documentElement.style.overflow, '', order + ': kilit kalktı');
    cs.destroy(); dp.destroy();
  }
});

test('kaydırma kilidi: sayfanın özgün overflow değeri geri yazılır', () => {
  html('<select id="s"><option>A</option></select>');
  doc.documentElement.style.overflow = 'scroll';
  const [cs] = UI.select('#s', { sheet: true });
  cs.open(); cs.close();
  assert.equal(doc.documentElement.style.overflow, 'scroll');
});

test('otomatik başlatılan bileşen DOM\'dan çıkarılınca sökülür; elle başlatılan ve taşınan korunur', async () => {
  UI.observe(true);
  html('<div id="box"><select id="auto" data-bs-ui><option>1</option></select></div><select id="manual"><option>1</option></select>');
  await tick(20);
  const auto = doc.getElementById('auto'), manual = doc.getElementById('manual');
  assert.ok(UI.getInstance(auto));
  UI.select(manual);
  doc.getElementById('box').remove();
  manual.remove();
  await tick(30);
  assert.equal(UI.getInstance(auto), null, 'otomatik: sökülür (sızıntı yok)');
  assert.ok(!auto.classList.contains('cs-native'), 'özgün işaretleme geri geldi');
  assert.ok(UI.getInstance(manual), 'elle başlatılana dokunulmaz');

  // aynı tick içinde yeniden taşıma (sıralama / sürükle-bırak) sökmemeli
  html('<div id="a"><select id="mv" data-bs-ui><option>1</option></select></div><div id="b"></div>');
  await tick(20);
  const mv = doc.getElementById('mv');
  const inst = UI.getInstance(mv);
  doc.getElementById('b').appendChild(mv);
  await tick(30);
  assert.equal(UI.getInstance(mv), inst, 'taşınan bileşen aynı örnek olarak kalır');

  // sökülüp tekrar eklenirse yeniden başlatılır
  doc.getElementById('b').remove();
  await tick(30);
  assert.equal(UI.getInstance(mv), null);
  doc.body.appendChild(mv);
  await tick(30);
  assert.ok(UI.getInstance(mv), 'yeniden eklenince yeniden başlatıldı');
});

test('kurucu yarıda hata verirse <select> / <input> gizli ya da bozuk kalmaz', () => {
  html('<select id="s"><option>1</option></select><input id="d" type="text">');
  const proto = UI.CustomSelect.prototype, dproto = UI.CustomDatePicker.prototype;
  const origRefresh = proto.refresh, origInit = dproto._init;
  try {
    proto.refresh = function () { throw new Error('boom'); };
    assert.deepEqual(quiet(() => UI.select('#s')), [], 'hata yutuldu, diğer elemanlar etkilenmez');
    const s = doc.getElementById('s');
    assert.ok(!s.classList.contains('cs-native'), 'select yeniden görünür');
    assert.equal(doc.querySelectorAll('.cs-select').length, 0, 'artık sarmalayıcı yok');
    assert.equal(UI.getInstance(s), null);

    dproto._init = function () { throw new Error('boom'); };
    assert.deepEqual(quiet(() => UI.datepicker('#d')), []);
    const d = doc.getElementById('d');
    assert.ok(!d.classList.contains('cdp-input'));
    assert.ok(!d.hasAttribute('role'));
  } finally {
    proto.refresh = origRefresh;
    dproto._init = origInit;
  }
  assert.equal(UI.select('#s').length, 1, 'sonra normal başlatma çalışır');
  assert.equal(doc.querySelectorAll('.cs-select').length, 1);
});

test('iconRenderer hata fırlatırsa eklenti çalışmaya devam eder', () => {
  html('<select id="s"><option value="a">A</option></select>');
  const [cs] = quiet(() => UI.select('#s', { iconRenderer: () => { throw new Error('x'); } }));
  assert.ok(cs, 'başlatıldı');
  assert.equal(doc.querySelectorAll('.cs-select').length, 1);
});

test('başlatılmış işaretlemenin kopyası (cloneNode) çift arayüz üretmez', () => {
  html('<div id="row"><select id="s" data-bs-ui><option>1</option></select><input id="d" type="text" data-bs-ui><div id="sc" data-bs-ui="scrollbar" style="overflow:auto"><p>x</p></div></div>');
  UI.init();
  const clone = doc.getElementById('row').cloneNode(true);
  clone.id = 'row2';
  for (const e of clone.querySelectorAll('[id]')) e.id += '-2';
  doc.body.appendChild(clone);
  UI.init(clone);
  assert.equal(clone.querySelectorAll('.cs-select').length, 1, 'tek select arayüzü');
  assert.equal(clone.querySelectorAll('.ccs-viewport').length, 1, 'tek kaydırma görünüm alanı');
  assert.equal(clone.querySelectorAll('.ccs-content > p').length, 1, 'içerik çoğalmadı');
  const s2 = clone.querySelector('select');
  UI.destroy(s2);
  assert.ok(!s2.hasAttribute('aria-hidden') && !s2.hasAttribute('tabindex'), 'söküm sonrası eklenti nitelikleri kalmaz');
  const d2 = clone.querySelector('input');
  UI.destroy(d2);
  assert.ok(!d2.hasAttribute('role') && !d2.classList.contains('cdp-input'));
});

test('<select> class / aria-invalid değişimi listeyi yeniden kurmaz (kaydırma ve aktif öğe korunur)', async () => {
  html('<select id="s"><option>A</option><option>B</option><option>C</option></select>');
  const el = doc.getElementById('s');
  const [cs] = UI.select(el);
  cs.open();
  const first = cs.list.querySelector('.cs-option');
  el.classList.add('is-invalid');
  el.setAttribute('aria-invalid', 'true');
  await tick(10);
  assert.ok(cs.wrapper.classList.contains('cs-invalid'), 'görsel durum güncellendi');
  assert.equal(cs.list.querySelector('.cs-option'), first, 'liste düğümleri aynı: yeniden kurulmadı');
  el.add(new win.Option('D'));
  await tick(10);
  assert.notEqual(cs.list.querySelector('.cs-option'), first, 'seçenek eklenince liste yenilenir');
  assert.equal(cs.list.querySelectorAll('.cs-option').length, 4);
});

test('olay üretmeden atanan el.value açılışta arayüze yansır', () => {
  html('<select id="s"><option value="">Seçin</option><option value="b">Bravo</option></select>');
  const el = doc.getElementById('s');
  const [cs] = UI.select(el);
  el.value = 'b'; // framework / betik ataması: change olayı yok, DOM mutasyonu yok
  cs.open();
  assert.match(cs.valueBox.textContent, /Bravo/);
  assert.ok(cs.menu.querySelector('.cs-option.cs-selected'));
});

test('takvim açılınca odak girdiye gider (düğme / adorn ile açılsa da klavye çalışır)', () => {
  html('<input id="d" type="text"><button id="b" type="button">aç</button>');
  const input = visible(doc.getElementById('d'));
  const [dp] = UI.datepicker(input);
  doc.getElementById('b').focus();
  dp.open();
  assert.equal(doc.activeElement, input);
});

test('adorn içindeki düğme tıklaması iptal edilmez ve bileşeni açmaz; simge tıklaması açar', () => {
  html('<label class="form-control form-adorn"><button id="btn" type="button">x</button><span id="ic">i</span><select id="a" class="form-ghost"><option>A</option></select></label>');
  const [cs] = UI.select('#a');
  const click = (el) => {
    el.dispatchEvent(new win.Event('pointerdown', { bubbles: true }));
    const ev = new win.MouseEvent('click', { bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    return ev;
  };
  const ev = click(doc.getElementById('btn'));
  assert.equal(ev.defaultPrevented, false, 'düğmenin varsayılan davranışı korundu');
  assert.equal(cs.isOpen, false);
  const ev2 = click(doc.getElementById('ic'));
  assert.equal(ev2.defaultPrevented, true);
  assert.equal(cs.isOpen, true, 'simge tıklaması hâlâ açar');
});

test('select metinleri <html lang>\'e göre yerelleşir; verilen / değiştirilen varsayılanlar korunur', () => {
  const texts = (lang, opts) => {
    doc.documentElement.lang = lang;
    html('<select id="s" multiple><option value="a">A</option></select>');
    const [cs] = UI.select('#s', opts);
    const t = { ph: cs.valueBox.textContent, search: cs.search.getAttribute('placeholder'), done: cs.doneBtn.textContent, none: cs.empty.textContent };
    cs.destroy();
    return t;
  };
  try {
    assert.deepEqual(texts('en', {}), { ph: 'Select an option', search: 'Search...', done: 'Done', none: 'No results found' });
    assert.deepEqual(texts('tr-TR', {}), { ph: 'Seçim yapın', search: 'Ara...', done: 'Tamam', none: 'Sonuç bulunamadı' });
    assert.equal(texts('de', {}).search, 'Search...', 'bilinmeyen dil: İngilizce');
    assert.equal(texts('tr', { searchPlaceholder: 'Bul' }).search, 'Bul', 'seçenek önceliklidir');
    assert.equal(texts('en', { locale: 'tr' }).search, 'Ara...', 'locale seçeneği <html lang>\'i geçer');
    const prev = UI.CustomSelect.defaults.searchPlaceholder;
    UI.CustomSelect.defaults.searchPlaceholder = 'Özel';
    assert.equal(texts('tr', {}).search, 'Özel', 'değiştirilen genel varsayılan korunur');
    UI.CustomSelect.defaults.searchPlaceholder = prev;
  } finally { doc.documentElement.lang = 'tr'; }
});
