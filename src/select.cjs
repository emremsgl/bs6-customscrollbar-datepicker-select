/*!
 * CustomSelect 2.0 (MIT)
 * Bağımlılık yok. Bootstrap, Tailwind, Bulma ve düz HTML ile birlikte çalışır.
 *
 *   new CustomSelect('#sehir', { clearable: true });
 *   CustomSelect.init('select.js-select');
 *   <select data-custom-select data-clearable="true"> ... (otomatik başlatma)
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CustomSelect = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var hasDOM = typeof document !== 'undefined';
  var uid = 0;

  /* ---------------------------------------------------------------- */
  /* Varsayılanlar                                                     */
  /* ---------------------------------------------------------------- */
  var DEFAULTS = {
    placeholder: null,          // null: boş değerli ilk <option> metni ya da yerelleştirilmiş "Seçim yapın"
    search: true,               // true | false | 'auto' (seçenek sayısı >= searchThreshold)
    searchThreshold: 8,
    locale: null,               // null: <html lang>; yoksa 'en'. Hazır diller: 'en', 'tr' (diğerleri için metin seçeneklerini verin)
    searchPlaceholder: 'Search...',
    noResults: 'No results found',
    selectAllText: 'Select all',
    clearAllText: 'Clear selection',
    doneText: 'Done',
    clearTitle: 'Clear',
    closeTitle: 'Close',
    removeTitle: 'Remove',
    clearable: false,           // seçimi tek tıkla temizleyen ✕ düğmesi
    autoWidth: false,           // tetikleyici en geniş seçeneğe göre otomatik boyutlansın
    iconRenderer: null,         // function(option) -> HTML string | Node (özel ikon üretici)
    fitChips: true,             // çoklu seçimde etiketler tek satırda kalır; sığmayanlar "+N" rozetine dönüşür
    maxChips: 0,                // çoklu seçimde en fazla kaç etiket gösterilsin (0: hepsi); fitChips ile birlikte üst sınır olur
    max: 0,                     // çoklu seçimde en fazla seçim sayısı (0: sınırsız)
    maxHeight: 320,             // menü en yüksekliği (px)
    sheet: 'auto',              // true | false | 'auto' (dar ekranda alttan açılan sayfa)
    sheetBreakpoint: 575,       // px
    closeOnSelect: null,        // null: tek seçimde true, çoklu seçimde false
    size: null,                 // 'sm' | 'lg' | null (null: sınıflardan algıla)
    className: '',              // kapsayıcıya eklenecek sınıflar
    menuClass: '',              // açılır menüye eklenecek sınıflar
    onChange: null,
    onOpen: null,
    onClose: null,
    onMax: null
  };

  // Hazır metinler. Yalnızca kullanıcı varsayılanı değiştirmediyse (CustomSelect.defaults ya da seçenek) devreye girer.
  var I18N = {
    en: { searchPlaceholder: 'Search...', noResults: 'No results found', selectAllText: 'Select all', clearAllText: 'Clear selection',
      doneText: 'Done', clearTitle: 'Clear', closeTitle: 'Close', removeTitle: 'Remove', emptyPlaceholder: 'Select an option' },
    tr: { searchPlaceholder: 'Ara...', noResults: 'Sonuç bulunamadı', selectAllText: 'Tümünü Seç', clearAllText: 'Seçimi Kaldır',
      doneText: 'Tamam', clearTitle: 'Temizle', closeTitle: 'Kapat', removeTitle: 'Kaldır', emptyPlaceholder: 'Seçim yapın' }
  };

  var BOOL_KEYS = ['search', 'clearable', 'sheet', 'closeOnSelect', 'autoWidth', 'fitChips'];
  var NUM_KEYS = ['searchThreshold', 'maxChips', 'max', 'maxHeight', 'sheetBreakpoint'];

  // Menü body'ye taşındığı için tema değişkenleri hesaplanıp menüye kopyalanır
  var TOKENS = ['accent', 'accent-soft', 'accent-text', 'on-accent', 'ring', 'bg', 'fg', 'muted',
    'placeholder', 'border', 'border-hover', 'divider', 'menu-bg', 'hover', 'danger',
    'danger-ring', 'radius', 'font-size', 'shadow', 'z'];

  var ICON = {
    chevron: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5.5 7.75 10 12.25l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    search: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m13.2 13.2 3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };

  /* ---------------------------------------------------------------- */
  /* Yardımcılar                                                       */
  /* ---------------------------------------------------------------- */
  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var k in src) {
        if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== undefined) target[k] = src[k];
      }
    }
    return target;
  }

  function h(tag, cls, attrs, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (html) n.innerHTML = html;
    return n;
  }

  // Büyük/küçük harf, aksan ve Türkçe i/ı farkını yok sayan karşılaştırma
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/ı/g, 'i');
  }

  function readData(el) {
    var out = {};
    for (var key in DEFAULTS) {
      var raw = el.dataset ? el.dataset[key] : undefined;
      if (raw === undefined) continue;
      if (BOOL_KEYS.indexOf(key) > -1) {
        if (raw === 'true' || raw === '') out[key] = true;
        else if (raw === 'false') out[key] = false;
        else out[key] = raw; // 'auto'
      } else if (NUM_KEYS.indexOf(key) > -1) {
        var n = Number(raw);
        if (!isNaN(n)) out[key] = n;
      } else {
        out[key] = raw;
      }
    }
    return out;
  }

  function hasClass(el, list) {
    for (var i = 0; i < list.length; i++) if (el.classList.contains(list[i])) return true;
    return false;
  }

  /* ---------------------------------------------------------------- */
  /* Sınıf                                                             */
  /* ---------------------------------------------------------------- */
  function CustomSelect(el, options) {
    if (!hasDOM) return;
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el || el.tagName !== 'SELECT') throw new TypeError('CustomSelect: bir <select> elemanı gerekli.');
    if (el._cs) return el._cs;

    this.el = el;
    var data = readData(el);
    var lang = String((options && options.locale) || data.locale || document.documentElement.lang || 'en').toLowerCase().split(/[-_]/)[0];
    var tr = I18N[lang] || I18N.en;
    var base = extend({}, CustomSelect.defaults);
    for (var tk in tr) if (base[tk] === I18N.en[tk]) base[tk] = tr[tk]; // yalnızca değiştirilmemiş varsayılanlar
    this._t = tr;
    this.o = extend({}, base, data, options);
    this.multiple = el.multiple;
    this.isOpen = false;
    this.active = null;
    this.vis = [];
    this.opts = [];
    this.items = [];
    this._term = '';
    this._silent = false;
    this._sheet = false;
    this._invalid = false;
    this._ta = { buf: '', t: null };

    try {
      this._build();
      this._bind();
      this.refresh();
    } catch (err) {
      this._rollback(); // yarım kalan kurulum <select>'i gizli bırakmasın
      throw err;
    }
    el._cs = this;
  }

  var P = CustomSelect.prototype;

  // Kurucu yarıda hata verirse eklenen her şeyi geri al (hata sonra yeniden fırlatılır)
  P._rollback = function () {
    var el = this.el, H = this._h;
    try {
      if (this._mo) this._mo.disconnect();
      if (this._ro) this._ro.disconnect();
      clearTimeout(this._moTimer);
      if (H) {
        el.removeEventListener('change', H.nativeChange);
        el.removeEventListener('focus', H.nativeFocus);
        el.removeEventListener('invalid', H.nativeInvalid);
        if (this._form) this._form.removeEventListener('reset', H.formReset);
      }
      if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
      if (this._shell) this._shell.classList.remove('cs-hidden-shell');
      el.classList.remove('cs-native');
      if (this._prev) {
        if (this._prev.tabindex == null) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', this._prev.tabindex);
        if (this._prev.ariaHidden == null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', this._prev.ariaHidden);
      }
      (this._labels || []).forEach(function (l) { if (l._csId) { l.removeAttribute('id'); l._csId = false; } });
    } catch (e) { /* kısmi temizlik: sessizce geç */ }
  };

  /* ---------------------- İskelet ---------------------- */
  P._build = function () {
    var el = this.el, o = this.o;
    var id = (this.id = 'cs-' + ++uid);

    // Başlatılmış işaretlemenin kopyası (cloneNode): ölü sarmalayıcıyı ve eklentinin koyduğu nitelikleri temizle
    if (el.classList.contains('cs-native')) {
      var host = el.parentNode && el.parentNode.classList && el.parentNode.classList.contains('cs-hidden-shell') ? el.parentNode : el;
      var stale = host.nextElementSibling;
      if (stale && stale.classList.contains('cs-select')) stale.parentNode.removeChild(stale);
      host.classList.remove('cs-hidden-shell');
      el.classList.remove('cs-native');
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-hidden');
    }

    var wrapper = h('div', 'cs-select cs-root' + (o.className ? ' ' + o.className : ''));
    var trigger = h('div', 'cs-trigger', {
      role: 'combobox',
      tabindex: '0',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': id + '-list'
    });
    var value = h('div', 'cs-value', { id: id + '-value' });
    var clear = h('span', 'cs-clear', { 'aria-hidden': 'true', title: o.clearTitle }, ICON.x);
    clear.hidden = true;
    var arrow = h('span', 'cs-arrow', { 'aria-hidden': 'true' }, ICON.chevron);
    trigger.appendChild(value);
    trigger.appendChild(clear);
    trigger.appendChild(arrow);
    wrapper.appendChild(trigger);
    var sizer = h('div', 'cs-sizer', { 'aria-hidden': 'true' });
    wrapper.appendChild(sizer);

    // Menü (açılınca <body>'ye eklenir)
    var menu = h('div', 'cs-menu cs-root' + (o.menuClass ? ' ' + o.menuClass : ''));
    // Mobil sayfa başlığı: tutamaç + başlık + kapat (yalnızca sheet modunda görünür)
    var head = h('div', 'cs-head');
    head.appendChild(h('span', 'cs-grab', { 'aria-hidden': 'true' }));
    var headRow = h('div', 'cs-head-row');
    var title = h('span', 'cs-title');
    var closeBtn = h('button', 'cs-sheet-close', { type: 'button', 'aria-label': o.closeTitle, title: o.closeTitle }, ICON.x);
    headRow.appendChild(title);
    headRow.appendChild(closeBtn);
    head.appendChild(headRow);
    var searchBox = h('div', 'cs-search-box');
    searchBox.appendChild(h('span', 'cs-search-icon', null, ICON.search));
    var search = h('input', 'cs-search', {
      type: 'text',
      role: 'searchbox',
      autocomplete: 'off',
      autocapitalize: 'none',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: 'search',
      placeholder: o.searchPlaceholder,
      'aria-label': o.searchPlaceholder,
      'aria-controls': id + '-list'
    });
    searchBox.appendChild(search);

    var actions = h('div', 'cs-actions');
    var btnAll = h('button', 'cs-action', { type: 'button' });
    btnAll.textContent = o.selectAllText;
    var btnNone = h('button', 'cs-action cs-secondary', { type: 'button' });
    btnNone.textContent = o.clearAllText;
    actions.appendChild(btnAll);
    actions.appendChild(btnNone);

    var list = h('div', 'cs-list', { role: 'listbox', id: id + '-list', tabindex: '-1' });
    var empty = h('div', 'cs-empty', { role: 'status' });
    empty.textContent = o.noResults;
    empty.hidden = true;

    var footer = h('div', 'cs-footer');
    var done = h('button', 'cs-done', { type: 'button' });
    done.textContent = o.doneText;
    footer.appendChild(done);

    menu.appendChild(head);
    menu.appendChild(searchBox);
    menu.appendChild(actions);
    menu.appendChild(list);
    menu.appendChild(empty);
    menu.appendChild(footer);

    var backdrop = h('div', 'cs-backdrop');

    // Wrapper, <select>'in hemen sonrasına eklenir; <select> yerinde kalır
    // (form, label, doğrulama, React/Vue gibi kütüphaneler bozulmaz).
    var anchor = el;
    var parent = el.parentNode;
    if (parent && parent.classList && parent.classList.contains('select') && parent.children.length === 1) {
      anchor = parent; // Bulma: <div class="select"><select>
      parent.classList.add('cs-hidden-shell');
      this._shell = parent;
    }
    anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);

    this._prev = {
      tabindex: el.getAttribute('tabindex'),
      ariaHidden: el.getAttribute('aria-hidden')
    };
    el.classList.add('cs-native');
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-hidden', 'true');

    this.wrapper = wrapper;
    this.trigger = trigger;
    this.sizer = sizer;
    this.valueBox = value;
    this.clearBtn = clear;
    this.menu = menu;
    this.head = head;
    this.title = title;
    this.closeBtn = closeBtn;
    this.searchBox = searchBox;
    this.search = search;
    this.actions = actions;
    this.btnAll = btnAll;
    this.btnNone = btnNone;
    this.list = list;
    this.empty = empty;
    this.footer = footer;
    this.doneBtn = done;
    this.backdrop = backdrop;

    // Etiketler (erişilebilir ad)
    this._labels = el.labels ? toArray(el.labels) : [];
    var ids = [];
    this._labels.forEach(function (lbl, i) {
      if (!lbl.id) {
        lbl.id = id + '-label-' + i;
        lbl._csId = true;
      }
      ids.push(lbl.id);
    });
    ids.push(value.id);
    trigger.setAttribute('aria-labelledby', ids.join(' '));
    list.setAttribute('aria-labelledby', ids.slice(0, -1).join(' ') || value.id);
    var aria = el.getAttribute('aria-label');
    if (aria) trigger.setAttribute('aria-label', aria);
  };

  /* ---------------------- Olaylar ---------------------- */
  P._bind = function () {
    var self = this, el = this.el;
    var H = (this._h = {});

    H.triggerClick = function (e) {
      self._syncState(); // taşınan <fieldset disabled> gibi gözlemlenmeyen değişimler
      if (self.disabled) return;
      var x = e.target.closest ? e.target.closest('.cs-chip-x') : null;
      if (x && self.trigger.contains(x)) {
        e.stopPropagation();
        var item = self.opts[+x.getAttribute('data-i')];
        if (item) self._toggleItem(item, false);
        return;
      }
      var c = e.target.closest ? e.target.closest('.cs-clear') : null;
      if (c && self.trigger.contains(c)) {
        e.stopPropagation();
        self.clear(true);
        self.trigger.focus({ preventScroll: true });
        return;
      }
      self.toggle();
    };
    H.keydown = function (e) { self._keydown(e); };
    H.menuMouseDown = function (e) {
      if (e.target !== self.search) e.preventDefault(); // odağı kaybetme
    };
    H.listClick = function (e) {
      var n = e.target.closest ? e.target.closest('.cs-option') : null;
      if (!n || !n._item || n._item.disabled) return;
      self._choose(n._item);
    };
    H.listMove = function (e) {
      var n = e.target.closest ? e.target.closest('.cs-option') : null;
      if (n && n._item && !n._item.disabled && n._item !== self.active) self._setActive(n._item, false);
    };
    H.searchInput = function () {
      self._filter(self.search.value);
      if (self.isOpen) self._position();
    };
    H.selectAll = function () { self._setAll(true); };
    H.selectNone = function () { self._setAll(false); };
    H.done = function () { self.close(true); };
    H.backdropClick = function () { self.close(true); };

    // Sheet'i aşağı sürükleyerek kapatma (tutamaç / başlık alanı)
    var drag = null;
    H.dragStart = function (e) {
      if (!self._sheet || (e.button !== undefined && e.button > 0)) return;
      if (e.target.closest && e.target.closest('.cs-sheet-close')) return;
      drag = { y: e.clientY, t: Date.now(), dy: 0 };
      try { self.head.setPointerCapture(e.pointerId); } catch (x) { /* yoksay */ }
      self.menu.style.transition = 'none';
    };
    H.dragMove = function (e) {
      if (!drag) return;
      drag.dy = Math.max(0, e.clientY - drag.y);
      self.menu.style.transform = 'translateY(' + drag.dy + 'px)';
      self.backdrop.style.opacity = String(Math.max(0, 1 - drag.dy / (self.menu.offsetHeight || 1)));
    };
    H.dragEnd = function () {
      if (!drag) return;
      var d = drag, speed = d.dy / Math.max(1, Date.now() - d.t);
      drag = null;
      self.menu.style.transition = '';
      if (d.dy > 90 || (d.dy > 24 && speed > 0.5)) {
        self.close(true);
      } else {
        self.menu.style.transform = '';
        self.backdrop.style.opacity = '';
      }
    };
    H.nativeChange = function () {
      if (self._silent) return;
      self._invalid = false;
      self._syncState();
      self._sync();
    };
    H.nativeFocus = function () {
      if (!self.disabled) self.trigger.focus({ preventScroll: false });
    };
    H.nativeInvalid = function () {
      self._invalid = true;
      self._syncState();
    };
    H.formReset = function () {
      setTimeout(function () {
        self._invalid = false;
        self.refresh();
      }, 0);
    };
    H.docPointer = function (e) {
      var t = e.target;
      if (self.wrapper.contains(t) || self.menu.contains(t) || t === self.backdrop) return;
      self.close(false);
    };
    H.reposition = function (e) {
      var t = e && e.target;
      if (t && t.nodeType === 1 && self.menu.contains(t)) return; // menünün kendi kaydırması
      if (!self.wrapper.isConnected) { self.close(false); return; } // select DOM'dan çıkarıldı
      if (self._raf) return;
      self._raf = requestAnimationFrame(function () {
        self._raf = 0;
        if (self.isOpen) self._position();
      });
    };

    this.trigger.addEventListener('click', H.triggerClick);
    this.trigger.addEventListener('keydown', H.keydown);
    this.menu.addEventListener('keydown', H.keydown);
    this.menu.addEventListener('mousedown', H.menuMouseDown);
    this.list.addEventListener('click', H.listClick);
    this.list.addEventListener('mousemove', H.listMove);
    this.search.addEventListener('input', H.searchInput);
    this.btnAll.addEventListener('click', H.selectAll);
    this.btnNone.addEventListener('click', H.selectNone);
    this.doneBtn.addEventListener('click', H.done);
    this.backdrop.addEventListener('click', H.backdropClick);
    this.closeBtn.addEventListener('click', H.done);
    this.head.addEventListener('pointerdown', H.dragStart);
    this.head.addEventListener('pointermove', H.dragMove);
    this.head.addEventListener('pointerup', H.dragEnd);
    this.head.addEventListener('pointercancel', H.dragEnd);
    el.addEventListener('change', H.nativeChange);
    el.addEventListener('focus', H.nativeFocus);
    el.addEventListener('invalid', H.nativeInvalid);

    this._form = el.form;
    if (this._form) this._form.addEventListener('reset', H.formReset);

    // Tetikleyici genişliği değişince (pencere, sütun, modal açılışı) etiketleri yeniden sığdır
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(function () {
        if (self._fitRaf) return;
        function run() {
          if (!self._fitRaf) return;
          cancelAnimationFrame(self._fitRaf);
          clearTimeout(self._fitTimer);
          self._fitRaf = 0;
          if (self.el) self._fit();
        }
        self._fitRaf = requestAnimationFrame(run);
        self._fitTimer = setTimeout(run, 100); // arka plan sekmelerinde rAF durabilir
      });
      this._ro.observe(this.valueBox);
    }

    // <option> / <select> DOM'u dışarıdan değişirse otomatik güncelle
    if (typeof MutationObserver !== 'undefined') {
      // Yalnızca <select>'in kendi class / aria-invalid / required / disabled değişimi görsel durumdur:
      // listeyi yeniden kurmadan (kaydırma konumu ve aktif öğe korunur) tetikleyiciyi güncelle.
      var LIGHT = { 'class': 1, 'aria-invalid': 1, 'required': 1, 'disabled': 1 };
      this._mo = new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var r = recs[i];
          if (!(r.type === 'attributes' && LIGHT[r.attributeName] && (r.target === el || r.target.tagName === 'FIELDSET'))) {
            self._moHeavy = true;
            break;
          }
        }
        if (self._moTimer) return;
        self._moTimer = setTimeout(function () {
          self._moTimer = 0;
          var heavy = self._moHeavy;
          self._moHeavy = false;
          if (!self.el) return;
          if (heavy) self.refresh();
          else { self._syncState(); self._sync(); }
        }, 0);
      });
      // <fieldset disabled> değişimi select'in kendi niteliğini değiştirmez; üst fieldset'leri de izle
      for (var fs = el.parentNode; fs && fs.nodeType === 1; fs = fs.parentNode) {
        if (fs.tagName === 'FIELDSET') this._mo.observe(fs, { attributes: true, attributeFilter: ['disabled'] });
      }
      this._mo.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['disabled', 'class', 'label', 'value', 'selected', 'hidden', 'multiple',
          'required', 'aria-invalid', 'data-description', 'data-icon', 'data-icon-class']
      });
    }
  };

  /* ---------------------- Veri ---------------------- */
  P._read = function () {
    var el = this.el;
    this.multiple = el.multiple;
    var placeholderOpt = null;
    var first = el.options[0];
    if (!this.multiple && first && first.value === '') placeholderOpt = first;
    this.placeholderOpt = placeholderOpt;

    var items = [], opts = [];
    function makeOpt(option, group) {
      if (option === placeholderOpt || option.hidden) return null;
      var label = (option.label || option.text || '').trim();
      var it = {
        type: 'option',
        option: option,
        group: group || null,
        label: label,
        desc: option.getAttribute('data-description') || '',
        disabled: option.disabled || !!(group && group.disabled),
        node: null
      };
      it.norm = norm(label + ' ' + it.desc);
      opts.push(it);
      return it;
    }
    toArray(el.children).forEach(function (c) {
      if (c.tagName === 'OPTION') {
        var it = makeOpt(c, null);
        if (it) items.push(it);
      } else if (c.tagName === 'OPTGROUP') {
        var g = { type: 'group', el: c, label: c.label || '', disabled: c.disabled, opts: [], node: null };
        toArray(c.children).forEach(function (oc) {
          if (oc.tagName !== 'OPTION') return;
          var it2 = makeOpt(oc, g);
          if (it2) g.opts.push(it2);
        });
        if (g.opts.length) items.push(g);
      }
    });
    this.items = items;
    this.opts = opts;
  };

  // İkon: iconRenderer > data-icon-class (ikon fontu) > data-icon (URL ya da emoji/metin)
  var IMG_RE = /^(https?:|\/|\.\.?\/|data:image\/)|\.(png|jpe?g|gif|svg|webp|avif|ico)([?#].*)?$/i;
  P._icon = function (option) {
    var r = this.o.iconRenderer, s = null, v;
    if (typeof r === 'function') {
      try { v = r(option); }
      catch (err) { v = null; if (typeof console !== 'undefined' && console.warn) console.warn('CustomSelect iconRenderer hatası:', err); }
      if (v) {
        s = h('span', 'cs-icon', { 'aria-hidden': 'true' });
        if (v.nodeType) s.appendChild(v); else s.innerHTML = String(v);
        return s;
      }
    }
    var cls = option.getAttribute('data-icon-class'), ic = option.getAttribute('data-icon');
    if (cls) {
      s = h('span', 'cs-icon', { 'aria-hidden': 'true' });
      s.appendChild(h('i', cls, { 'aria-hidden': 'true' }));
    } else if (ic) {
      s = h('span', 'cs-icon', { 'aria-hidden': 'true' });
      if (IMG_RE.test(ic)) s.appendChild(h('img', null, { src: ic, alt: '', draggable: 'false' }));
      else s.textContent = ic;
    }
    return s;
  };

  P._placeholder = function () {
    if (this.o.placeholder != null && this.o.placeholder !== '') return this.o.placeholder;
    var p = this.placeholderOpt;
    if (p && (p.label || p.text).trim()) return (p.label || p.text).trim();
    return this._t.emptyPlaceholder;
  };

  P._render = function () {
    var self = this, id = this.id, n = 0;
    var frag = document.createDocumentFragment();

    function optNode(it) {
      var node = h('div', 'cs-option' + (it.disabled ? ' cs-disabled' : ''), {
        role: 'option',
        id: id + '-o' + n++,
        'aria-selected': 'false'
      });
      if (it.disabled) node.setAttribute('aria-disabled', 'true');
      var ico = self._icon(it.option);
      it.hasIcon = !!ico;
      if (ico) node.appendChild(ico);
      var body = h('span', 'cs-option-body');
      var lab = h('span', 'cs-option-label');
      lab.textContent = it.label;
      it.labelNode = lab;
      body.appendChild(lab);
      if (it.desc) {
        var d = h('span', 'cs-desc');
        d.textContent = it.desc;
        body.appendChild(d);
      }
      node.appendChild(body);
      node.appendChild(h('span', 'cs-check', { 'aria-hidden': 'true' }, ICON.check));
      node._item = it;
      it.node = node;
      return node;
    }

    this.items.forEach(function (it) {
      if (it.type === 'option') {
        frag.appendChild(optNode(it));
      } else {
        var gid = id + '-g' + n++;
        var gn = h('div', 'cs-group', { role: 'group', 'aria-labelledby': gid });
        var gl = h('div', 'cs-group-label', { id: gid, 'aria-hidden': 'true' });
        gl.textContent = it.label;
        gn.appendChild(gl);
        it.opts.forEach(function (oi) { gn.appendChild(optNode(oi)); });
        it.node = gn;
        frag.appendChild(gn);
      }
    });

    this.list.textContent = '';
    this.list.appendChild(frag);

    // Otomatik genişlik için gizli ölçer: en geniş etiket tetikleyici genişliğini belirler
    var sz = this.sizer, anyIcon = this.opts.some(function (x) { return x.hasIcon; });
    sz.textContent = '';
    var phRow = h('div', anyIcon && !this.multiple ? 'cs-pad' : '');
    phRow.textContent = this._placeholder();
    sz.appendChild(phRow);
    this.opts.forEach(function (x) {
      var row = h('div', x.hasIcon || (anyIcon && !self.multiple) ? 'cs-pad' : '');
      row.textContent = x.label;
      sz.appendChild(row);
    });

    var s = this.o.search;
    this.searchOn = s === true || (s === 'auto' && this.opts.length >= this.o.searchThreshold);
    this.searchBox.hidden = !this.searchOn;
    if (!this.searchOn) this.search.value = '';
    this._filter(this.searchOn ? this.search.value : '');
  };

  /* ---------------------- Durum eşitleme ---------------------- */
  P._snap = function () {
    return toArray(this.el.selectedOptions).map(function (o) { return o.value; }).join('\u0001');
  };

  P._syncState = function () {
    var el = this.el, o = this.o, w = this.wrapper;
    var wasDisabled = this.disabled;
    this.disabled = el.matches(':disabled');
    if (this.disabled && this.isOpen) this.close(false);
    w.classList.toggle('cs-disabled', this.disabled);
    this.trigger.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
    this.trigger.setAttribute('tabindex', this.disabled ? '-1' : '0');
    if (wasDisabled !== this.disabled && this.disabled) this._setActive(null);

    var invalid = this._invalid || el.getAttribute('aria-invalid') === 'true' ||
      hasClass(el, ['is-invalid', 'is-danger', 'select-error', 'input-error', 'invalid']);
    w.classList.toggle('cs-invalid', invalid);
    this.trigger.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    this.trigger.setAttribute('aria-required', el.required ? 'true' : 'false');

    var size = o.size;
    if (!size) {
      if (hasClass(el, ['form-select-sm', 'form-control-sm', 'is-small', 'select-sm', 'select-xs'])) size = 'sm';
      else if (hasClass(el, ['form-select-lg', 'form-control-lg', 'is-medium', 'is-large', 'select-lg'])) size = 'lg';
    }
    w.classList.toggle('cs-sm', size === 'sm');
    w.classList.toggle('cs-lg', size === 'lg');
    w.classList.toggle('cs-multi', this.multiple);
    w.classList.toggle('cs-fit', this.multiple && !!o.fitChips);
    w.classList.toggle('cs-auto', !!o.autoWidth);
    this.menu.classList.toggle('cs-multi', this.multiple);
    this.list.setAttribute('aria-multiselectable', this.multiple ? 'true' : 'false');
    this.actions.hidden = !this.multiple;

    // <select> üzerinde verilen --cs-* değişkenlerini kapsayıcıya taşı
    var st = el.style;
    for (var i = 0; st && i < st.length; i++) {
      var name = st[i];
      if (name.indexOf('--cs-') === 0) w.style.setProperty(name, st.getPropertyValue(name));
    }
  };

  // Ardışık seçili öğeleri tek blok gibi göster: yalnızca bloğun ilk öğesinin üstü
  // ve son öğesinin altı yuvarlak olur (filtrelenen ve gruplar arası öğeler bloğu böler).
  P._runs = function () {
    var seen = this.opts.filter(function (it) { return it.node && !it.node.hidden; });
    function linked(a, b) { // a ve b görünür komşu, ikisi de seçili ve aynı grupta mı
      return !!(a && b && a.option.selected && b.option.selected && a.group === b.group);
    }
    seen.forEach(function (it, i) {
      var sel = it.option.selected;
      it.node.classList.toggle('cs-run-start', sel && !linked(seen[i - 1], it));
      it.node.classList.toggle('cs-run-end', sel && !linked(it, seen[i + 1]));
    });
    this.opts.forEach(function (it) { // gizlenenlerden sınıfı temizle
      if (it.node && it.node.hidden) it.node.classList.remove('cs-run-start', 'cs-run-end');
    });
  };

  P._sync = function () {
    var self = this;
    this._shown = this._snap();
    var selected = this.opts.filter(function (it) { return it.option.selected; });

    this.opts.forEach(function (it) {
      if (!it.node) return;
      var s = it.option.selected;
      it.node.classList.toggle('cs-selected', s);
      it.node.setAttribute('aria-selected', s ? 'true' : 'false');
    });
    this._runs();

    var box = this.valueBox;
    box.textContent = '';
    this._chipSet = null;
    if (!selected.length) {
      var ph = h('span', 'cs-placeholder');
      ph.textContent = this._placeholder();
      box.appendChild(ph);
    } else if (this.multiple) {
      var max = this.o.maxChips, shown = max > 0 ? selected.slice(0, max) : selected;
      var nodes = shown.map(function (it) {
        var chip = h('span', 'cs-chip');
        var t = h('span', 'cs-chip-text');
        t.textContent = it.label;
        var ci = self._icon(it.option);
        if (ci) chip.appendChild(ci);
        var x = h('span', 'cs-chip-x', {
          'data-i': self.opts.indexOf(it),
          title: self.o.removeTitle
        }, ICON.x);
        chip.appendChild(t);
        chip.appendChild(x);
        return chip;
      });
      var more = h('span', 'cs-chip cs-chip-more');
      var extra = selected.length - shown.length;
      if (this.o.fitChips) {
        // Tek satıra sığanlar kalır, kalanı "+N" olur (ölçüm _fit'te; genişlik değişince yeniden çalışır)
        this._chipSet = {
          nodes: nodes,
          more: more,
          extra: extra,
          labels: selected.map(function (it) { return it.label; })
        };
        this._fit();
      } else {
        nodes.forEach(function (c) { box.appendChild(c); });
        if (extra > 0) {
          more.textContent = '+' + extra;
          box.appendChild(more);
        }
      }
    } else {
      var row = h('span', 'cs-sel');
      var si = this._icon(selected[0].option);
      if (si) row.appendChild(si);
      var tx = h('span', 'cs-text');
      tx.textContent = selected[0].label;
      row.appendChild(tx);
      box.appendChild(row);
    }

    var canClear = this.o.clearable && selected.length > 0 && !this.disabled &&
      (this.multiple || !this.el.required);
    this.clearBtn.hidden = !canClear;
    this.wrapper.classList.toggle('cs-has-clear', canClear);
    this.wrapper.classList.toggle('cs-has-value', selected.length > 0);

    if (this.isOpen) this._position();
  };

  // Çoklu seçim: etiketleri tek satıra sığdır. Sığmayanlar kaldırılır, sona "+N" rozeti eklenir
  // (rozetin üzerine gelince gizlenen etiketlerin adları görünür). Genişlik değişince yeniden çalışır.
  P._fit = function () {
    var set = this._chipSet, box = this.valueBox;
    if (!set || !this.multiple || !this.o.fitChips) return;
    var nodes = set.nodes, more = set.more, n = nodes.length, i;
    if (!n) return;

    box.textContent = '';
    for (i = 0; i < n; i++) box.appendChild(nodes[i]);
    box.appendChild(more);

    var avail = box.clientWidth;
    if (!avail) { // henüz görünür değil (gizli / DOM dışı): hepsini koy, görününce ResizeObserver yeniden çalıştırır
      more.hidden = set.extra === 0;
      if (set.extra) more.textContent = '+' + set.extra;
      return;
    }

    box.classList.add('cs-measure'); // ölçüm sırasında etiketler küçülmesin
    var widths = [], sums = [0];
    for (i = 0; i < n; i++) {
      widths[i] = nodes[i].offsetWidth;
      sums[i + 1] = sums[i] + widths[i];
    }
    var gap = parseFloat(getComputedStyle(box).columnGap) || 0;
    var keep = 1; // en az bir etiket kalır (sığmazsa kısalır, "…" ile)
    for (var k = n; k >= 1; k--) {
      var hid = n - k + set.extra, need = sums[k] + gap * (k - 1);
      if (hid) {
        more.hidden = false;
        more.textContent = '+' + hid;
        need += gap + more.offsetWidth;
      }
      if (need <= avail + 0.5) { keep = k; break; }
    }
    box.classList.remove('cs-measure');

    for (i = keep; i < n; i++) box.removeChild(nodes[i]);
    var hidden = n - keep + set.extra;
    more.hidden = hidden === 0;
    if (hidden) {
      more.textContent = '+' + hidden;
      more.title = set.labels.slice(keep).join(', ');
    } else {
      more.removeAttribute('title');
    }
  };

  P.refresh = P.update = function () {
    if (!this.el) return this;
    this._read();
    this._render();
    this._syncState();
    this._sync();
    if (this.isOpen && this.active && this.vis.indexOf(this.active) < 0) this._setActive(this.vis[0] || null);
    return this;
  };

  /* ---------------------- Arama / aktif öğe ---------------------- */
  // Aramada eşleşen kısmı vurgular (aksan/harf farkını yok sayan eşleme)
  P._hl = function (it, term) {
    var n = it.labelNode;
    if (!n) return;
    var s = it.label, a = -1, b = -1;
    if (term) {
      var map = [], ns = '';
      for (var i = 0; i < s.length; i++) {
        var c = norm(s.charAt(i));
        for (var k = 0; k < c.length; k++) map.push(i);
        ns += c;
      }
      var p = ns.indexOf(term);
      if (p > -1) { a = map[p]; b = map[p + term.length - 1] + 1; }
    }
    if (a < 0) {
      if (n._hl) { n.textContent = s; n._hl = false; }
      return;
    }
    n.textContent = '';
    n.appendChild(document.createTextNode(s.slice(0, a)));
    var mk = h('mark', 'cs-hl');
    mk.textContent = s.slice(a, b);
    n.appendChild(mk);
    n.appendChild(document.createTextNode(s.slice(b)));
    n._hl = true;
  };

  P._filter = function (text) {
    var self = this, t = norm(text).trim(), vis = [], any = false;
    this._term = text;
    this.opts.forEach(function (it) {
      var m = !t || it.norm.indexOf(t) > -1;
      it.node.hidden = !m;
      if (m) self._hl(it, t);
      if (m) {
        any = true;
        if (!it.disabled) vis.push(it);
      }
    });
    this.items.forEach(function (g) {
      if (g.type === 'group') {
        g.node.hidden = !g.opts.some(function (o) { return !o.node.hidden; });
      }
    });
    this.vis = vis;
    this.empty.hidden = any;
    this.list.hidden = !any; // sonuç yokken boş liste boşluk bırakmasın
    this._runs();
    if (!this.isOpen) return;
    if (t) this._setActive(vis[0] || null, true);
    else if (!this.active || vis.indexOf(this.active) < 0) this._setActive(this._firstSelected() || vis[0] || null, true);
  };

  P._firstSelected = function () {
    for (var i = 0; i < this.vis.length; i++) if (this.vis[i].option.selected) return this.vis[i];
    return null;
  };

  P._setActive = function (item, reveal) {
    if (this.active && this.active.node) this.active.node.classList.remove('cs-active');
    this.active = item || null;
    var id = item && item.node ? item.node.id : null;
    [this.trigger, this.search].forEach(function (n) {
      if (id) n.setAttribute('aria-activedescendant', id);
      else n.removeAttribute('aria-activedescendant');
    });
    if (item && item.node) {
      item.node.classList.add('cs-active');
      if (reveal) this._reveal(item.node);
    }
  };

  P._reveal = function (node) {
    var list = this.list, pad = 4;
    var lr = list.getBoundingClientRect();
    var top = node;
    if (!node.previousElementSibling && node.parentNode && node.parentNode.classList.contains('cs-group')) {
      top = node.parentNode; // grup başlığıyla birlikte göster
    }
    var tr = top.getBoundingClientRect(), nr = node.getBoundingClientRect();
    if (tr.top < lr.top) list.scrollTop -= lr.top - tr.top + pad;
    else if (nr.bottom > lr.bottom) list.scrollTop += nr.bottom - lr.bottom + pad;
  };

  P._move = function (delta) {
    var v = this.vis;
    if (!v.length) return;
    var i = v.indexOf(this.active);
    if (Math.abs(delta) === 1) {
      i = i < 0 ? (delta > 0 ? 0 : v.length - 1) : (i + delta + v.length) % v.length;
    } else {
      i = Math.max(0, Math.min(v.length - 1, (i < 0 ? 0 : i) + delta));
    }
    this._setActive(v[i], true);
  };

  P._typeahead = function (ch) {
    var self = this, ta = this._ta;
    clearTimeout(ta.t);
    ta.buf += norm(ch);
    ta.t = setTimeout(function () { ta.buf = ''; }, 700);
    var v = this.vis;
    if (!v.length) return;
    var start = Math.max(0, v.indexOf(this.active)) + (ta.buf.length === 1 ? 1 : 0);
    for (var k = 0; k < v.length; k++) {
      var it = v[(start + k) % v.length];
      if (norm(it.label).indexOf(ta.buf) === 0) {
        self._setActive(it, true);
        return;
      }
    }
  };

  /* ---------------------- Seçim ---------------------- */
  P._commit = function (before) {
    if (before === this._snap()) return false;
    this._sync();
    var el = this.el;
    this._silent = true;
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      this._silent = false;
    }
    this._invalid = false;
    this._syncState();
    this._cb(this.o.onChange, this.getValue(), this);
    return true;
  };

  // Kullanıcı callback'inde oluşan hata eklentinin akışını bozmasın
  P._cb = function (fn) {
    if (typeof fn !== 'function') return;
    try {
      fn.apply(this, Array.prototype.slice.call(arguments, 1));
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) console.error('CustomSelect callback hatası:', err);
    }
  };

  P._count = function () {
    return this.opts.filter(function (it) { return it.option.selected; }).length;
  };

  P._toggleItem = function (item, turnOn) {
    if (!item || item.disabled || this.disabled) return; // devre dışı seçenek değişmez
    var before = this._snap();
    var on = turnOn === undefined ? !item.option.selected : turnOn;
    if (on && this.multiple && this.o.max > 0 && !item.option.selected && this._count() >= this.o.max) {
      this._limitHit();
      return;
    }
    item.option.selected = on;
    this._commit(before);
  };

  P._limitHit = function () {
    var w = this.wrapper;
    w.classList.remove('cs-limit');
    void w.offsetWidth;
    w.classList.add('cs-limit');
    setTimeout(function () { w.classList.remove('cs-limit'); }, 400);
    this._cb(this.o.onMax, this.o.max, this);
  };

  P._choose = function (item) {
    if (!item || item.disabled) return;
    var close = this.o.closeOnSelect;
    if (close === null || close === undefined) close = !this.multiple;
    if (this.multiple) this._toggleItem(item);
    else {
      var before = this._snap();
      item.option.selected = true;
      this._commit(before);
    }
    if (close) this.close(true);
  };

  P._setAll = function (checked) {
    var before = this._snap();
    var pool = checked
      ? (this.isOpen ? this.vis : this.opts.filter(function (it) { return !it.disabled; }))
      : this.opts.filter(function (it) { return !it.disabled; });
    var count = this._count(), max = this.o.max, hit = false;
    pool.forEach(function (it) {
      if (checked) {
        if (it.option.selected) return;
        if (max > 0 && count >= max) { hit = true; return; }
        it.option.selected = true;
        count++;
      } else {
        it.option.selected = false;
      }
    });
    this._commit(before);
    if (hit) this._limitHit();
  };

  /* ---------------------- Klavye ---------------------- */
  P._keydown = function (e) {
    if (this.disabled || e.isComposing) return;
    var k = e.key, plain = !e.ctrlKey && !e.metaKey && !e.altKey;
    var self = this;

    if (!this.isOpen) {
      if (e.target !== this.trigger) return;
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') {
        e.preventDefault();
        this.open();
      } else if (k === 'Backspace' || k === 'Delete') {
        var sel = this.opts.filter(function (it) { return it.option.selected && !it.disabled; });
        if (!sel.length) return;
        e.preventDefault();
        if (this.multiple) this._toggleItem(sel[sel.length - 1], false);
        else if (this.o.clearable && !this.el.required) this.clear(true);
      } else if (k && k.length === 1 && plain) {
        e.preventDefault();
        this.open();
        if (this.searchOn) {
          this.search.value = k;
          this._filter(k);
          this._position();
        } else {
          this._typeahead(k);
        }
      }
      return;
    }

    var inSearch = e.target === this.search;
    switch (k) {
      case 'ArrowDown': e.preventDefault(); this._move(1); break;
      case 'ArrowUp': e.preventDefault(); this._move(-1); break;
      case 'PageDown': e.preventDefault(); this._move(8); break;
      case 'PageUp': e.preventDefault(); this._move(-8); break;
      case 'Home':
        if (!inSearch || !this.search.value) { e.preventDefault(); this._setActive(this.vis[0] || null, true); }
        break;
      case 'End':
        if (!inSearch || !this.search.value) { e.preventDefault(); this._setActive(this.vis[this.vis.length - 1] || null, true); }
        break;
      case 'Enter':
        e.preventDefault();
        if (this.active) this._choose(this.active);
        break;
      case ' ':
        if (!inSearch) { e.preventDefault(); if (this.active) this._choose(this.active); }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation(); // modal / dialog da kapanmasın
        this.close(true);
        break;
      case 'Tab':
        this.close(true); // odak tetikleyiciye döner, tarayıcı normal Tab'a devam eder
        break;
      case 'a':
      case 'A':
        if (this.multiple && (e.ctrlKey || e.metaKey) && (!inSearch || !this.search.value)) {
          e.preventDefault();
          this._setAll(true);
        }
        break;
      default:
        if (k && k.length === 1 && plain && !inSearch) {
          if (this.searchOn) { this.search.focus({ preventScroll: true }); }
          else self._typeahead(k);
        }
    }
  };

  /* ---------------------- Aç / kapat / konumlandır ---------------------- */
  P._isSheet = function () {
    var s = this.o.sheet;
    if (s === true) return true;
    if (s === false || !window.matchMedia) return false;
    return window.matchMedia('(max-width:' + this.o.sheetBreakpoint + 'px)').matches;
  };

  P._applyTheme = function () {
    var cs = getComputedStyle(this.wrapper), m = this.menu.style;
    TOKENS.forEach(function (t) {
      var v = cs.getPropertyValue('--csi-' + t).trim();
      if (v) m.setProperty('--csi-' + t, v);
      else m.removeProperty('--csi-' + t);
    });
    m.fontFamily = cs.fontFamily;
    m.colorScheme = cs.colorScheme;
    var z = parseInt(cs.getPropertyValue('--csi-z'), 10) || 2000;
    this.backdrop.style.zIndex = z - 1;
  };

  // Menünün ekleneceği kapsayıcı: modal / <dialog> içindeyse onun içi (odak tuzağı ve
  // üst katman sorunları çıkmasın), değilse <body>.
  P._root = function () {
    var r = this.wrapper.closest && this.wrapper.closest('dialog,.modal,[aria-modal="true"],[data-cs-root]');
    return r || document.body;
  };

  P._position = function () {
    if (!this.wrapper.isConnected) { this.close(false); return; } // select DOM'dan çıkarıldı
    var m = this.menu, st = m.style, o = this.o;
    var sheet = this._isSheet();
    this._sheet = sheet;
    m.classList.toggle('cs-sheet', sheet);

    if (sheet) {
      if (!this.backdrop.parentNode && m.parentNode) m.parentNode.insertBefore(this.backdrop, m);
      st.left = st.top = st.bottom = st.width = st.minWidth = st.maxWidth = st.maxHeight = '';
      m.classList.remove('cs-up');
      // Ekran klavyesi açılınca sayfa klavyenin üstünde kalsın
      var vv = window.visualViewport;
      if (vv) {
        var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        if (kb > 0) {
          st.bottom = kb + 'px';
          st.maxHeight = Math.max(200, vv.height - 24) + 'px';
        }
      }
      this._lock(true);
      return;
    }
    this._lock(false);
    if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);

    var r = this.trigger.getBoundingClientRect();
    var de = document.documentElement;
    var vw = de.clientWidth, vh = de.clientHeight;
    var gap = 6, pad = 8;
    var below = vh - r.bottom - gap - pad;
    var above = r.top - gap - pad;

    // Genişlik: en az tetikleyici kadar, içeriğe göre büyür, görünür alanı aşmaz.
    // Açıkken kilitlenir; filtrelemede menü sağa sola zıplamaz.
    st.maxHeight = o.maxHeight + 'px';
    st.maxWidth = Math.max(160, vw - pad * 2) + 'px';
    st.minWidth = Math.min(Math.max(r.width, this._lockW || 0), Math.max(160, vw - pad * 2)) + 'px'; // min-width max-width'i ezer
    st.left = '0px';
    var mw = m.offsetWidth;
    if (!this._lockW || this._lockW < mw) this._lockW = mw;

    var natural = m.offsetHeight;
    var up = natural > below && above > below;
    var avail = Math.max(120, Math.min(o.maxHeight, up ? above : below));
    st.maxHeight = avail + 'px';

    // Yatay hizalama: LTR'de sol kenara, RTL'de sağ kenara hizalı; taşarsa içeri kaydır
    var rtl = getComputedStyle(this.trigger).direction === 'rtl';
    var left = rtl ? r.right - mw : r.left;
    left = Math.min(Math.max(pad, left), Math.max(pad, vw - mw - pad));
    st.left = left + 'px';
    if (up) {
      st.top = 'auto';
      st.bottom = vh - r.top + gap + 'px';
    } else {
      st.bottom = 'auto';
      st.top = r.bottom + gap + 'px';
    }
    m.classList.toggle('cs-up', up);

    // transform / filter içeren bir üst eleman "fixed" için yeni bir referans çerçevesi
    // oluşturabilir; gerçek konumu ölçüp farkı telafi et.
    var a = m.getBoundingClientRect(), dx = left - a.left;
    if (Math.abs(dx) > 0.5) st.left = left + dx + 'px';
    if (up) {
      var db = a.bottom - (r.top - gap);
      if (Math.abs(db) > 0.5) st.bottom = parseFloat(st.bottom) + db + 'px';
    } else {
      var dt = r.bottom + gap - a.top;
      if (Math.abs(dt) > 0.5) st.top = parseFloat(st.top) + dt + 'px';
    }
  };

  // Sheet açıkken arka planın kaymasını engelle (kaydırma çubuğu kayması telafi edilir)
  // Sayfa kaydırma kilidi: select ve takvim aynı <html> üzerindeki ortak sayaçla çalışır. Önceki değer yalnızca
  // ilk kilitte kaydedilir, son kilit kalkınca geri yazılır (iç içe açılınca "hidden" kalıcı takılmaz).
  P._lock = function (on) {
    if (on === !!this._locked) return;
    this._locked = on;
    var de = document.documentElement, b = document.body;
    var st = de.__bs6Lock || (de.__bs6Lock = { n: 0, o: '', p: '' });
    if (on) {
      if (st.n++ > 0) return;
      st.o = de.style.overflow;
      st.p = b.style.paddingRight;
      var sw = window.innerWidth - de.clientWidth;
      de.style.overflow = 'hidden';
      // scrollbar-gutter:stable (Bootstrap 6 .dialog-open) yeri zaten ayırır; ayrıca telafi edilirse sayfa kayar
      var gutter = getComputedStyle(de).scrollbarGutter || '';
      if (sw > 0 && gutter.indexOf('stable') < 0) b.style.paddingRight = (parseFloat(getComputedStyle(b).paddingRight) || 0) + sw + 'px';
    } else if (st.n > 0 && --st.n === 0) {
      de.style.overflow = st.o;
      b.style.paddingRight = st.p;
    }
  };

  P._sheetTitle = function () {
    var l = this._labels[0];
    var t = (l && l.textContent.trim()) || this.el.getAttribute('aria-label') || this._placeholder();
    this.title.textContent = t;
  };

  P.open = function () {
    if (!this.el) return this;
    if (!this.isOpen) this._syncState();
    if (this.isOpen || this.disabled || !this.wrapper.isConnected) return this;
    // el.value / selectedIndex / option.selected dışarıdan atanmışsa (olay üretmez) arayüzü tazele
    if (this._shown !== this._snap()) this._sync();
    if (CustomSelect._open && CustomSelect._open !== this) CustomSelect._open.close(false);
    CustomSelect._open = this;
    this.isOpen = true;

    this._applyTheme();
    this._lockW = 0;
    this._sheetTitle();
    this.menu.style.transform = '';
    this.backdrop.style.opacity = '';
    this._root().appendChild(this.menu);
    this.search.value = '';
    this._term = '';
    this.active = null;
    this._filter('');
    this._setActive(this._firstSelected() || this.vis[0] || null, false);
    this.menu.classList.add('cs-show');
    this._position(); // ölçüm için menünün görünür olması gerekir
    this.list.scrollTop = 0;
    if (this.active) this._reveal(this.active.node);

    this.wrapper.classList.add('cs-open');
    this.trigger.setAttribute('aria-expanded', 'true');

    document.addEventListener('pointerdown', this._h.docPointer, true);
    window.addEventListener('resize', this._h.reposition);
    window.addEventListener('scroll', this._h.reposition, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this._h.reposition);
      window.visualViewport.addEventListener('scroll', this._h.reposition);
    }

    // Dar ekranda (sheet) klavye açılmasın diye arama alanına odaklanma
    if (this.searchOn && !this._sheet) this.search.focus({ preventScroll: true });
    else this.trigger.focus({ preventScroll: true });

    this._emit('open', this.o.onOpen);
    return this;
  };

  P.close = function (refocus) {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this._lockW = 0;
    if (CustomSelect._open === this) CustomSelect._open = null;

    this._lock(false);
    this.menu.classList.remove('cs-show', 'cs-up');
    if (this.menu.parentNode) this.menu.parentNode.removeChild(this.menu);
    if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
    this.wrapper.classList.remove('cs-open');
    this.trigger.setAttribute('aria-expanded', 'false');
    this._setActive(null);

    document.removeEventListener('pointerdown', this._h.docPointer, true);
    window.removeEventListener('resize', this._h.reposition);
    window.removeEventListener('scroll', this._h.reposition, true);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this._h.reposition);
      window.visualViewport.removeEventListener('scroll', this._h.reposition);
    }

    if (refocus) this.trigger.focus({ preventScroll: true });
    this._emit('close', this.o.onClose);
    return this;
  };

  P.toggle = function () {
    return this.isOpen ? this.close(true) : this.open();
  };

  P._emit = function (name, cb) {
    try {
      this.el.dispatchEvent(new CustomEvent('cs:' + name, { bubbles: true, detail: { instance: this } }));
    } catch (e) { /* eski tarayıcı */ }
    this._cb(cb, this);
  };

  /* ---------------------- Genel API ---------------------- */
  P.getValue = function () {
    if (!this.el) return this.multiple ? [] : '';
    return this.multiple
      ? toArray(this.el.selectedOptions).map(function (o) { return o.value; })
      : this.el.value;
  };

  // emit=true verilirse change olayı tetiklenir
  P.setValue = function (value, emit) {
    if (!this.el) return this;
    var arr = [].concat(value == null ? [] : value).map(String);
    var before = this._snap();
    var el = this.el;
    if (this.multiple) {
      toArray(el.options).forEach(function (o) { o.selected = arr.indexOf(o.value) > -1; });
    } else {
      var found = toArray(el.options).filter(function (o) { return o.value === arr[0]; })[0];
      if (found) found.selected = true;
      else if (this.placeholderOpt) this.placeholderOpt.selected = true;
      else el.selectedIndex = -1;
    }
    if (emit) this._commit(before);
    else this._sync();
    return this;
  };

  P.clear = function (emit) {
    if (!this.el) return this;
    var before = this._snap();
    if (this.multiple) {
      this.opts.forEach(function (it) { if (!it.disabled) it.option.selected = false; });
    } else if (this.placeholderOpt) {
      this.placeholderOpt.selected = true;
    } else {
      this.el.selectedIndex = -1;
    }
    if (emit) this._commit(before);
    else this._sync();
    return this;
  };

  P.selectAll = function () { if (this.el) this._setAll(true); return this; };

  P.enable = function () { if (this.el) { this.el.disabled = false; this._syncState(); this._sync(); } return this; };
  P.disable = function () { if (this.el) { this.el.disabled = true; this._syncState(); this._sync(); } return this; };

  P.focus = function () { if (this.el && !this.disabled) this.trigger.focus(); return this; };

  P.destroy = function () {
    var el = this.el;
    if (!el) return;
    this.close(false);
    clearTimeout(this._moTimer);
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._fitRaf) cancelAnimationFrame(this._fitRaf);
    clearTimeout(this._fitTimer);
    if (this._ro) this._ro.disconnect();
    if (this._mo) this._mo.disconnect();
    el.removeEventListener('change', this._h.nativeChange);
    el.removeEventListener('focus', this._h.nativeFocus);
    el.removeEventListener('invalid', this._h.nativeInvalid);
    if (this._form) this._form.removeEventListener('reset', this._h.formReset);
    this._labels.forEach(function (l) { if (l._csId) { l.removeAttribute('id'); l._csId = false; } });
    if (this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
    if (this._shell) this._shell.classList.remove('cs-hidden-shell');
    el.classList.remove('cs-native');
    ['tabindex', 'aria-hidden'].forEach(function (a, i) {
      var prev = i === 0 ? this._prev.tabindex : this._prev.ariaHidden;
      if (prev == null) el.removeAttribute(a); else el.setAttribute(a, prev);
    }, this);
    delete el._cs;
    this.el = null;
  };

  /* ---------------------- Statik ---------------------- */
  CustomSelect.defaults = extend({}, DEFAULTS);
  CustomSelect._open = null;
  CustomSelect.version = '2.0.0';

  CustomSelect.getInstance = function (el) {
    if (typeof el === 'string') el = document.querySelector(el);
    return (el && el._cs) || null;
  };

  CustomSelect.init = function (target, options) {
    if (!hasDOM) return [];
    var nodes;
    if (typeof target === 'string') nodes = toArray(document.querySelectorAll(target));
    else if (target && target.nodeType === 1) nodes = [target];
    else nodes = toArray(target);
    var out = [];
    nodes.forEach(function (n) {
      if (n && n.tagName === 'SELECT') out.push(new CustomSelect(n, options));
    });
    return out;
  };

  // <select data-custom-select> elemanlarını otomatik başlatır
  CustomSelect.autoInit = function (scope) {
    if (!hasDOM) return [];
    var out = [];
    toArray((scope || document).querySelectorAll('select[data-custom-select]')).forEach(function (s) {
      if (s.getAttribute('data-custom-select') === 'false') return;
      out.push(new CustomSelect(s));
    });
    return out;
  };

  CustomSelect.closeAll = function () {
    if (CustomSelect._open) CustomSelect._open.close(false);
  };

  return CustomSelect;
});
