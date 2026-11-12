/*!
 * bs6-custom-ui — Bootstrap 6 için özel select, tarih seçici ve kaydırma çubuğu (MIT)
 *
 * Tek paket, bağımlılık yok. Üç bileşen birlikte çalışır:
 *   - CustomSelect     : arama, çoklu seçim (tek satır + "+N"), gruplar, mobilde alttan açılan sayfa
 *   - CustomDatePicker : tek / aralık / çoklu tarih, min-max, dil, mobil sayfa
 *   - CustomScrollbar  : kaydırma çubuğu (select menüsünde otomatik kullanılır)
 * ve Bootstrap 6'nın form-floating / form-adorn / form-control / dialog yapılarına uyum katmanı.
 *
 * Kullanım (en kısa yol): <select data-bs-ui>, <input data-bs-ui>, <div data-bs-ui>  — hepsi bu.
 */
import CustomScrollbar from './scrollbar.cjs';
import CustomSelect from './select.cjs';
import CustomDatePicker from './datepicker.cjs';
import SelectScrollbar from './select-scrollbar.cjs';
import Bootstrap6Compat from './bs6.cjs';

export const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev';

var hasDOM = typeof document !== 'undefined';

// Bileşenleri birbirine tanıt (global değişken gerekmez) ve Bootstrap 6 uyumunu kur
SelectScrollbar.use({ CustomSelect: CustomSelect, CustomScrollbar: CustomScrollbar });
Bootstrap6Compat.install({ CustomSelect: CustomSelect, CustomDatePicker: CustomDatePicker });

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */
function toArray(l) { return Array.prototype.slice.call(l || []); }

function warn(err) {
  if (typeof console !== 'undefined' && console.warn) console.warn('[bs6-custom-ui]', err && err.message ? err.message : err);
}

// Seçici | eleman | eleman listesi → eleman dizisi
function nodesOf(target, root) {
  if (!hasDOM || target == null) return [];
  if (typeof target === 'string') return toArray((root || document).querySelectorAll(target));
  if (target.nodeType === 1) return [target];
  return toArray(target).filter(function (n) { return n && n.nodeType === 1; });
}

// Tek bir elemanın başlatılması diğerlerini engellemesin
function each(nodes, fn) {
  var out = [];
  nodes.forEach(function (n) {
    try { var r = fn(n); if (r) out.push(r); } catch (e) { warn(e); }
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Bileşen başlatıcıları                                               */
/* ------------------------------------------------------------------ */

/**
 * <select> elemanlarını başlatır. Menüde özel kaydırma çubuğu varsayılan olarak açıktır.
 * @param {string|Element|Element[]} target
 * @param {object} [options]            CustomSelect seçenekleri
 * @param {object|false} [scrollbarOptions]  CustomScrollbar seçenekleri; false: yerel çubuk
 * @returns {CustomSelect[]}
 */
export function select(target, options, scrollbarOptions) {
  return each(nodesOf(target).filter(function (n) { return n.tagName === 'SELECT'; }), function (el) {
    var cs = CustomSelect.getInstance(el) || new CustomSelect(el, options);
    var off = scrollbarOptions === false || el.getAttribute('data-bs-scrollbar') === 'false';
    if (!off && !cs.scrollbar) SelectScrollbar.attach(cs, scrollbarOptions || undefined);
    return cs;
  });
}

/** <input> (açılır takvim) ya da <div> (satır içi takvim) başlatır. */
export function datepicker(target, options) {
  return each(nodesOf(target), function (el) { return new CustomDatePicker(el, options); });
}

/** Kaydırılabilir bir elemana özel çubuk ekler. */
export function scrollbar(target, options) {
  return each(nodesOf(target), function (el) { return new CustomScrollbar(el, options); });
}

/** Elemandaki (ya da seçicideki) bileşen örneğini döndürür; yoksa null. */
export function getInstance(target) {
  var el = nodesOf(target)[0];
  return (el && (el._cs || el._cdp || el._ccs)) || null;
}

/** Elemandaki bileşeni kaldırır, DOM'u eski haline getirir. Verilmezse tümü. */
export function destroy(target) {
  var nodes = target == null
    ? toArray(document.querySelectorAll('select.cs-native, .cdp-input, .cdp-inline, .ccs-host')).concat([document.documentElement])
    : nodesOf(target);
  nodes.forEach(function (el) {
    var inst = el._cs || el._cdp || el._ccs;
    if (inst && typeof inst.destroy === 'function') {
      try { inst.destroy(); } catch (e) { warn(e); }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Otomatik başlatma: data-bs-ui                                       */
/* ------------------------------------------------------------------ */
/*
 *   <select data-bs-ui>                      → select
 *   <input  data-bs-ui>                      → tarih seçici
 *   <div    data-bs-ui style="max-height:…"> → kaydırma çubuğu
 * Değer verilirse tür açıkça seçilir: data-bs-ui="select|datepicker|scrollbar". "false" atlar.
 * Seçenekler ilgili data-* özniteliklerinden okunur (bkz. README).
 */
export function init(root) {
  if (!hasDOM) return [];
  root = root || document;
  var found = [];
  if (root.nodeType === 1 && root.hasAttribute('data-bs-ui')) found.push(root);
  if (root.querySelectorAll) found = found.concat(toArray(root.querySelectorAll('[data-bs-ui]')));

  return each(found, function (el) {
    var kind = (el.getAttribute('data-bs-ui') || '').trim().toLowerCase();
    if (kind === 'false' || kind === 'off') return null;
    if (!kind) kind = el.tagName === 'SELECT' ? 'select' : el.tagName === 'INPUT' ? 'datepicker' : 'scrollbar';
    var existing = getInstance(el), inst;
    if (kind === 'select') inst = select(el)[0];
    else if (kind === 'datepicker' || kind === 'date') inst = datepicker(el)[0];
    else if (kind === 'scrollbar' || kind === 'scroll') inst = scrollbar(el)[0];
    else throw new TypeError('data-bs-ui değeri tanınmıyor: "' + kind + '"');
    // Otomatik başlatılanlar işaretlenir: DOM'dan kalıcı çıkarılırlarsa kendiliğinden sökülür (sızıntı olmasın).
    // Elle (select(), new CustomSelect…) başlatılanlara dokunulmaz.
    if (inst && !existing) el._bs6Auto = true;
    return inst;
  });
}

/* ---- Sonradan eklenen elemanlar (AJAX, modal içeriği, framework render'ı) ---- */
var mo = null;
var POPUP = /(^|\s)(cs-menu|cs-backdrop|cdp-popup|cdp-backdrop|ccs-track)(\s|$)/;

var removedQueue = [];
var removedTimer = 0;

// DOM'dan çıkarılan alt ağaçtaki otomatik başlatılmış bileşenleri sök. Çıkarma, yeniden taşıma (sürükle-bırak,
// sıralama) olabilir; bu yüzden bir sonraki göreve ertelenir ve yalnızca hâlâ bağlı olmayanlar sökülür.
function flushRemoved() {
  removedTimer = 0;
  var nodes = removedQueue;
  removedQueue = [];
  nodes.forEach(function (n) {
    if (n.isConnected) return;
    var els = [n].concat(toArray(n.querySelectorAll('[data-bs-ui], select, input, .ccs-host, .cdp-inline')));
    els.forEach(function (el) {
      if (!el._bs6Auto || el.isConnected) return;
      var inst = el._cs || el._cdp || el._ccs;
      el._bs6Auto = false;
      if (inst && typeof inst.destroy === 'function') {
        try { inst.destroy(); } catch (e) { warn(e); }
      }
    });
  });
}

function scanAdded(records) {
  for (var i = 0; i < records.length; i++) {
    var gone = records[i].removedNodes;
    for (var k = 0; k < gone.length; k++) {
      var rn = gone[k];
      if (rn.nodeType !== 1 || (typeof rn.className === 'string' && POPUP.test(rn.className))) continue;
      removedQueue.push(rn);
      if (!removedTimer) removedTimer = setTimeout(flushRemoved, 0);
    }
    var added = records[i].addedNodes;
    for (var j = 0; j < added.length; j++) {
      var n = added[j];
      if (n.nodeType !== 1) continue;
      // Eklentilerin kendi açılır menü / takvim düğümlerini taramaya gerek yok (her açılışta eklenir)
      if (typeof n.className === 'string' && POPUP.test(n.className)) continue;
      init(n);
    }
  }
}

/** Sonradan DOM'a eklenen [data-bs-ui] elemanlarını otomatik başlatmayı açar / kapatır. */
export function observe(on) {
  if (!hasDOM || typeof MutationObserver === 'undefined') return;
  if (on === false) {
    if (mo) { mo.disconnect(); mo = null; }
    return;
  }
  if (mo) return;
  mo = new MutationObserver(scanAdded);
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

/* ------------------------------------------------------------------ */
/* Ayarlar ve başlangıç                                                */
/* ------------------------------------------------------------------ */
var settings = { auto: true, observe: true };

/**
 * Genel ayarlar. Yükleme sırasında etkili olması için script'ten önce:
 *   <html data-bs-ui-auto="false">   ya da   window.BS6UI_CONFIG = { auto: false }
 */
export function config(options) {
  if (options) {
    for (var k in options) if (Object.prototype.hasOwnProperty.call(options, k)) settings[k] = options[k];
    if (hasDOM && settings.observe === false) observe(false);
  }
  return { auto: settings.auto, observe: settings.observe };
}

function start() {
  if (!settings.auto) return;
  init(document);
  if (settings.observe) observe(true);
}

if (hasDOM) {
  var pre = typeof window !== 'undefined' ? window.BS6UI_CONFIG : null;
  if (pre && typeof pre === 'object') config(pre);
  if (document.documentElement.getAttribute('data-bs-ui-auto') === 'false') settings.auto = false;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

/* ------------------------------------------------------------------ */
/* Ham sınıflar (gelişmiş kullanım)                                    */
/* ------------------------------------------------------------------ */
export { CustomSelect, CustomDatePicker, CustomScrollbar, SelectScrollbar };
