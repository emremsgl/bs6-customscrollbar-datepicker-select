// Derlenmiş paket (dist/) üzerinde duman testleri. Çalıştırma: npm run build && npm test
// jsdom yerleşim (layout) hesaplamaz; bu testler yaşam döngüsünü, DOM yapısını, olayları ve
// hata yalıtımını doğrular. Görsel/ölçüm davranışı için examples/ sayfasına bakın.
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { createEnv } from './_env.mjs';

let UI, win, doc, root;

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const html = (s) => { doc.body.innerHTML = s; };

before(async () => { ({ UI, win, doc, root } = await createEnv()); });

beforeEach(() => { UI.observe(false); html(''); });

/* ------------------------------------------------------------------ */
test('dışa aktarılan API eksiksiz', () => {
  assert.match(UI.version, /^\d+\.\d+\.\d+/);
  for (const fn of ['select', 'datepicker', 'scrollbar', 'init', 'observe', 'config', 'getInstance', 'destroy']) {
    assert.equal(typeof UI[fn], 'function', fn);
  }
  for (const cls of ['CustomSelect', 'CustomDatePicker', 'CustomScrollbar', 'SelectScrollbar']) assert.ok(UI[cls], cls);
});

/* ------------------------------------------------------------------ */
test('select: yaşam döngüsü, değer ve olaylar', () => {
  html('<label for="s">Şehir</label><select id="s"><option value="">Seçin</option><option value="a">A</option><option value="b">B</option></select>');
  const el = doc.getElementById('s');
  const [cs] = UI.select(el);
  assert.ok(cs, 'örnek oluştu');
  assert.ok(el.classList.contains('cs-native'), 'yerel select gizlendi');
  assert.ok(doc.querySelector('.cs-select'), 'sarmalayıcı eklendi');
  assert.equal(UI.select(el)[0], cs, 'ikinci çağrı aynı örneği döndürür (idempotent)');
  assert.equal(UI.getInstance(el), cs);

  let changes = 0;
  el.addEventListener('change', () => changes++);
  cs.setValue('b', true);
  assert.equal(el.value, 'b');
  assert.equal(cs.getValue(), 'b');
  assert.equal(changes, 1, 'change olayı bir kez tetiklendi');
  cs.setValue('a'); // emit yok
  assert.equal(changes, 1);
  cs.clear(true);
  assert.equal(el.value, '');

  cs.destroy();
  assert.ok(!doc.querySelector('.cs-select'), 'sarmalayıcı kaldırıldı');
  assert.ok(!el.classList.contains('cs-native'));
  assert.equal(UI.getInstance(el), null);
});

test('select: çoklu seçim, tümünü seç, maxChips, fitChips kapalı', () => {
  html('<select id="m" multiple><option>A</option><option>B</option><option>C</option><option>D</option></select>');
  const el = doc.getElementById('m');
  const [cs] = UI.select(el, { maxChips: 2 });
  cs.setValue(['A', 'B', 'C'], true);
  assert.deepEqual(cs.getValue(), ['A', 'B', 'C']);
  // yerleşim yok (genişlik 0): tüm etiketler eklenir, fazlası "+N" rozetinde olur
  const chips = cs.valueBox.querySelectorAll('.cs-chip:not(.cs-chip-more)');
  assert.equal(chips.length, 2);
  assert.equal(cs.valueBox.querySelector('.cs-chip-more').textContent, '+1');
  cs.selectAll();
  assert.equal(cs.getValue().length, 4);
  cs.clear(true);
  assert.deepEqual(cs.getValue(), []);

  html('<select id="m2" multiple><option>A</option><option selected>B</option></select>');
  const [off] = UI.select('#m2', { fitChips: false });
  assert.ok(!off.wrapper.classList.contains('cs-fit'));
  assert.equal(off.valueBox.querySelectorAll('.cs-chip').length, 1);
});

test('select: max seçim sınırı ve devre dışı seçenek', () => {
  html('<select id="m" multiple><option>A</option><option>B</option><option>C</option><option disabled>D</option></select>');
  const [cs] = UI.select('#m', { max: 2 });
  let hit = 0;
  doc.getElementById('m').addEventListener('cs:open', () => {});
  cs.o.onMax = () => hit++;
  cs.setValue(['A'], true);
  cs._toggleItem(cs.opts[1]);
  cs._toggleItem(cs.opts[2]); // sınır aşıldı
  assert.equal(cs.getValue().length, 2);
  assert.equal(hit, 1);
  cs._toggleItem(cs.opts[3]); // devre dışı
  assert.equal(cs.getValue().length, 2);
});

test('select: optgroup ve devre dışı select', () => {
  html('<select id="g"><optgroup label="G1"><option>A</option><option>B</option></optgroup><optgroup label="G2"><option>C</option></optgroup></select><select id="d" disabled><option>X</option></select>');
  const [g, d] = UI.select('#g, #d');
  assert.equal(g.menu.querySelectorAll('.cs-group').length, 2);
  assert.equal(g.menu.querySelectorAll('.cs-option').length, 3);
  assert.ok(d.wrapper.classList.contains('cs-disabled'));
  d.open();
  assert.equal(d.isOpen, false, 'devre dışı select açılmaz');
});

test('select: aç / kapat, tek açık menü, menü body içinde', () => {
  html('<select id="a"><option>1</option></select><select id="b"><option>2</option></select>');
  const [a, b] = UI.select('#a, #b');
  a.open();
  assert.equal(a.isOpen, true);
  assert.ok(doc.body.contains(a.menu));
  b.open();
  assert.equal(a.isOpen, false, 'yenisi açılınca öncekisi kapanır');
  assert.equal(b.isOpen, true);
  b.close();
  assert.ok(!doc.body.contains(b.menu), 'kapanınca menü DOM\'dan çıkar');
});

/* ------------------------------------------------------------------ */
test('select + çubuk köprüsü: varsayılan açık, kapatılabilir, temiz söküm', () => {
  html('<select id="a"><option>1</option></select><select id="b" data-bs-scrollbar="false"><option>1</option></select><select id="c"><option>1</option></select>');
  const [a, b, c] = [UI.select('#a')[0], UI.select('#b')[0], UI.select('#c', null, false)[0]];
  assert.ok(a.scrollbar, 'varsayılan: çubuk var');
  assert.ok(a.menu.querySelector('.cs-scroll'));
  assert.ok(!b.scrollbar, 'data-bs-scrollbar="false"');
  assert.ok(!c.scrollbar, 'üçüncü parametre false');
  a.destroy();
  assert.ok(!a.menu.querySelector('.cs-scroll'), 'söküm sonrası sarmalayıcı yok');
  assert.ok(a.menu.querySelector('.cs-list'), 'liste menüde kaldı');
});

/* ------------------------------------------------------------------ */
test('datepicker: tek, aralık, değer ve olaylar', () => {
  html('<input id="d" type="text"><input id="r" type="text">');
  const [dp] = UI.datepicker('#d', { format: 'yyyy-aa-gg' });
  dp.setValue('2025-07-14');
  assert.equal(doc.getElementById('d').value, '2025-07-14');
  const v = dp.getValue();
  assert.ok(v instanceof win.Date || v instanceof Date);
  assert.equal(v.getFullYear(), 2025);
  assert.equal(v.getMonth(), 6);
  assert.equal(v.getDate(), 14);

  const [rg] = UI.datepicker('#r', { mode: 'range' });
  rg.setValue(['2025-07-01', '2025-07-10']);
  assert.match(doc.getElementById('r').value, /01\.07\.2025.+10\.07\.2025/);
  rg.clear();
  assert.equal(doc.getElementById('r').value, '');
  dp.destroy(); rg.destroy();
  assert.equal(UI.getInstance('#d'), null);
});

test('datepicker: aç / kapat ve min-max', () => {
  html('<input id="d" type="text">');
  // jsdom yerleşim hesaplamaz; datepicker görünmeyen (kutusuz) girişi açmaz. Görünür gibi davranalım.
  doc.getElementById('d').getClientRects = () => [{ width: 1, height: 1 }];
  const [dp] = UI.datepicker('#d', { min: '2025-01-10', max: '2025-01-20' });
  dp.open();
  assert.equal(dp.isOpen, true);
  assert.ok(doc.body.contains(dp.pop));
  dp.close();
  assert.equal(dp.isOpen, false);
  assert.ok(!doc.body.contains(dp.pop));
});

/* ------------------------------------------------------------------ */
test('scrollbar: içeriği sarar, söküm DOM\'u geri verir', () => {
  html('<div id="s" style="max-height:50px;overflow:auto"><p>a</p><p>b</p></div>');
  const el = doc.getElementById('s');
  const [sb] = UI.scrollbar(el);
  assert.ok(sb);
  assert.ok(el.querySelector('.ccs-viewport .ccs-content'));
  assert.equal(el.querySelectorAll('.ccs-content > p').length, 2);
  sb.destroy();
  assert.equal(el.querySelectorAll('.ccs-viewport').length, 0);
  assert.equal(el.querySelectorAll(':scope > p').length, 2, 'çocuklar geri taşındı');
});

/* ------------------------------------------------------------------ */
test('init(): data-bs-ui türü etikete göre seçer, "false" atlar, hatalı değer diğerlerini bozmaz', () => {
  html(`
    <select id="s" data-bs-ui><option>1</option></select>
    <input id="d" data-bs-ui type="text">
    <div id="c" data-bs-ui style="overflow:auto"><p>x</p></div>
    <select id="x" data-bs-ui="false"><option>1</option></select>
    <select id="e" data-bs-ui="select" data-bs-scrollbar="false"><option>1</option></select>
    <div id="bad" data-bs-ui="nope"></div>
    <select id="ok" data-bs-ui="select"><option>1</option></select>`);
  const out = UI.init();
  assert.ok(UI.getInstance('#s')?.menu, 'select');
  assert.ok(UI.getInstance('#d')?.pop, 'datepicker');
  assert.ok(UI.getInstance('#c')?.vp, 'scrollbar');
  assert.equal(UI.getInstance('#x'), null, 'false atlandı');
  assert.ok(UI.getInstance('#e') && !UI.getInstance('#e').scrollbar, 'çubuksuz select');
  assert.equal(UI.getInstance('#bad'), null);
  assert.ok(UI.getInstance('#ok'), 'hatalı öğeden sonra gelenler de başlatıldı');
  assert.equal(out.length, 5);
  assert.equal(UI.init().length, 5, 'ikinci çağrı aynı örnekleri döndürür');
});

test('observe(): sonradan eklenen [data-bs-ui] otomatik başlatılır', async () => {
  UI.observe(true);
  const sel = doc.createElement('select');
  sel.setAttribute('data-bs-ui', '');
  sel.innerHTML = '<option>1</option>';
  const wrap = doc.createElement('div');
  wrap.innerHTML = '<input data-bs-ui id="late" type="text">';
  doc.body.append(sel, wrap);
  await tick(20);
  assert.ok(UI.getInstance(sel), 'doğrudan eklenen select');
  assert.ok(UI.getInstance('#late'), 'iç içe eklenen input');
  UI.observe(false);
  const sel2 = doc.createElement('select');
  sel2.setAttribute('data-bs-ui', '');
  doc.body.append(sel2);
  await tick(20);
  assert.equal(UI.getInstance(sel2), null, 'gözlemci kapalıyken başlatılmaz');
});

test('destroy(): tümünü söker', () => {
  html('<select id="s" data-bs-ui><option>1</option></select><input id="d" data-bs-ui type="text">');
  UI.init();
  UI.destroy();
  assert.equal(UI.getInstance('#s'), null);
  assert.equal(UI.getInstance('#d'), null);
  assert.ok(!doc.querySelector('.cs-select'));
});

/* ------------------------------------------------------------------ */
test('Bootstrap 6 uyumu: arama kutusu form-control, adorn etiketi erişilebilir ada karışmaz', () => {
  html(`<label for="a">Şehir</label>
        <label class="form-control form-adorn" id="w"><span class="form-adorn-icon" aria-hidden="true">i</span>
        <select id="a" class="form-ghost"><option value="">Seçin</option><option>A</option></select></label>`);
  const [cs] = UI.select('#a');
  assert.ok(cs.search.classList.contains('form-control'), 'arama kutusu form-control');
  const ids = (cs.trigger.getAttribute('aria-labelledby') || '').split(' ');
  assert.ok(!ids.includes('w'), 'adorn label ad hesabına katılmaz');
  assert.ok(ids.length >= 2);
  assert.doesNotThrow(() => { cs.open(); cs.close(); }, 'adorn içinde açma/kapama hatasız');
});

test('Bootstrap 6 uyumu: adorn içinde simgeye tıklayınca bileşen açılır, tekrar tıklayınca kapanır', () => {
  html('<label class="form-control form-adorn"><span class="form-adorn-icon" id="i">i</span><select id="a" class="form-ghost"><option>A</option></select></label>');
  const [cs] = UI.select('#a');
  const icon = doc.getElementById('i');
  const press = (t) => icon.dispatchEvent(new win.Event(t, { bubbles: true, cancelable: true }));
  press('pointerdown'); press('click');
  assert.equal(cs.isOpen, true);
  press('pointerdown'); // dışarı tıklama mantığı menüyü kapatır; ardından click yeniden açmamalı
  press('click');
  assert.equal(cs.isOpen, false);
});

/* ------------------------------------------------------------------ */
test('SSR: DOM yokken içe aktarmak ve çağırmak hata vermez', () => {
  const out = execFileSync(process.execPath, ['-e', `
    const u = require(${JSON.stringify(join(root, 'dist', 'bs6-custom-ui.cjs'))});
    const r = [u.select('#x'), u.datepicker('#x'), u.scrollbar('#x'), u.init()];
    console.log(JSON.stringify(r) + ' ' + typeof u.version);
  `], { encoding: 'utf8' });
  assert.equal(out.trim(), '[[],[],[],[]] string');
});
