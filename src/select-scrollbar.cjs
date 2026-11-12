/*!
 * CustomSelectScrollbar 1.0 (MIT) — CustomSelect + CustomScrollbar köprüsü
 *
 * İki eklentiyi (orijinal dosyalara dokunmadan) birlikte kullanmayı sağlar:
 * açılır menüdeki seçenek listesi özel kaydırma çubuğuyla kaydırılır.
 *
 *   <link rel="stylesheet" href="custom-select.css">
 *   <link rel="stylesheet" href="custom-scrollbar.css">
 *   <link rel="stylesheet" href="custom-select-scrollbar.css">
 *   <script src="custom-select.js"></script>
 *   <script src="custom-scrollbar.js"></script>
 *   <script src="custom-select-scrollbar.js"></script>
 *
 *   CustomSelectScrollbar.init('#sehir', { clearable: true }, { shadows: true });
 *   CustomSelectScrollbar.attach(mevcutCustomSelectNesnesi);
 *   <select data-cs-scrollbar data-cs-scrollbar-auto-hide="scroll">…</select>   (otomatik)
 *
 * Neden ayrı bir köprü gerekiyor?
 *  1) CustomScrollbar, elemanın çocuklarını kendi iç kapsayıcısına taşır; CustomSelect ise
 *     her yenilemede `list.textContent = ''` yapar. Çubuk doğrudan `.cs-list` üstüne kurulursa
 *     yenileme çubuğun iskeletini siler. Bu yüzden `.cs-list` bir sarmalayıcının (.cs-scroll)
 *     İÇİNE alınır ve çubuk sarmalayıcıya kurulur; `.cs-list` yalnızca içerik olur.
 *  2) Menü <body>'ye açılışta eklenip kapanışta çıkarılır. Çubuk, menü DOM'dayken ölçülmeli;
 *     her açılışta (`cs:open`) eşzamanlı olarak güncellenir.
 *  3) CustomSelect'in `list.scrollTop` ve `_reveal()` (klavyeyle gezinirken aktif öğeyi
 *     görünür kılma) çağrıları artık kaydırmayan `.cs-list` yerine gerçek kaydırıcıya yönlenir.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CustomSelectScrollbar = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var hasDOM = typeof document !== 'undefined';

  // Açılır menü için uygun CustomScrollbar varsayılanları (hepsi geçersiz kılınabilir)
  var DEFAULTS = {
    axis: 'y',          // menüde yatay kaydırma yok; ayrıca ayrık (DOM'da olmayan) eleman ölçülemez
    autoHide: false,    // liste kaydırılabilir olduğunda çubuk hep görünsün
    shadows: true,      // kenarlarda "devamı var" solması
    focusable: false,   // odak zaten arama kutusunda / tetikleyicide; kaydırıcı Tab durağı olmasın
    thumbMin: 28
  };

  // <select data-cs-scrollbar-auto-hide="…"> gibi öznitelikler
  var BOOL_KEYS = ['shadows', 'focusable', 'clickScroll', 'smooth'];
  var NUM_KEYS = ['autoHideDelay', 'thumbMin'];
  var DATA_KEYS = ['autoHide', 'autoHideDelay', 'size', 'shadows', 'thumbMin', 'clickScroll', 'smooth', 'className'];

  function toArray(l) { return Array.prototype.slice.call(l || []); }

  function extend(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== undefined) t[k] = s[k];
    }
    return t;
  }

  function readData(el) {
    var out = {};
    DATA_KEYS.forEach(function (key) {
      var raw = el.dataset ? el.dataset['csScrollbar' + key.charAt(0).toUpperCase() + key.slice(1)] : undefined;
      if (raw === undefined) return;
      if (key === 'autoHide') out[key] = raw === 'false' ? false : raw === 'true' || raw === '' ? true : raw;
      else if (BOOL_KEYS.indexOf(key) > -1) out[key] = raw !== 'false';
      else if (NUM_KEYS.indexOf(key) > -1) { var n = Number(raw); if (!isNaN(n)) out[key] = n; }
      else out[key] = raw;
    });
    return out;
  }

  // Bağımlılıklar: paket içinde use() ile verilir; tek başına kullanımda window global'leri aranır
  var deps = {};
  function use(d) { extend(deps, d); }

  function libs() {
    var g = typeof window !== 'undefined' ? window : root;
    var CS = deps.CustomSelect || (g && g.CustomSelect), SB = deps.CustomScrollbar || (g && g.CustomScrollbar);
    if (!CS) throw new ReferenceError('CustomSelectScrollbar: CustomSelect bulunamadı.');
    if (!SB) throw new ReferenceError('CustomSelectScrollbar: CustomScrollbar bulunamadı.');
    return { CustomSelect: CS, CustomScrollbar: SB };
  }

  // <select>, seçici ya da CustomSelect nesnesinden CustomSelect nesnesi üretir
  function resolve(target, selectOptions) {
    var g = libs(), CS = g.CustomSelect;
    if (typeof target === 'string') target = document.querySelector(target);
    if (target instanceof CS) return target;
    if (target && target.tagName === 'SELECT') return CS.getInstance(target) || new CS(target, selectOptions);
    throw new TypeError('CustomSelectScrollbar: bir <select>, seçici ya da CustomSelect nesnesi gerekli.');
  }

  /* ---------------------------------------------------------------- */
  /* Bağla / ayır                                                      */
  /* ---------------------------------------------------------------- */
  function attach(target, options) {
    var cs = resolve(target);
    if (cs.scrollbar) {
      if (options) cs.scrollbar.setOptions(options);
      return cs.scrollbar;
    }
    var SB = libs().CustomScrollbar;
    var list = cs.list, menu = cs.menu;

    // .cs-list → .cs-scroll içine; çubuk sarmalayıcıya kurulur (bkz. dosya başı, 1. madde)
    var host = document.createElement('div');
    host.className = 'cs-scroll';
    menu.insertBefore(host, list);
    host.appendChild(list);

    var sb;
    try {
      sb = new SB(host, extend({}, DEFAULTS, readData(cs.el), options));
    } catch (err) {
      menu.insertBefore(list, host);
      menu.removeChild(host);
      throw err;
    }
    var vp = sb.vp;

    // CustomSelect `this.list.scrollTop = 0` yazar (açılışta başa sar): gerçek kaydırıcıya yönlendir
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      get: function () { return vp.scrollTop; },
      set: function (v) { vp.scrollTop = v; }
    });

    // Klavyeyle gezinirken aktif öğeyi görünür kıl. Orijinaldeki mantığın aynısı; tek fark,
    // kenar solmaları (shadows) açıkken öğenin solmanın altında kalmaması için pay bırakılır.
    cs._reveal = function (node) {
      var pad = sb.o.shadows ? 18 : 4;
      var lr = vp.getBoundingClientRect();
      var top = node;
      if (!node.previousElementSibling && node.parentNode && node.parentNode.classList.contains('cs-group')) {
        top = node.parentNode; // grup başlığıyla birlikte göster
      }
      var tr = top.getBoundingClientRect(), nr = node.getBoundingClientRect();
      if (tr.top < lr.top + pad) vp.scrollTop -= lr.top + pad - tr.top;
      else if (nr.bottom > lr.bottom - pad) vp.scrollTop += nr.bottom - (lr.bottom - pad);
    };

    // Menü her açılışta DOM'a yeniden eklenir; çubuğu hemen ölç (bir kare gecikme olmasın)
    function onOpen() { sb.update(true); }
    cs.el.addEventListener('cs:open', onOpen);

    var origDestroy = cs.destroy;
    cs.destroy = function () {
      detach(cs);
      return origDestroy.apply(cs, arguments);
    };

    cs.scrollbar = sb;
    cs._csb = { host: host, onOpen: onOpen };
    return sb;
  }

  function detach(target) {
    var cs = resolve(target);
    var state = cs._csb;
    if (!state) return cs;
    cs.el.removeEventListener('cs:open', state.onOpen);
    cs.scrollbar.destroy(); // listeyi sarmalayıcıya geri taşır
    delete cs.list.scrollTop;
    delete cs._reveal;
    delete cs.destroy;
    delete cs.scrollbar;
    delete cs._csb;
    cs.menu.insertBefore(cs.list, state.host);
    cs.menu.removeChild(state.host);
    return cs;
  }

  /* ---------------------------------------------------------------- */
  /* Toplu başlatma                                                    */
  /* ---------------------------------------------------------------- */
  // CustomSelectScrollbar.init(hedef, selectSeçenekleri, çubukSeçenekleri) → CustomSelect[]
  function init(target, selectOptions, scrollbarOptions) {
    if (!hasDOM) return [];
    var nodes;
    if (typeof target === 'string') nodes = toArray(document.querySelectorAll(target));
    else if (target && target.nodeType === 1) nodes = [target];
    else nodes = toArray(target);
    var out = [];
    nodes.forEach(function (n) {
      if (!n || n.tagName !== 'SELECT') return;
      var cs = resolve(n, selectOptions);
      attach(cs, scrollbarOptions);
      out.push(cs);
    });
    return out;
  }

  // <select data-cs-scrollbar> elemanlarını otomatik başlatır
  function autoInit(scope) {
    if (!hasDOM) return [];
    var out = [];
    toArray((scope || document).querySelectorAll('select[data-cs-scrollbar]')).forEach(function (s) {
      if (s.getAttribute('data-cs-scrollbar') === 'false') return;
      try { out.push(attach(resolve(s))); }
      catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn(e.message); }
    });
    return out;
  }

  return {
    version: '1.0.0',
    defaults: DEFAULTS,
    use: use,
    attach: attach,
    detach: detach,
    init: init,
    autoInit: autoInit
  };
});
