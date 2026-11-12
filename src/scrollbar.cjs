/*!
 * CustomScrollbar 1.0 (MIT)
 * Bağımlılık yok. Bootstrap, Tailwind, Bulma ve düz HTML ile birlikte çalışır.
 *
 * Gerçek kaydırma tarayıcıda kalır (dokunma, momentum, klavye, "sayfada ara", odak
 * kaydırma, scroll-snap bozulmaz); yalnızca yerel çubuk gizlenir ve üstüne özel çubuk çizilir.
 *
 *   new CustomScrollbar('#liste', { shadows: true });
 *   CustomScrollbar.init('.js-scroll');
 *   <div data-scrollbar style="max-height:300px">…</div>     (otomatik başlatma)
 *   CustomScrollbar.page();                                   (sayfa kaydırma çubuğu)
 *
 * NOT: Eleman başlatılırken çocukları bir iç kapsayıcıya (.ccs-content) taşınır.
 * Dinamik içeriği `instance.content` içine ekleyin (doğrudan eleman içine eklenen
 * düğümler de otomatik taşınır).
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CustomScrollbar = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var hasDOM = typeof document !== 'undefined';

  var DEFAULTS = {
    axis: null,            // 'y' | 'x' | 'xy' (null: elemanın CSS overflow değerinden; sayfada 'y')
    autoHide: true,        // true | 'scroll' | 'hover' | false (her zaman görünür)
    autoHideDelay: 900,    // ms
    size: null,            // 'sm' | 'lg' | null
    shadows: false,        // kenarlarda "devamı var" gölgeleri
    gutter: false,         // dikey çubuk için içerikten yer ayır (üstüne binmesin)
    focusable: true,       // kaydırılabilir alana klavye odağı ver (WCAG)
    clickScroll: true,     // yola tıklayınca sayfa sayfa kaydır
    smooth: true,          // yola tıklamada yumuşak kaydırma
    thumbMin: 32,          // tutamaç en küçük uzunluğu (px)
    className: '',         // kök elemana ek sınıflar
    onScroll: null,        // function(info, instance)
    onUpdate: null         // function(info, instance)
  };
  var BOOL_KEYS = ['autoHide', 'shadows', 'gutter', 'focusable', 'clickScroll', 'smooth'];
  var NUM_KEYS = ['autoHideDelay', 'thumbMin'];

  // Düzen (layout) bu özelliklerle tanımlandığından iç kapsayıcıya kopyalanır
  var LAYOUT_PROPS = ['flexDirection', 'flexWrap', 'alignItems', 'alignContent', 'justifyContent',
    'justifyItems', 'rowGap', 'columnGap', 'gridTemplateColumns', 'gridTemplateRows',
    'gridTemplateAreas', 'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
  var VIEWPORT_PROPS = ['scrollSnapType', 'scrollBehavior', 'overscrollBehavior', 'scrollPaddingTop',
    'scrollPaddingRight', 'scrollPaddingBottom', 'scrollPaddingLeft'];

  /* ---------------------------------------------------------------- */
  /* Yardımcılar                                                       */
  /* ---------------------------------------------------------------- */
  function toArray(l) { return Array.prototype.slice.call(l || []); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function extend(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== undefined) t[k] = s[k];
    }
    return t;
  }

  function h(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  function readData(el) {
    var out = {};
    for (var key in DEFAULTS) {
      var raw = el.dataset ? el.dataset['ccs' + key.charAt(0).toUpperCase() + key.slice(1)] : undefined;
      if (raw === undefined) continue;
      if (BOOL_KEYS.indexOf(key) > -1) {
        if (raw === 'true' || raw === '') out[key] = true;
        else if (raw === 'false') out[key] = false;
        else out[key] = raw; // 'scroll' | 'hover'
      } else if (NUM_KEYS.indexOf(key) > -1) {
        var n = Number(raw);
        if (!isNaN(n)) out[key] = n;
      } else {
        out[key] = raw;
      }
    }
    return out;
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------------------------------------------------------------- */
  /* Geç yüklenen stiller (CDN, Tailwind JIT, lazy CSS) için ortak izleyici */
  /* ---------------------------------------------------------------- */
  var LIVE = [];
  var relayoutTimer = 0, globalWatching = false;

  function relayoutAll() {
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(function () {
      LIVE.forEach(function (i) { i._layoutDirty = true; i._req(); });
    }, 60);
  }

  function watchGlobal() {
    if (globalWatching || !hasDOM) return;
    globalWatching = true;
    window.addEventListener('load', relayoutAll);
    document.addEventListener('load', function (e) {
      var t = e.target;
      if (t && t.tagName === 'LINK') relayoutAll(); // stylesheet yüklendi
    }, true);
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(relayoutAll).observe(document.head || document.documentElement, {
        childList: true, subtree: true, characterData: true
      });
    }
  }

  // class'tan ccs- önekli (kendi) sınıflarımız çıkarılır; yalnızca kullanıcı sınıfı değişimi sayılır
  function userClasses(v) {
    return String(v || '').split(/\s+/).filter(function (c) { return c && c.indexOf('ccs-') !== 0; }).sort().join(' ');
  }

  /* ---------------------------------------------------------------- */
  /* Sınıf                                                             */
  /* ---------------------------------------------------------------- */
  function CustomScrollbar(target, options) {
    if (!hasDOM) return;
    var page = false;
    if (target === 'page' || target === window || target === document ||
        target === document.body || target === document.documentElement) {
      page = true;
      target = document.documentElement;
    } else if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    if (!target || target.nodeType !== 1) throw new TypeError('CustomScrollbar: geçerli bir eleman gerekli.');
    if (target._ccs) return target._ccs;
    if (page && !document.body) throw new TypeError('CustomScrollbar.page(): <body> henüz yok; DOMContentLoaded sonrası çağırın.');
    if (!page && /^(SELECT|TEXTAREA|INPUT|IFRAME|IMG|VIDEO|CANVAS|TABLE|TBODY|THEAD|TR)$/.test(target.tagName)) {
      throw new TypeError('CustomScrollbar: <' + target.tagName.toLowerCase() + '> desteklenmiyor (içeriği taşınamaz). Bir <div> ile sarın.');
    }

    // Başlatılmış elemanın kopyası (cloneNode): eski iskeleti aç, aksi halde iç içe ikinci bir görünüm alanı oluşur
    if (!page) {
      var oldVp = null;
      for (var ci = 0; ci < target.children.length; ci++) {
        if (target.children[ci].classList.contains('ccs-viewport')) { oldVp = target.children[ci]; break; }
      }
      if (oldVp) {
        var oldContent = null;
        for (var cj = 0; cj < oldVp.children.length; cj++) {
          if (oldVp.children[cj].classList.contains('ccs-content')) { oldContent = oldVp.children[cj]; break; }
        }
        while (oldContent && oldContent.firstChild) target.insertBefore(oldContent.firstChild, oldVp);
        toArray(target.children).forEach(function (n) {
          if (n.classList.contains('ccs-viewport') || n.classList.contains('ccs-track') || n.classList.contains('ccs-shade')) target.removeChild(n);
        });
        toArray(target.classList).forEach(function (c) { if (c.indexOf('ccs-') === 0) target.classList.remove(c); });
      }
    }

    this.el = target;
    this.isPage = page;
    this.o = extend({}, CustomScrollbar.defaults, page ? { axis: 'y' } : null, readData(target), options);
    this.g = { y: null, x: null };
    this.active = false;
    this._e = {};
    this._hover = false;
    this._dead = false;

    this._build();
    this._bind();
    this._applyOptions();
    this.update();
    target._ccs = this;
    if (LIVE.indexOf(this) < 0 && target.isConnected) LIVE.push(this);
    watchGlobal();
  }

  // 'y' | 'x' | 'xy' | 'both'
  function parseAxis(ax) {
    if (ax === 'both') return { x: true, y: true };
    return { x: /x/i.test(ax), y: /y/i.test(ax) };
  }

  var P = CustomScrollbar.prototype;

  /* ---------------------- İskelet ---------------------- */
  P._build = function () {
    var el = this.el, self = this;
    var root, vp, content = null;

    if (this.isPage) {
      root = h('div', 'ccs-root ccs-page');
      document.body.appendChild(root);
      vp = document.scrollingElement || document.documentElement;
      document.documentElement.classList.add('ccs-page-on');
      this.axes = this.o.axis ? parseAxis(this.o.axis) : { y: true, x: false };
      if (!this.axes.x && !this.axes.y) this.axes.y = true;
    } else {
      var cs = getComputedStyle(el);
      var disp = cs.display;

      // Eksenler: seçenek > elemanın CSS overflow değeri
      function on(v) { return v === 'hidden' || v === 'clip' ? false : true; }
      var ax = this.o.axis;
      this.axes = ax
        ? parseAxis(ax)
        : { y: on(cs.overflowY), x: on(cs.overflowX) };
      if (!this.axes.x && !this.axes.y) this.axes.y = true;

      this._savedPos = el.style.position;
      this._posSet = false;

      vp = h('div', 'ccs-viewport');
      content = h('div', 'ccs-content');
      this.content = content;
      this.root = el;
      VIEWPORT_PROPS.forEach(function (p) { if (cs[p]) vp.style[p] = cs[p]; });
      vp.style.overflowX = this.axes.x ? 'auto' : 'hidden';
      vp.style.overflowY = this.axes.y ? 'auto' : 'hidden';

      // Ana eleman (host) kendi dış düzenini korur; padding / flex / grid gibi iç düzen
      // artık içerik kapsayıcısına aittir (_syncLayout bunları elemandan okuyup uygular).
      if (cs.position === 'static') { el.style.position = 'relative'; this._posSet = true; }
      this._syncLayout();

      // Çocukları taşı
      while (el.firstChild) content.appendChild(el.firstChild);
      vp.appendChild(content);
      el.appendChild(vp);
      root = el;
    }

    this.root = root;
    this.vp = vp;
    this.content = content;
    if (!this.isPage) this._proxy();

    // Çubuklar
    this.tr = {};
    this.th = {};
    ['y', 'x'].forEach(function (a) {
      var track = h('div', 'ccs-track ccs-' + a, { 'aria-hidden': 'true' });
      var thumb = h('div', 'ccs-thumb');
      track.appendChild(thumb);
      root.appendChild(track);
      self.tr[a] = track;
      self.th[a] = thumb;
    });

    // Kenar gölgeleri
    this._shades = ['t', 'b', 'l', 'r'].map(function (s) {
      var n = h('div', 'ccs-shade ccs-sh-' + s, { 'aria-hidden': 'true' });
      root.appendChild(n);
      return n;
    });

    // Klavye odağı için etiket aktarımı (kaydırılabilir bölge adlandırılsın)
    if (!this.isPage) {
      var label = el.getAttribute('aria-label'), lby = el.getAttribute('aria-labelledby');
      if (label || lby) {
        vp.setAttribute('role', 'region');
        if (label) vp.setAttribute('aria-label', label);
        if (lby) vp.setAttribute('aria-labelledby', lby);
      }
    }
  };

  // Elemanın düzen özelliklerini (padding, display, flex/grid) okuyup içerik kapsayıcısına
  // uygular. Medya sorgularıyla değişen değerler için yeniden boyutlanınca tekrar çağrılır.
  P._syncLayout = function () {
    if (this.isPage) return;
    var el = this.el, c = this.content, cl = el.classList, cs = getComputedStyle(el);

    // Gizli (display:none) ya da DOM'da olmayan eleman ölçülemez. Host sınıfı yine de
    // uygulanır; düzen, eleman görünür olunca (ResizeObserver → update) eşitlenir.
    if (!el.isConnected || cs.display === 'none') {
      cl.add('ccs-root', 'ccs-host');
      this._layoutDirty = true;
      return;
    }

    // 1) Host sınıfı kapalıyken orijinal padding ve display okunur
    cl.remove('ccs-host');
    var disp = cs.display;
    var pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];

    // 2) flex/grid şablonları, eleman bu düzenlerden biriyken piksele çözülür; bildirilen
    //    (responsive) halini okumak için ölçüm süresince kısa bir an display:block yapılır.
    cl.add('ccs-root', 'ccs-host', 'ccs-probe');
    var d = disp.indexOf('grid') > -1 ? 'grid' : disp.indexOf('flex') > -1 ? 'flex' : 'flow-root';
    if (c.style.display !== d) c.style.display = d;
    LAYOUT_PROPS.forEach(function (p) {
      if (p.indexOf('padding') === 0) return;
      var v = cs[p];
      if (c.style[p] !== v) c.style[p] = v;
    });
    cl.remove('ccs-probe');
    c.style.paddingTop = pad[0];
    c.style.paddingRight = pad[1];
    c.style.paddingBottom = pad[2];
    c.style.paddingLeft = pad[3];
  };

  // Eleman artık kaydırıcı olmadığından, dışarıdan el.scrollTop / el.scrollTo() / 'scroll'
  // dinleyicisi kullanan kodlar bozulmasın diye bu API'ler iç görünüm alanına yönlendirilir.
  P._proxy = function () {
    var el = this.el, vp = this.vp, self = this;
    ['scrollTop', 'scrollLeft'].forEach(function (k) {
      Object.defineProperty(el, k, {
        configurable: true,
        get: function () { return vp[k]; },
        set: function (v) { vp[k] = v; }
      });
    });
    ['scrollHeight', 'scrollWidth'].forEach(function (k) {
      Object.defineProperty(el, k, { configurable: true, get: function () { return vp[k]; } });
    });
    ['scrollTo', 'scrollBy'].forEach(function (k) {
      Object.defineProperty(el, k, {
        configurable: true,
        writable: true,
        value: function () { return vp[k].apply(vp, arguments); }
      });
    });
    this._proxied = true;
    void self;
  };

  P._unproxy = function () {
    if (!this._proxied) return;
    var el = this.el;
    ['scrollTop', 'scrollLeft', 'scrollHeight', 'scrollWidth', 'scrollTo', 'scrollBy'].forEach(function (k) {
      delete el[k];
    });
    this._proxied = false;
  };

  P._applyOptions = function () {
    var o = this.o, r = this.root, ah = o.autoHide;
    r.classList.toggle('ccs-sm', o.size === 'sm');
    r.classList.toggle('ccs-lg', o.size === 'lg');
    r.classList.toggle('ccs-shadows', !!o.shadows);
    r.classList.toggle('ccs-gutter', !!o.gutter && !this.isPage);
    if (o.className) {
      if (this._cls) r.classList.remove.apply(r.classList, this._cls);
      this._cls = String(o.className).split(/\s+/).filter(Boolean);
      r.classList.add.apply(r.classList, this._cls);
    }
    if (ah === false || ah === 'false') this._show(true);
    else if (this.active) this._schedHide();
  };

  /* ---------------------- Olaylar ---------------------- */
  P._bind = function () {
    var self = this, H = (this._h = {});
    var scrollTarget = this.isPage ? window : this.vp;

    H.scroll = function () {
      if (self._dead) return;
      self._paint();
      var ah = self.o.autoHide;
      if (ah === true || ah === 'scroll' || ah === 'hover' && self._coarse()) self._show();
      // Kaydıran artık iç alan; elemana bağlı 'scroll' dinleyicileri çalışmaya devam etsin
      if (!self.isPage) {
        try { self.el.dispatchEvent(new Event('scroll')); } catch (x) { /* eski tarayıcı */ }
      }
      if (typeof self.o.onScroll === 'function') self._cb(self.o.onScroll, self.getInfo(), self);
    };
    H.req = function () { self._req(); };
    H.winResize = function () { self._layoutDirty = true; self._req(); };
    H.enter = function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      self._hover = true;
      var ah = self.o.autoHide;
      if (ah === true || ah === 'hover') self._show();
    };
    H.leave = function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      self._hover = false;
      if (!self._drag && !self._press) self._schedHide();
    };
    H.move = function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var ah = self.o.autoHide;
      if ((ah === true || ah === 'hover') && !self.active) self._show();
    };
    H.pageMove = function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var near = 56, ah = self.o.autoHide;
      if (ah !== true && ah !== 'hover') return;
      var de = document.documentElement;
      var edge = e.clientX >= de.clientWidth - near || (self.axes.x && e.clientY >= de.clientHeight - near);
      self._hover = edge;
      if (edge) self._show(); else if (self.active && !self._drag && !self._press) self._schedHide();
    };
    H.focusin = function () {
      var ah = self.o.autoHide;
      if (ah === true || ah === 'scroll') self._show();
    };

    scrollTarget.addEventListener('scroll', H.scroll, { passive: true });
    window.addEventListener('resize', H.winResize);
    if (this.isPage) {
      document.addEventListener('pointermove', H.pageMove, { passive: true });
    } else {
      this.root.addEventListener('pointerenter', H.enter);
      this.root.addEventListener('pointerleave', H.leave);
      this.root.addEventListener('pointermove', H.move, { passive: true });
      this.vp.addEventListener('focusin', H.focusin);
      // Resimler / yazı tipleri yüklenince boyut değişir
      this.vp.addEventListener('load', H.req, true);
    }

    ['y', 'x'].forEach(function (a) {
      var tr = self.tr[a];
      tr.addEventListener('pointerdown', function (e) { self._down(e, a); });
      tr.addEventListener('pointermove', function (e) { self._move(e); });
      tr.addEventListener('pointerup', function (e) { self._up(e); });
      tr.addEventListener('pointercancel', function (e) { self._up(e); });
      tr.addEventListener('lostpointercapture', function (e) { self._up(e); });
      tr.addEventListener('wheel', function (e) {
        var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? self.vp.clientHeight : 1;
        self.vp.scrollBy({ top: e.deltaY * k, left: e.deltaX * k, behavior: 'auto' });
        e.preventDefault();
      }, { passive: false });
      tr.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') { self._hover = true; self._show(); }
      });
    });

    // Boyut / içerik değişimlerini izle
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(H.req);
      if (this.isPage) {
        this._ro.observe(document.documentElement);
        this._ro.observe(document.body);
      } else {
        this._ro.observe(this.vp);
        this._ro.observe(this.content);
      }
    }
    // Element: içerik değişimi (yatay taşma boyut gözlemcisine yansımaz). Sayfada gerek yok:
    // html/body boyut değişimini zaten ResizeObserver yakalar (tüm DOM'u izlemek pahalı olur).
    if (!this.isPage && typeof MutationObserver !== 'undefined') {
      this._mo = new MutationObserver(H.req);
      this._mo.observe(this.content, { childList: true, subtree: true, characterData: true });
    }
    // Çatıya doğrudan eklenen düğümleri içeriğe taşı (basit append senaryosu)
    if (!this.isPage && typeof MutationObserver !== 'undefined') {
      this._hostMo = new MutationObserver(function (recs) {
        recs.forEach(function (r) {
          toArray(r.addedNodes).forEach(function (n) {
            if (n.parentNode !== self.el) return;
            if (n === self.vp || self.tr.y === n || self.tr.x === n || self._shades.indexOf(n) > -1) return;
            self.content.appendChild(n);
          });
        });
      });
      this._hostMo.observe(this.el, { childList: true });

      // Elemanın kendi class/style değişimi (örn. responsive padding sınıfları) düzeni etkiler
      this._attrMo = new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var r = recs[i];
          if (r.attributeName === 'style' || userClasses(r.oldValue) !== userClasses(self.el.className)) {
            self._layoutDirty = true;
            self._req();
            return;
          }
        }
      });
      this._attrMo.observe(this.el, { attributes: true, attributeFilter: ['class', 'style'], attributeOldValue: true });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(H.req);
  };

  // Dokunmatik birincil işaretçi (hover yok): 'hover' kipi bu cihazlarda kaydırınca gösterir
  P._coarse = function () {
    return !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
  };

  P._cb = function (fn) {
    if (typeof fn !== 'function') return;
    try { fn.apply(this, Array.prototype.slice.call(arguments, 1)); }
    catch (e) { if (typeof console !== 'undefined' && console.error) console.error('CustomScrollbar callback hatası:', e); }
  };

  P._req = function () {
    var self = this;
    if (this._raf || this._dead) return;
    function run() {
      if (!self._raf) return;
      cancelAnimationFrame(self._raf);
      clearTimeout(self._rt);
      self._raf = 0;
      self.update();
    }
    this._raf = requestAnimationFrame(run);
    this._rt = setTimeout(run, 120); // arka plan sekmelerinde rAF durabilir
  };

  /* ---------------------- Ölçüm ve çizim ---------------------- */
  P.update = function (relayout) {
    if (this._dead) return this;
    // DOM'dan çıkarılan eleman global listeden düşer (sızıntı olmasın); geri eklenince
    // ResizeObserver tetikler ve yeniden eklenir.
    var idx = LIVE.indexOf(this);
    if (!this.el.isConnected) {
      if (idx > -1) LIVE.splice(idx, 1);
      return this;
    }
    if (idx < 0) LIVE.push(this);
    if (relayout === true || this._layoutDirty) { this._layoutDirty = false; this._syncLayout(); }
    var vp = this.vp, r = this.root, o = this.o;
    this.rtl = getComputedStyle(this.isPage ? document.documentElement : vp).direction === 'rtl';

    var chY = vp.clientHeight, shY = vp.scrollHeight, cwX = vp.clientWidth, swX = vp.scrollWidth;
    var hasY = this.axes.y && shY - chY > 1;
    var hasX = this.axes.x && swX - cwX > 1;
    r.classList.toggle('ccs-has-y', hasY);
    r.classList.toggle('ccs-has-x', hasX);
    r.classList.toggle('ccs-both', hasY && hasX);

    // Sınıflar uygulandıktan sonra yol uzunluğu okunur (iki eksen varken kısalır)
    this.g.y = this.g.x = null;
    var min = o.thumbMin;
    // Yolun iç boşluğu (padding) düşülür: tutamaç uçlarda yola yapışmaz
    var padY = hasY ? (parseFloat(getComputedStyle(this.tr.y).paddingTop) || 0) : 0;
    var padX = hasX ? (parseFloat(getComputedStyle(this.tr.x).paddingLeft) || 0) : 0;
    if (hasY) {
      var tl = this.tr.y.getBoundingClientRect().height - 2 * padY; // alt-piksel doğruluk
      var len = tl <= min ? tl : clamp(tl * chY / shY, min, tl);
      this.g.y = { max: shY - chY, trackLen: tl, thumbLen: len };
      this.th.y.style.height = len + 'px';
    }
    if (hasX) {
      var tw = this.tr.x.getBoundingClientRect().width - 2 * padX;
      var wd = tw <= min ? tw : clamp(tw * cwX / swX, min, tw);
      this.g.x = { max: swX - cwX, trackLen: tw, thumbLen: wd };
      this.th.x.style.width = wd + 'px';
    }

    // Klavye ile kaydırılabilsin: yalnızca kaydırılabilirken odaklanabilir yap
    if (!this.isPage && o.focusable) {
      var want = hasY || hasX;
      if (want && !vp.hasAttribute('tabindex')) { vp.setAttribute('tabindex', '0'); this._tab = true; }
      else if (!want && this._tab) { vp.removeAttribute('tabindex'); this._tab = false; }
    }

    this._paint();

    if (!hasY && !hasX) this._hide(true);
    else if (o.autoHide === false || o.autoHide === 'false') this._show(true);

    this._cb(o.onUpdate, this.getInfo(), this);
    return this;
  };

  P._paint = function () {
    var vp = this.vp, g = this.g, e = this._e;
    var top = vp.scrollTop, left = Math.abs(vp.scrollLeft);
    if (g.y && g.y.max > 0) {
      var oy = clamp(top / g.y.max, 0, 1) * (g.y.trackLen - g.y.thumbLen);
      this.th.y.style.transform = 'translate3d(0,' + oy + 'px,0)';
    }
    if (g.x && g.x.max > 0) {
      var ox = clamp(left / g.x.max, 0, 1) * (g.x.trackLen - g.x.thumbLen);
      this.th.x.style.transform = 'translate3d(' + (this.rtl ? -ox : ox) + 'px,0,0)';
    }
    // Kenar durumları (gölgeler için); yalnızca değişince sınıfa dokun
    var my = g.y ? g.y.max : 0, mx = g.x ? g.x.max : 0;
    var s = {
      up: my > 0 && top > 1,
      down: my > 0 && top < my - 1,
      start: mx > 0 && left > 1,
      end: mx > 0 && left < mx - 1
    };
    var cl = this.root.classList;
    if (s.up !== e.up) { e.up = s.up; cl.toggle('ccs-can-up', s.up); }
    if (s.down !== e.down) { e.down = s.down; cl.toggle('ccs-can-down', s.down); }
    if (s.start !== e.start) { e.start = s.start; cl.toggle('ccs-can-start', s.start); }
    if (s.end !== e.end) { e.end = s.end; cl.toggle('ccs-can-end', s.end); }
  };

  /* ---------------------- Görünürlük ---------------------- */
  P._show = function (sticky) {
    clearTimeout(this._ht);
    if (!this.active) {
      this.active = true;
      this.root.classList.add('ccs-active');
    }
    if (!sticky) this._schedHide();
  };

  P._schedHide = function () {
    var self = this, ah = this.o.autoHide;
    clearTimeout(this._ht);
    if (ah === false || ah === 'false') return;
    if (this._hover || this._drag || this._press) return;
    this._ht = setTimeout(function () { self._hide(); }, this.o.autoHideDelay);
  };

  P._hide = function (force) {
    var ah = this.o.autoHide;
    if (!force && (ah === false || ah === 'false')) return;
    if (!force && (this._hover || this._drag || this._press)) return;
    clearTimeout(this._ht);
    if (this.active) {
      this.active = false;
      this.root.classList.remove('ccs-active');
    }
  };

  /* ---------------------- Sürükleme / yola tıklama ---------------------- */
  P._down = function (e, axis) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var g = this.g[axis];
    if (!g || g.max <= 0) return;
    if (this._drag || this._press) return; // çoklu dokunuş: ilk işaretçi sürerken yenisi yok sayılır
    var tr = this.tr[axis], th = this.th[axis], horiz = axis === 'x', self = this;
    e.preventDefault();
    this._show();
    try { tr.setPointerCapture(e.pointerId); } catch (x) { /* yoksay */ }
    tr.classList.add('ccs-on');

    if (th.contains(e.target)) {
      this._drag = {
        axis: axis,
        id: e.pointerId,
        start: horiz ? e.clientX : e.clientY,
        scroll: Math.abs(horiz ? this.vp.scrollLeft : this.vp.scrollTop)
      };
      this.root.classList.add('ccs-dragging');
      document.documentElement.classList.add('ccs-noselect');
    } else if (this.o.clickScroll) {
      this._press = { axis: axis, id: e.pointerId, x: e.clientX, y: e.clientY };
      this._step(true);
      this._pt = setTimeout(function rep() {
        if (!self._press) return;
        self._step(false);
        self._pt = setTimeout(rep, 90);
      }, 420);
    }
  };

  P._move = function (e) {
    if (this._press && e.pointerId === this._press.id) {
      this._press.x = e.clientX;
      this._press.y = e.clientY;
      return;
    }
    var d = this._drag;
    if (!d || e.pointerId !== d.id) return;
    var g = this.g[d.axis], horiz = d.axis === 'x';
    var span = g.trackLen - g.thumbLen;
    if (span <= 0) return;
    var delta = (horiz ? e.clientX : e.clientY) - d.start;
    var abs = d.scroll + (horiz && this.rtl ? -delta : delta) * (g.max / span);
    this._setPos(d.axis, clamp(abs, 0, g.max));
  };

  P._step = function (first) {
    var p = this._press;
    if (!p) return;
    var horiz = p.axis === 'x', r = this.th[p.axis].getBoundingClientRect();
    var pos = horiz ? p.x : p.y, a = horiz ? r.left : r.top, b = horiz ? r.right : r.bottom;
    if (pos >= a && pos <= b) { this._endPress(); return; } // tutamaca ulaştı
    var toward = pos < a ? -1 : 1;              // ekrandaki yön
    var absDir = horiz && this.rtl ? -toward : toward; // içerikte ilerleme yönü
    var amt = (horiz ? this.vp.clientWidth : this.vp.clientHeight) * 0.9;
    var dx = horiz ? (this.rtl ? -absDir : absDir) * amt : 0;
    var dy = horiz ? 0 : absDir * amt;
    var smooth = first && this.o.smooth && !reducedMotion();
    this.vp.scrollBy({ top: dy, left: dx, behavior: smooth ? 'smooth' : 'auto' });
  };

  P._endPress = function () {
    clearTimeout(this._pt);
    this._press = null;
  };

  P._up = function (e) {
    var had = this._drag || this._press;
    if (!had) return;
    var id = (this._drag || this._press).id;
    if (e && e.pointerId !== undefined && e.pointerId !== id) return;
    this._endPress();
    this._drag = null;
    this.root.classList.remove('ccs-dragging');
    document.documentElement.classList.remove('ccs-noselect');
    this.tr.y.classList.remove('ccs-on');
    this.tr.x.classList.remove('ccs-on');
    this._schedHide();
  };

  P._setPos = function (axis, abs) {
    var vp = this.vp, prev = vp.style.scrollBehavior;
    vp.style.scrollBehavior = 'auto'; // CSS'teki smooth sürüklemeyi geciktirmesin
    if (axis === 'y') vp.scrollTop = abs;
    else vp.scrollLeft = this.rtl ? -abs : abs;
    vp.style.scrollBehavior = prev;
  };

  /* ---------------------- Genel API ---------------------- */
  P.getInfo = function () {
    var vp = this.vp;
    var maxTop = Math.max(0, vp.scrollHeight - vp.clientHeight);
    var maxLeft = Math.max(0, vp.scrollWidth - vp.clientWidth);
    return {
      top: vp.scrollTop,
      left: Math.abs(vp.scrollLeft),
      maxTop: maxTop,
      maxLeft: maxLeft,
      progressY: maxTop ? clamp(vp.scrollTop / maxTop, 0, 1) : 0,
      progressX: maxLeft ? clamp(Math.abs(vp.scrollLeft) / maxLeft, 0, 1) : 0,
      atTop: vp.scrollTop <= 1,
      atBottom: vp.scrollTop >= maxTop - 1,
      scrollable: maxTop > 1 || maxLeft > 1
    };
  };

  // scrollTo({top,left,behavior}) | scrollTo(x, y)
  P.scrollTo = function (a, b) {
    var opts = typeof a === 'object' && a ? a : { left: a, top: b };
    if (opts.behavior === undefined) opts = extend({}, opts, { behavior: this.o.smooth && !reducedMotion() ? 'smooth' : 'auto' });
    this.vp.scrollTo(opts);
    return this;
  };
  P.scrollBy = function (a, b) {
    var opts = typeof a === 'object' && a ? a : { left: a, top: b };
    if (opts.behavior === undefined) opts = extend({}, opts, { behavior: this.o.smooth && !reducedMotion() ? 'smooth' : 'auto' });
    this.vp.scrollBy(opts);
    return this;
  };
  P.scrollToTop = function (behavior) { return this.scrollTo({ top: 0, behavior: behavior }); };
  P.scrollToBottom = function (behavior) {
    return this.scrollTo({ top: this.vp.scrollHeight, behavior: behavior });
  };

  // İçerikteki bir elemana kaydır: { block: 'start' | 'center' | 'nearest', offset, behavior }
  P.scrollToElement = function (target, opts) {
    opts = opts || {};
    var node = typeof target === 'string' ? this.vp.querySelector(target) : target;
    if (!node) return this;
    var vp = this.vp, vr = vp.getBoundingClientRect(), nr = node.getBoundingClientRect();
    var block = opts.block || 'nearest', off = opts.offset || 0;
    var top = vp.scrollTop + (nr.top - vr.top);
    var dest = top - off;
    if (block === 'center') dest = top - (vp.clientHeight - nr.height) / 2;
    else if (block === 'nearest') {
      if (nr.top >= vr.top && nr.bottom <= vr.bottom) return this;
      dest = nr.top < vr.top ? top - off : top - vp.clientHeight + nr.height + off;
    }
    return this.scrollTo({ top: dest, behavior: opts.behavior });
  };

  P.show = function () { this._show(); return this; };
  P.hide = function () { this._hide(true); return this; };

  P.setOptions = function (opts) {
    extend(this.o, opts);
    this._applyOptions();
    return this.update();
  };

  P.destroy = function () {
    if (this._dead) return;
    this._dead = true;
    var el = this.el, H = this._h;
    clearTimeout(this._ht);
    clearTimeout(this._pt);
    clearTimeout(this._rt);
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    if (this._mo) this._mo.disconnect();
    if (this._hostMo) this._hostMo.disconnect();
    if (this._attrMo) this._attrMo.disconnect();
    var li = LIVE.indexOf(this);
    if (li > -1) LIVE.splice(li, 1);
    (this.isPage ? window : this.vp).removeEventListener('scroll', H.scroll);
    window.removeEventListener('resize', H.winResize);
    document.documentElement.classList.remove('ccs-noselect');

    if (this.isPage) {
      document.removeEventListener('pointermove', H.pageMove);
      document.documentElement.classList.remove('ccs-page-on');
      if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
    } else {
      // Çocukları geri taşı, eklenen her şeyi temizle, stilleri eski haline getir
      while (this.content.firstChild) el.insertBefore(this.content.firstChild, this.vp);
      [this.vp, this.tr.y, this.tr.x].concat(this._shades).forEach(function (n) {
        if (n.parentNode === el) el.removeChild(n);
      });
      this._unproxy();
      toArray(el.classList).forEach(function (c) { if (c.indexOf('ccs-') === 0) el.classList.remove(c); });
      if (this._cls) el.classList.remove.apply(el.classList, this._cls);
      if (this._posSet) el.style.position = this._savedPos;
      if (!el.getAttribute('style')) el.removeAttribute('style');
      el.removeEventListener('pointerenter', H.enter);
      el.removeEventListener('pointerleave', H.leave);
      el.removeEventListener('pointermove', H.move);
    }
    delete el._ccs;
  };

  /* ---------------------- Statik ---------------------- */
  CustomScrollbar.defaults = extend({}, DEFAULTS);
  CustomScrollbar.version = '1.0.0';

  CustomScrollbar.getInstance = function (el) {
    if (typeof el === 'string') el = el === 'page' ? document.documentElement : document.querySelector(el);
    return (el && el._ccs) || null;
  };

  CustomScrollbar.init = function (target, options) {
    if (!hasDOM) return [];
    var nodes;
    if (typeof target === 'string') nodes = toArray(document.querySelectorAll(target));
    else if (target && target.nodeType === 1) nodes = [target];
    else nodes = toArray(target);
    var out = [];
    nodes.forEach(function (n) {
      try { out.push(new CustomScrollbar(n, options)); }
      catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn(e.message); }
    });
    return out;
  };

  // Sayfanın kendi kaydırma çubuğunu özelleştirir
  // <body> henüz yoksa (script <head>'de) sayfa yüklenince başlatılır ve null döner.
  CustomScrollbar.page = function (options) {
    if (!hasDOM) return null;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () { new CustomScrollbar('page', options); });
      return null;
    }
    return new CustomScrollbar('page', options);
  };

  CustomScrollbar.autoInit = function (scope) {
    if (!hasDOM) return [];
    var out = [];
    toArray((scope || document).querySelectorAll('[data-scrollbar]')).forEach(function (n) {
      if (n.getAttribute('data-scrollbar') === 'false') return;
      try { out.push(new CustomScrollbar(n)); }
      catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn(e.message); }
    });
    return out;
  };

  return CustomScrollbar;
});
