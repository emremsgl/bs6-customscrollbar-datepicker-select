/*!
 * CustomDatePicker 1.0 (MIT)
 * Bağımlılık yok. Bootstrap, Tailwind, Bulma ve düz HTML ile birlikte çalışır.
 *
 *   new CustomDatePicker('#tarih', { mode: 'range', min: 'today' });
 *   CustomDatePicker.init('.js-date');
 *   <input data-datepicker data-cdp-mode="range">          (otomatik başlatma)
 *   new CustomDatePicker('#takvim', { inline: true });      (sayfa içinde takvim)
 *
 * Girdi (input) olduğu gibi kalır; formlar, etiketler ve doğrulama bozulmaz. Ay/gün adları
 * tarayıcının Intl desteğinden gelir (her dil çalışır). Yazılan tarih biçime göre çözümlenir.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CustomDatePicker = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var hasDOM = typeof document !== 'undefined';
  var uid = 0;

  /* ---------------------------------------------------------------- */
  /* Varsayılanlar ve metinler                                         */
  /* ---------------------------------------------------------------- */
  var DEFAULTS = {
    mode: 'single',          // 'single' | 'range' | 'multiple'
    inline: null,            // null: hedef <input> değilse true
    value: null,
    format: null,            // null: dile göre (tr: dd.MM.yyyy)
    locale: null,            // null: <html lang>; yoksa 'en'
    weekStart: null,         // 0 = Pazar … 6; null: dile göre
    months: 1,               // 1 | 2 (geniş ekranda yan yana ay sayısı)
    min: null,               // Date | 'yyyy-MM-dd' | 'today'
    max: null,
    disabledDates: null,     // Array<Date | string | [from, to]>
    disabledDays: null,      // haftanın günleri: [0, 6] (0 = Pazar)
    disable: null,           // function(date) -> true ise seçilemez
    minDays: 0,              // range: en az gün sayısı (başlangıç ve bitiş dahil)
    maxDays: 0,              // range: en çok gün sayısı (0: sınırsız)
    maxDates: 0,             // multiple: en çok seçim sayısı (0: sınırsız)
    allowDisabledInRange: false,
    weekNumbers: false,
    showOutsideDays: true,
    footer: true,
    today: true,             // "Bugün" düğmesi
    clear: true,             // "Temizle" düğmesi
    closeOnSelect: null,     // null: single/range true, multiple false
    openOn: 'click',         // 'click' | 'focus'
    sheet: 'auto',           // true | false | 'auto' (dar ekranda alttan açılan sayfa)
    sheetBreakpoint: 575,
    presets: null,           // [{ label, value: Date | [Date, Date] | function }]
    altInput: null,          // ISO değerin yazılacağı gizli girdi (seçici ya da eleman)
    toggle: null,            // açma/kapama düğmesi (seçici ya da eleman)
    separator: ' – ',        // range metin ayracı
    placeholder: null,
    className: '',
    popupClass: '',
    texts: null,
    onChange: null,
    onOpen: null,
    onClose: null,
    onViewChange: null
  };
  var BOOL_KEYS = ['weekNumbers', 'showOutsideDays', 'footer', 'today', 'clear', 'closeOnSelect',
    'allowDisabledInRange', 'sheet', 'inline'];
  var NUM_KEYS = ['months', 'minDays', 'maxDays', 'maxDates', 'weekStart', 'sheetBreakpoint'];
  var LIST_KEYS = ['disabledDays'];

  var I18N = {
    tr: {
      today: 'Bugün', clear: 'Temizle', done: 'Tamam', close: 'Kapat',
      prevMonth: 'Önceki ay', nextMonth: 'Sonraki ay', prevYear: 'Önceki yıl', nextYear: 'Sonraki yıl',
      prevYears: 'Önceki yıllar', nextYears: 'Sonraki yıllar', chooseMonth: 'Ay seç', chooseYear: 'Yıl seç',
      week: 'Hf', calendar: 'Takvim', pickDate: 'Tarih seçin', pickRange: 'Tarih aralığı seçin', pickDates: 'Tarihleri seçin'
    },
    en: {
      today: 'Today', clear: 'Clear', done: 'Done', close: 'Close',
      prevMonth: 'Previous month', nextMonth: 'Next month', prevYear: 'Previous year', nextYear: 'Next year',
      prevYears: 'Previous years', nextYears: 'Next years', chooseMonth: 'Choose month', chooseYear: 'Choose year',
      week: 'Wk', calendar: 'Calendar', pickDate: 'Select a date', pickRange: 'Select a date range', pickDates: 'Select dates'
    }
  };

  var TOKENS = ['accent', 'accent-soft', 'accent-text', 'on-accent', 'ring', 'bg', 'fg', 'muted', 'faint',
    'border', 'divider', 'hover', 'radius', 'cell', 'font-size', 'shadow', 'z'];

  var ICON = {
    prev: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  /* ---------------------------------------------------------------- */
  /* Genel yardımcılar                                                 */
  /* ---------------------------------------------------------------- */
  function toArray(l) { return Array.prototype.slice.call(l || []); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n, l) { n = String(Math.abs(n)); while (n.length < (l || 2)) n = '0' + n; return n; }

  function extend(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== undefined) t[k] = s[k];
    }
    return t;
  }

  function h(tag, cls, attrs, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (html) n.innerHTML = html;
    return n;
  }

  function readData(el) {
    var out = {};
    for (var key in DEFAULTS) {
      var raw = el.dataset ? el.dataset['cdp' + key.charAt(0).toUpperCase() + key.slice(1)] : undefined;
      if (raw === undefined) continue;
      if (BOOL_KEYS.indexOf(key) > -1) {
        if (raw === 'true' || raw === '') out[key] = true;
        else if (raw === 'false') out[key] = false;
        else out[key] = raw; // 'auto'
      } else if (NUM_KEYS.indexOf(key) > -1) {
        var n = Number(raw);
        if (!isNaN(n)) out[key] = n;
      } else if (LIST_KEYS.indexOf(key) > -1) {
        out[key] = raw.split(',').map(function (x) { return +x; }).filter(function (x) { return !isNaN(x); });
      } else {
        out[key] = raw;
      }
    }
    return out;
  }

  // Büyük/küçük harf, aksan ve Türkçe i/ı farkını yok sayan karşılaştırma (ay adı çözümleme)
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/ı/g, 'i').replace(/\.$/, '');
  }

  /* ---------------------------------------------------------------- */
  /* Tarih yardımcıları (yerel saat, DST güvenli)                      */
  /* ---------------------------------------------------------------- */
  function mk(y, m, d) { // 0-99 yıl aralığında 1900'e kaymaz
    var x = new Date(2000, 0, 1);
    x.setFullYear(y, m, d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function sod(d) { return mk(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return mk(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) {
    var y = d.getFullYear(), m = d.getMonth() + n;
    var last = mk(y, m + 1, 0).getDate();
    return mk(y, m, Math.min(d.getDate(), last));
  }
  function addYears(d, n) { return addMonths(d, n * 12); }
  function validDate(d) { return d instanceof Date && !isNaN(d.getTime()); }
  function dn(d) { // gün numarası (karşılaştırma ve fark için)
    var u = new Date(0);
    u.setUTCFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round(u.getTime() / 864e5);
  }
  function fromDn(n) {
    var u = new Date(n * 864e5);
    return mk(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
  }
  function key(d) { return pad(d.getFullYear(), 4) + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) {
    var m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
    if (!m) return null;
    var d = mk(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
  }
  function isoWeek(d) { // ISO 8601 hafta numarası
    var t = mk(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
    var w1 = mk(t.getFullYear(), 0, 4);
    return 1 + Math.round(((dn(t) - dn(w1)) - 3 + ((w1.getDay() + 6) % 7)) / 7);
  }

  /* ---------------------------------------------------------------- */
  /* Yerel ayar (Intl)                                                 */
  /* ---------------------------------------------------------------- */
  var nameCache = {};
  function names(loc) {
    if (nameCache[loc]) return nameCache[loc];
    var mkF = function (opt) { try { return new Intl.DateTimeFormat(loc, opt); } catch (e) { return new Intl.DateTimeFormat('en', opt); } };
    var mL = mkF({ month: 'long' }), mS = mkF({ month: 'short' });
    var wL = mkF({ weekday: 'long' }), wS = mkF({ weekday: 'short' });
    var out = { months: [], monthsShort: [], days: [], daysShort: [] };
    for (var i = 0; i < 12; i++) {
      out.months.push(mL.format(mk(2021, i, 1)));
      out.monthsShort.push(mS.format(mk(2021, i, 1)));
    }
    for (var j = 0; j < 7; j++) { // 1 Ağustos 2021 Pazar
      out.days.push(wL.format(mk(2021, 7, 1 + j)));
      out.daysShort.push(wS.format(mk(2021, 7, 1 + j)));
    }
    return (nameCache[loc] = out);
  }

  // Hücre etiketleri için tam tarih biçimleyicisi (her çizimde yeniden üretilmez)
  var longCache = {};
  function longFormatter(loc) {
    if (longCache[loc]) return longCache[loc];
    var opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, f;
    try { f = new Intl.DateTimeFormat(loc, opt); } catch (e) { f = new Intl.DateTimeFormat('en', opt); }
    return (longCache[loc] = f);
  }

  function weekStartFor(loc) {
    try {
      var L = new Intl.Locale(loc);
      var wi = L.getWeekInfo ? L.getWeekInfo() : L.weekInfo;
      if (wi && wi.firstDay) return wi.firstDay % 7;
    } catch (e) { /* yoksay */ }
    var lang = String(loc).toLowerCase().split('-')[0];
    return lang === 'en' && !/-(gb|au|ie|nz|in)$/i.test(loc) ? 0 : (lang === 'ja' || lang === 'he' ? 0 : 1);
  }

  /* ---------------------------------------------------------------- */
  /* Biçimlendirme / çözümleme                                         */
  /* ---------------------------------------------------------------- */
  // gg = gün, aa = ay (Türkçe yazımlı takma adlar: gg.aa.yyyy ≡ dd.MM.yyyy)
  var TOKEN_RE = /'[^']*'|yyyy|yy|MMMM|MMM|MM|M|dd|d|gg|aa|EEEE|EEE/g;

  function formatDate(d, fmt, loc) {
    var N = names(loc);
    return fmt.replace(TOKEN_RE, function (t) {
      switch (t) {
        case 'yyyy': return pad(d.getFullYear(), 4);
        case 'yy': return pad(d.getFullYear() % 100, 2);
        case 'MMMM': return N.months[d.getMonth()];
        case 'MMM': return N.monthsShort[d.getMonth()];
        case 'MM': case 'aa': return pad(d.getMonth() + 1);
        case 'M': return String(d.getMonth() + 1);
        case 'dd': case 'gg': return pad(d.getDate());
        case 'd': return String(d.getDate());
        case 'EEEE': return N.days[d.getDay()];
        case 'EEE': return N.daysShort[d.getDay()];
        default: return t.slice(1, -1) || "'";
      }
    });
  }

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }

  // Biçimden düzenli ifade üretir; yazılan ayraçlar (. / -) birbirinin yerine kabul edilir
  function compileFormat(fmt) {
    var parts = [], re = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    function lit(s) {
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (/[.\/\-]/.test(c)) re += '[.\\/\\-]';
        else if (/\s/.test(c)) re += '\\s*';
        else re += esc(c);
      }
    }
    while ((m = TOKEN_RE.exec(fmt))) {
      if (m.index > last) lit(fmt.slice(last, m.index));
      last = m.index + m[0].length;
      var t = m[0];
      if (t.charAt(0) === "'") { lit(t.slice(1, -1)); continue; }
      parts.push(t);
      if (t === 'yyyy') re += '(\\d{4}|\\d{2})'; // yazarken "7/4/26" da kabul edilir
      else if (t === 'yy') re += '(\\d{2})';
      else if (t === 'MM' || t === 'M' || t === 'dd' || t === 'd' || t === 'gg' || t === 'aa') re += '(\\d{1,2})';
      else re += '([^\\d\\s.,\\/\\-\\u2013]+\\.?)'; // ay / gün adı
    }
    if (last < fmt.length) lit(fmt.slice(last));
    return { re: new RegExp('^\\s*' + re + '\\s*$', 'i'), parts: parts };
  }

  var fmtCache = {};
  function parseDate(text, fmt, loc) {
    var c = fmtCache[fmt] || (fmtCache[fmt] = compileFormat(fmt));
    var m = c.re.exec(text);
    if (!m) return null;
    var now = new Date(), y = now.getFullYear(), mo = 0, d = 1, hasM = false, hasD = false, N = names(loc);
    for (var i = 0; i < c.parts.length; i++) {
      var t = c.parts[i], v = m[i + 1];
      if (t === 'yyyy' && v.length === 4) y = +v;
      else if (t === 'yyyy' || t === 'yy') { y = 2000 + +v; if (y > now.getFullYear() + 20) y -= 100; }
      else if (t === 'MM' || t === 'M' || t === 'aa') { mo = +v - 1; hasM = true; }
      else if (t === 'dd' || t === 'd' || t === 'gg') { d = +v; hasD = true; }
      else if (t === 'MMMM' || t === 'MMM') {
        var nv = norm(v), idx = -1;
        for (var k = 0; k < 12; k++) {
          if (norm(N.months[k]) === nv || norm(N.monthsShort[k]) === nv) { idx = k; break; }
        }
        if (idx < 0) return null;
        mo = idx; hasM = true;
      }
    }
    if (!hasD && !hasM) return null;
    if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
    var out = mk(y, mo, d);
    return out.getMonth() === mo && out.getDate() === d ? out : null;
  }

  /* ---------------------------------------------------------------- */
  /* Sınıf                                                             */
  /* ---------------------------------------------------------------- */
  function CustomDatePicker(target, options) {
    if (!hasDOM) return;
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target || target.nodeType !== 1) throw new TypeError('CustomDatePicker: geçerli bir eleman gerekli.');
    if (target._cdp) return target._cdp;

    this.el = target;
    this.o = extend({}, CustomDatePicker.defaults, readData(target), options);
    this.isInput = target.tagName === 'INPUT';
    this.inline = this.o.inline === null || this.o.inline === undefined ? !this.isInput : !!this.o.inline;
    if (!this.isInput && !this.inline) throw new TypeError('CustomDatePicker: açılır takvim için <input> gerekli.');
    if (this.inline && this.isInput) throw new TypeError('CustomDatePicker: satır içi takvim için <div> gibi bir kapsayıcı kullanın.');

    this.id = 'cdp-' + ++uid;
    this.isOpen = false;
    this.viewMode = 'days';
    this.pending = null;
    this.hover = null;
    this.cells = [];
    this.cellMap = {};
    this._dirty = false;
    this._silent = false;
    this._sheet = false;
    this._dead = false;

    try {
      this._setup();
      this._build();
      this._bind();
      this._init();
    } catch (err) {
      // Yarım kalan kurulumu geri al (girdi bozuk bırakılmasın), hatayı yeniden fırlat
      try { this.destroy(); } catch (e2) { /* kısmi temizlik */ }
      if (this.isInput) target.classList.remove('cdp-input');
      delete target._cdp;
      throw err;
    }
    target._cdp = this;
  }

  var P = CustomDatePicker.prototype;

  /* ---------------------- Kurulum ---------------------- */
  P._setup = function () {
    var o = this.o;
    this.loc = o.locale || document.documentElement.lang || 'en';
    var lang = String(this.loc).toLowerCase().split('-')[0];
    this.t = extend({}, I18N[lang] || I18N.en, o.texts);
    this.fmt = o.format || (lang === 'tr' ? 'gg.aa.yyyy'
      : lang === 'en' ? (/-(gb|au|ie|nz|in)$/i.test(this.loc) ? 'dd/MM/yyyy' : 'MM/dd/yyyy') : 'yyyy-MM-dd');
    this.ws = o.weekStart != null ? ((+o.weekStart % 7) + 7) % 7 : weekStartFor(this.loc);
    this.mode = o.mode === 'range' || o.mode === 'multiple' ? o.mode : 'single';
    this.multiSep = this.fmt.indexOf(',') > -1 ? '; ' : ', ';
    this._compileConstraints();
  };

  P._compileConstraints = function () {
    var self = this, o = this.o;
    this.min = o.min ? this._toDate(o.min) : null;
    this.max = o.max ? this._toDate(o.max) : null;
    this.disabledRanges = [];
    this._dc = {};
    this._win = null;
    toArray(o.disabledDates).forEach(function (x) {
      if (Array.isArray(x)) {
        var a = self._toDate(x[0]), b = self._toDate(x[1]);
        if (a && b) self.disabledRanges.push([dn(a), dn(b)]);
      } else {
        var d = self._toDate(x);
        if (d) self.disabledRanges.push([dn(d), dn(d)]);
      }
    });
  };

  // Date | sayı | 'today' | ISO | biçimli metin → gün başı Date (geçersizse null)
  P._toDate = function (x) {
    if (x == null || x === '') return null;
    if (x instanceof Date) return validDate(x) ? sod(x) : null;
    if (typeof x === 'number') { var d0 = new Date(x); return validDate(d0) ? sod(d0) : null; }
    var s = String(x).trim();
    if (s === 'today') return sod(new Date());
    return parseISO(s) || parseDate(s, this.fmt, this.loc);
  };

  P._isDis = function (d) {
    var n = dn(d);
    if (this.min && n < dn(this.min)) return true;
    if (this.max && n > dn(this.max)) return true;
    var dd = this.o.disabledDays;
    if (dd && dd.indexOf(d.getDay()) > -1) return true;
    for (var i = 0; i < this.disabledRanges.length; i++) {
      if (n >= this.disabledRanges[i][0] && n <= this.disabledRanges[i][1]) return true;
    }
    if (typeof this.o.disable === 'function') {
      try { if (this.o.disable(new Date(d.getTime()))) return true; } catch (e) { /* yoksay */ }
    }
    return false;
  };

  // Gün numarası → devre dışı mı (önbellekli: kullanıcı fonksiyonu gün başına bir kez çağrılır).
  // Önbellek kısıtlar değişince, açılışta ve refresh() ile sıfırlanır.
  P._isDisN = function (n) {
    var c = this._dc;
    if (c[n] !== undefined) return c[n];
    return (c[n] = this._isDis(fromDn(n)));
  };

  // range: başlangıç ve bitiş geçerli bir aralık mı (gün sayısı, aradaki devre dışı günler)
  P._rangeOk = function (a, b) {
    var x = dn(a), y = dn(b);
    if (y < x) { var t = x; x = y; y = t; }
    var count = y - x + 1, o = this.o;
    if (o.minDays && count < o.minDays) return false;
    if (o.maxDays && count > o.maxDays) return false;
    if (!o.allowDisabledInRange && count <= 400) {
      for (var n = x; n <= y; n++) if (this._isDisN(n)) return false;
    }
    return true;
  };

  // Bekleyen başlangıç için izin verilen gün penceresi: başlangıçtan en yakın devre dışı güne
  // ve maxDays'e kadar. Bir kez hesaplanır; sonrası her hücre için O(1) (hover'da tarama yok).
  P._calcWindow = function (start) {
    var o = this.o, s = dn(start), lo = -Infinity, hi = Infinity, n;
    if (o.maxDays) { hi = s + o.maxDays - 1; lo = s - o.maxDays + 1; }
    if (!o.allowDisabledInRange) {
      var cap = o.maxDays || 400;
      for (n = s + 1; n <= s + cap; n++) if (this._isDisN(n)) { hi = Math.min(hi, n - 1); break; }
      for (n = s - 1; n >= s - cap; n--) if (this._isDisN(n)) { lo = Math.max(lo, n + 1); break; }
    }
    return { s: s, lo: lo, hi: hi };
  };

  // Bekleyen başlangıçla birlikte d geçerli bir aralık oluşturur mu (O(1))
  P._pendingOk = function (d) {
    if (!this.pending) return true;
    var s = dn(this.pending);
    if (!this._win || this._win.s !== s) this._win = this._calcWindow(this.pending);
    var w = this._win, n = dn(d);
    if (n < w.lo || n > w.hi) return false;
    return !(this.o.minDays && Math.abs(n - s) + 1 < this.o.minDays);
  };

  /* ---------------------- Değer dönüşümleri ---------------------- */
  P._splitRange = function (s) {
    var sep = this.o.separator.trim();
    var parts = sep ? s.split(sep) : [s];
    if (parts.length !== 2) parts = s.split(/\s+[–—\-]\s+|\s+(?:to|ile|–)\s+/i);
    return parts.length === 2 ? parts : null;
  };

  // Dışarıdan gelen değer → iç temsil (single: Date|null, range: [Date,Date]|null, multiple: Date[])
  P._coerce = function (x) {
    var self = this, m = this.mode;
    var empty = m === 'multiple' ? [] : null;
    if (x == null || x === '') return empty;
    if (m === 'single') {
      if (Array.isArray(x)) x = x[0];
      var d = this._toDate(x);
      return d && !this._isDis(d) ? d : null;
    }
    if (m === 'range') {
      var a, b;
      if (Array.isArray(x)) { a = this._toDate(x[0]); b = this._toDate(x[1]); }
      else if (typeof x === 'string') {
        var iso = /^\s*(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})\s*$/.exec(x); // altInput biçimi
        var p = iso ? [iso[1], iso[2]] : this._splitRange(x);
        if (p) { a = this._toDate(p[0]); b = this._toDate(p[1]); }
      }
      else if (x && typeof x === 'object' && !(x instanceof Date)) { a = this._toDate(x.start || x.from); b = this._toDate(x.end || x.to); }
      if (!a || !b) return null;
      if (dn(b) < dn(a)) { var t = a; a = b; b = t; }
      return this._isDis(a) || this._isDis(b) || !this._rangeOk(a, b) ? null : [a, b];
    }
    var list = Array.isArray(x) ? x : typeof x === 'string' ? x.split(/\s*[;,]\s*/) : [x];
    var seen = {}, out = [];
    list.forEach(function (it) {
      var dd = self._toDate(it);
      if (dd && !self._isDis(dd) && !seen[key(dd)]) { seen[key(dd)] = 1; out.push(dd); }
    });
    out.sort(function (p1, p2) { return p1 - p2; });
    if (this.o.maxDates > 0) out = out.slice(0, this.o.maxDates);
    return out;
  };

  P._key = function (v) {
    if (this.mode === 'single') return v ? key(v) : '';
    if (this.mode === 'range') return v ? key(v[0]) + '/' + key(v[1]) : '';
    return v.map(key).join(',');
  };

  P._text = function (v) {
    var self = this;
    if (this.mode === 'single') return v ? formatDate(v, this.fmt, this.loc) : '';
    if (this.mode === 'range') return v ? formatDate(v[0], this.fmt, this.loc) + this.o.separator + formatDate(v[1], this.fmt, this.loc) : '';
    return v.map(function (d) { return formatDate(d, self.fmt, self.loc); }).join(this.multiSep);
  };

  // Yazılan metin → değer; geçersizse undefined, boşsa boş değer
  P._parseText = function (s) {
    s = String(s == null ? '' : s).trim();
    var empty = this.mode === 'multiple' ? [] : null;
    if (!s) return empty;
    var self = this, d;
    if (this.mode === 'single') {
      d = parseDate(s, this.fmt, this.loc);
      return d && !this._isDis(d) ? d : undefined;
    }
    if (this.mode === 'range') {
      var p = this._splitRange(s);
      if (!p) return undefined;
      var a = parseDate(p[0], this.fmt, this.loc), b = parseDate(p[1], this.fmt, this.loc);
      if (!a || !b) return undefined;
      var v = this._coerce([a, b]);
      return v || undefined;
    }
    var parts = s.split(/\s*[;,]\s*/), out = [], bad = false;
    if (this.fmt.indexOf(',') > -1) parts = s.split(/\s*;\s*/);
    parts.forEach(function (it) {
      var dd = parseDate(it, self.fmt, self.loc);
      if (!dd || self._isDis(dd)) bad = true; else out.push(dd);
    });
    return bad ? undefined : this._coerce(out);
  };

  /* ---------------------- İskelet ---------------------- */
  P._build = function () {
    var el = this.el, o = this.o, t = this.t, id = this.id;
    var pop = h('div', 'cdp-popup cdp-root' + (this.inline ? '' : ' cdp-float') + (o.popupClass ? ' ' + o.popupClass : ''), {
      role: 'dialog',
      'aria-label': this.mode === 'range' ? t.pickRange : this.mode === 'multiple' ? t.pickDates : t.pickDate,
      id: id + '-pop'
    });

    // Mobil sayfa başlığı
    var head = h('div', 'cdp-head');
    head.appendChild(h('span', 'cdp-grab', { 'aria-hidden': 'true' }));
    var row = h('div', 'cdp-head-row');
    var title = h('span', 'cdp-title');
    var close = h('button', 'cdp-sheet-close', { type: 'button', 'aria-label': t.close, title: t.close }, ICON.x);
    row.appendChild(title);
    row.appendChild(close);
    head.appendChild(row);
    pop.appendChild(head);

    // Hazır aralıklar (setOptions ile yeniden kurulabilmesi için tek yerde)
    this.presetBox = null;
    this.pop = pop;
    var cal = h('div', 'cdp-cal');
    pop.appendChild(cal);
    this.cal = cal;
    this._buildPresets();

    // Alt çubuk
    var foot = h('div', 'cdp-foot');
    var bToday = h('button', 'cdp-foot-btn', { type: 'button', 'data-act': 'today' });
    bToday.textContent = t.today;
    var bClear = h('button', 'cdp-foot-btn cdp-muted', { type: 'button', 'data-act': 'clear' });
    bClear.textContent = t.clear;
    var bDone = h('button', 'cdp-foot-btn cdp-primary', { type: 'button', 'data-act': 'done' });
    bDone.textContent = t.done;
    foot.appendChild(bToday);
    foot.appendChild(h('span', 'cdp-foot-spacer'));
    foot.appendChild(bClear);
    foot.appendChild(bDone);
    bToday.hidden = !o.today;
    bClear.hidden = !o.clear;
    foot.hidden = !o.footer;
    pop.appendChild(foot);

    this.pop = pop;
    this.head = head;
    this.title = title;
    this.closeBtn = close;
    this.cal = cal;
    this.foot = foot;
    this.bToday = bToday;
    this.bClear = bClear;
    this.bDone = bDone;
    this.backdrop = h('div', 'cdp-backdrop');

    if (this.inline) {
      el.classList.add('cdp-root', 'cdp-inline');
      if (o.className) o.className.split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.add(c); });
      el.appendChild(pop);
      this.themeEl = el;
    } else {
      // Başlatılmış girdinin kopyası (cloneNode): eklentinin koyduğu sınıf ve nitelikleri temizle,
      // aksi halde bunlar "özgün" değer sanılıp söküm sonrası geri yazılırdı.
      if (el.classList.contains('cdp-input')) {
        el.classList.remove('cdp-input');
        ['role', 'aria-haspopup', 'aria-expanded', 'aria-controls', 'aria-activedescendant'].forEach(function (a) { el.removeAttribute(a); });
      }
      this._saved = {
        type: el.getAttribute('type'),
        placeholder: el.getAttribute('placeholder'),
        autocomplete: el.getAttribute('autocomplete'),
        role: el.getAttribute('role'),
        haspopup: el.getAttribute('aria-haspopup'),
        expanded: el.getAttribute('aria-expanded'),
        controls: el.getAttribute('aria-controls'),
        inputmode: el.getAttribute('inputmode'),
        cls: o.className
      };
      if ((el.getAttribute('type') || '').toLowerCase() === 'date') el.setAttribute('type', 'text');
      el.classList.add('cdp-input');
      if (o.className) o.className.split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.add(c); });
      el.setAttribute('autocomplete', 'off');
      el.setAttribute('role', 'combobox');
      el.setAttribute('aria-haspopup', 'dialog');
      el.setAttribute('aria-expanded', 'false');
      el.setAttribute('aria-controls', id + '-pop');
      this._autoPh = !el.getAttribute('placeholder') && !o.placeholder; // placeholder'ı biz ürettik
      this._setPlaceholder();
      this.themeEl = el;
    }
    this.alt = o.altInput ? (typeof o.altInput === 'string' ? document.querySelector(o.altInput) : o.altInput) : null;
  };

  // Kullanıcı vermediyse placeholder biçimden türetilir; biçim/mod değişince güncellenir
  P._setPlaceholder = function () {
    if (!this.isInput) return;
    var el = this.el, o = this.o;
    if (o.placeholder) el.setAttribute('placeholder', o.placeholder);
    else if (this._autoPh || !el.getAttribute('placeholder')) {
      this._autoPh = true;
      el.setAttribute('placeholder', this.mode === 'range' ? this.fmt + o.separator + this.fmt : this.fmt);
    }
  };

  P._buildPresets = function () {
    var presets = this.o.presets;
    if (this.presetBox && this.presetBox.parentNode) this.presetBox.parentNode.removeChild(this.presetBox);
    this.presetBox = null;
    if (!presets || !presets.length) return;
    var pb = h('div', 'cdp-presets');
    presets.forEach(function (p, i) {
      var b = h('button', 'cdp-preset', { type: 'button', 'data-p': i });
      b.textContent = p.label;
      pb.appendChild(b);
    });
    this.pop.insertBefore(pb, this.cal);
    this.presetBox = pb;
  };

  P._init = function () {
    var o = this.o, v;
    if (o.value != null) v = this._coerce(o.value);
    else if (this.isInput && this.el.value) {
      var parsed = this._parseText(this.el.value);
      v = parsed === undefined ? this._coerce(this.el.value) : parsed;
    } else v = this._coerce(this.el.getAttribute && this.el.getAttribute('data-value'));
    this.v = v === undefined ? (this.mode === 'multiple' ? [] : null) : v;
    this._emitKey = this._key(this.v);
    this._startView();
    this._syncInput();
    if (this.inline) this._render();
  };

  // Görünüm: değere, yoksa bugüne (sınırlara uydurularak) göre
  P._startView = function () {
    var base = this._anchorDate();
    this.active = base;
    this.view = { y: base.getFullYear(), m: base.getMonth() };
    this.viewMode = 'days';
  };

  P._anchorDate = function () {
    var v = this.v, d;
    if (this.mode === 'single') d = v;
    else if (this.mode === 'range') d = v && v[0];
    else d = v && v[0];
    d = d || sod(new Date());
    if (this.min && dn(d) < dn(this.min)) d = this.min;
    if (this.max && dn(d) > dn(this.max)) d = this.max;
    return d;
  };

  /* ---------------------- Olaylar ---------------------- */
  P._bind = function () {
    var self = this, el = this.el, H = (this._h = {}), pop = this.pop;

    H.popClick = function (e) {
      var b = e.target.closest ? e.target.closest('[data-act],[data-d],[data-m],[data-y],[data-p]') : null;
      if (!b || !pop.contains(b)) return;
      if (b.hasAttribute('data-d')) { if (!b.disabled) self._pick(parseISO(b.getAttribute('data-d'))); return; }
      if (b.hasAttribute('data-m')) { self._pickMonth(+b.getAttribute('data-m')); return; }
      if (b.hasAttribute('data-y')) { self._pickYear(+b.getAttribute('data-y')); return; }
      if (b.hasAttribute('data-p')) { self._preset(+b.getAttribute('data-p')); return; }
      self._act(b.getAttribute('data-act'));
    };
    H.popDown = function (e) {
      // açılır modda odak girdide kalsın; satır içi modda hücreler odak alabilsin
      if (!self.inline && e.target !== self.el) e.preventDefault();
    };
    H.popOver = function (e) {
      if (self.mode !== 'range' || !self.pending) return;
      var b = e.target.closest ? e.target.closest('[data-d]') : null;
      var d = b ? parseISO(b.getAttribute('data-d')) : null;
      if (d && (!self.hover || dn(d) !== dn(self.hover))) { self.hover = d; self._paint(); }
    };
    H.popLeave = function () {
      if (self.hover) { self.hover = null; self._paint(); }
    };
    H.popMove = function () { self.pop.classList.remove('cdp-kb'); };
    H.keydown = function (e) { self._key_(e); };

    pop.addEventListener('click', H.popClick);
    pop.addEventListener('mousedown', H.popDown);
    pop.addEventListener('mouseover', H.popOver);
    pop.addEventListener('mouseleave', H.popLeave);
    pop.addEventListener('pointermove', H.popMove, { passive: true });
    pop.addEventListener('keydown', H.keydown);
    this.backdrop.addEventListener('click', function () { self.close(true); });
    this.closeBtn.addEventListener('click', function () { self.close(true); });

    // Mobil sayfayı aşağı sürükleyerek kapatma
    var drag = null;
    H.dragStart = function (e) {
      if (!self._sheet || (e.button !== undefined && e.button > 0)) return;
      if (e.target.closest && e.target.closest('.cdp-sheet-close')) return;
      drag = { y: e.clientY, t: Date.now(), dy: 0 };
      try { self.head.setPointerCapture(e.pointerId); } catch (x) { /* yoksay */ }
      self.pop.style.transition = 'none';
    };
    H.dragMove = function (e) {
      if (!drag) return;
      drag.dy = Math.max(0, e.clientY - drag.y);
      self.pop.style.transform = 'translateY(' + drag.dy + 'px)';
      self.backdrop.style.opacity = String(Math.max(0, 1 - drag.dy / (self.pop.offsetHeight || 1)));
    };
    H.dragEnd = function () {
      if (!drag) return;
      var d = drag, speed = d.dy / Math.max(1, Date.now() - d.t);
      drag = null;
      self.pop.style.transition = '';
      if (d.dy > 90 || (d.dy > 24 && speed > 0.5)) self.close(true);
      else { self.pop.style.transform = ''; self.backdrop.style.opacity = ''; }
    };
    this.head.addEventListener('pointerdown', H.dragStart);
    this.head.addEventListener('pointermove', H.dragMove);
    this.head.addEventListener('pointerup', H.dragEnd);
    this.head.addEventListener('pointercancel', H.dragEnd);

    H.docPointer = function (e) {
      var t = e.target;
      if (pop.contains(t) || t === self.el || t === self.backdrop) return;
      if (self._toggles.some(function (b) { return b === t || b.contains(t); })) return;
      self.close(false);
    };
    H.reposition = function (e) {
      var t = e && e.target;
      if (t && t.nodeType === 1 && pop.contains(t)) return;
      if (!self.el.isConnected) { self.close(false); return; }
      if (self._raf) return;
      self._raf = requestAnimationFrame(function () { self._raf = 0; if (self.isOpen) self._position(); });
    };

    this._toggles = [];
    if (this.isInput) {
      H.click = function () { if (!self.isOpen && self.o.openOn !== 'focus') self.open(); };
      H.focus = function () { if (!self.isOpen && !self._refocusing && self.o.openOn === 'focus') self.open(); };
      H.input = function () { self._onInput(); };
      H.change = function (e) { self._onNativeChange(e); };
      H.blur = function () { /* değişiklik 'change' olayında uygulanır */ };
      H.inKey = function (e) { self._key_(e); };
      H.formReset = function () { setTimeout(function () { if (!self._dead) self.refresh(); }, 0); };
      el.addEventListener('click', H.click);
      el.addEventListener('focus', H.focus);
      el.addEventListener('input', H.input);
      el.addEventListener('change', H.change, true); // yakalama: diğer dinleyicilerden önce normalize et
      el.addEventListener('keydown', H.inKey);
      this._form = el.form;
      if (this._form) this._form.addEventListener('reset', H.formReset);

      var tg = this.o.toggle;
      if (tg) {
        this._toggles = (typeof tg === 'string' ? toArray(document.querySelectorAll(tg)) : [tg]).filter(Boolean);
        H.toggle = function (e) { e.preventDefault(); self.toggle(); };
        this._toggles.forEach(function (b) { b.addEventListener('click', H.toggle); });
      }

      if (typeof MutationObserver !== 'undefined') {
        this._mo = new MutationObserver(function () {
          if (el.disabled && self.isOpen) self.close(false);
        });
        this._mo.observe(el, { attributes: true, attributeFilter: ['disabled'] });
      }
    }
  };

  /* ---------------------- Girdi eşitleme / yazma ---------------------- */
  P._syncInput = function () {
    var txt = this._text(this.v);
    this._cur = txt;
    if (this.isInput && this.el.value !== txt) this.el.value = txt;
    if (this.alt) {
      var v = this.v, s = '';
      if (this.mode === 'single') s = v ? key(v) : '';
      else if (this.mode === 'range') s = v ? key(v[0]) + '/' + key(v[1]) : '';
      else s = v.map(key).join(',');
      this.alt.value = s;
    }
  };

  P._onInput = function () {
    this._dirty = true;
    var v = this._parseText(this.el.value);
    if (v === undefined) return;
    this.v = v;
    var a = this._anchorDate(), ov = this.view.y * 12 + this.view.m, om = this.viewMode;
    this.active = a;
    this.view = { y: a.getFullYear(), m: a.getMonth() };
    this.viewMode = 'days';
    if (!this.isOpen) return;
    // Aynı ay görünüyorsa yalnızca seçimi boya; aksi halde yeniden çiz
    var n = this._nMonths(), idx = (a.getFullYear() * 12 + a.getMonth()) - ov;
    if (om === 'days' && idx >= 0 && idx < n) { this.view = { y: Math.floor(ov / 12), m: ov % 12 }; this._paint(); }
    else { this._render(); this._position(); }
  };

  // Kullanıcı yazıp çıktığında yerel 'change' olayı gelir: diğer dinleyiciler görmeden normalize et
  P._onNativeChange = function (e) {
    if (!e.isTrusted || this._silent) return;
    var txt = this.el.value, v = this._parseText(txt);
    var changed;
    if (v === undefined) v = this.v; // geçersiz: önceki değere dön
    else this.v = v;
    this._syncInput();
    this._dirty = false;
    changed = this._key(this.v) !== this._emitKey;
    if (!changed) { e.stopImmediatePropagation(); return; } // gereksiz tekrar bildirimi engelle
    this._emitKey = this._key(this.v);
    this._paint();
    this._cb(this.o.onChange, this.getValue(), this);
    this._fire('change', false);
  };

  P._commitText = function () {
    if (!this._dirty) return;
    var v = this._parseText(this.el.value);
    var prev = this._emitKey;
    if (v !== undefined) this.v = v;
    this._syncInput();
    this._dirty = false;
    if (this._key(this.v) !== prev) this._commit();
  };

  // Seçici ile değer değişince: girdiyi güncelle, olayları yay
  P._commit = function () {
    var k = this._key(this.v);
    this._syncInput();
    this._dirty = false;
    if (k === this._emitKey) { this._paint(); return false; }
    this._emitKey = k;
    this._paint();
    if (this.isInput) {
      this._silent = true;
      try {
        this.el.dispatchEvent(new Event('input', { bubbles: true }));
        this.el.dispatchEvent(new Event('change', { bubbles: true }));
      } finally { this._silent = false; }
    }
    this._cb(this.o.onChange, this.getValue(), this);
    this._fire('change', true);
    return true;
  };

  P._fire = function (name) {
    try {
      this.el.dispatchEvent(new CustomEvent('cdp:' + name, { bubbles: true, detail: { value: this.getValue(), instance: this } }));
    } catch (e) { /* eski tarayıcı */ }
  };

  P._cb = function (fn) {
    if (typeof fn !== 'function') return;
    try { fn.apply(this, Array.prototype.slice.call(arguments, 1)); }
    catch (e) { if (typeof console !== 'undefined' && console.error) console.error('CustomDatePicker callback hatası:', e); }
  };

  /* ---------------------- Seçim ---------------------- */
  P._closeOnSelect = function () {
    var c = this.o.closeOnSelect;
    return c === null || c === undefined ? this.mode !== 'multiple' : !!c;
  };

  P._pick = function (d) {
    if (!d) return;
    // Aralık: başlangıç gününe tekrar basmak, aynı gün geçerli bir aralık değilse seçimi iptal eder
    if (this.mode === 'range' && this.pending && dn(d) === dn(this.pending) && !this._rangeOk(d, d)) {
      this.pending = null;
      this.hover = null;
      this.active = d;
      this._paint();
      return;
    }
    if (this._blocked(d)) return;
    this.active = d;
    var m = this.mode;
    if (m === 'single') {
      this.v = d;
      this._afterPick(true);
    } else if (m === 'range') {
      if (!this.pending) {
        this.pending = d;
        this.hover = null;
      } else {
        var a = this.pending, b = d;
        if (dn(b) < dn(a)) { var t = a; a = b; b = t; }
        this.v = [a, b];
        this.pending = null;
        this.hover = null;
        this._afterPick(true);
        return;
      }
    } else {
      var k = key(d), list = this.v.slice(), i = -1;
      list.forEach(function (x, idx) { if (key(x) === k) i = idx; });
      if (i > -1) list.splice(i, 1);
      else {
        if (this.o.maxDates > 0 && list.length >= this.o.maxDates) return;
        list.push(d);
        list.sort(function (p, q) { return p - q; });
      }
      this.v = list;
      this._afterPick(false);
      return;
    }
    this._followActive();
    this._render();
    this._pos();
  };

  P._afterPick = function (maybeClose) {
    this._followActive();
    this._commit();
    this._render();
    if (maybeClose && this._closeOnSelect() && !this.inline) this.close(true);
    else this._pos();
  };

  P._pos = function () { if (this.isOpen) this._position(); };

  // Pencere dışındaki bir güne tıklanınca / klavye ile gidilince görünümü ona getir
  P._followActive = function () {
    var a = this.active, n = this._nMonths();
    var idx = (a.getFullYear() - this.view.y) * 12 + (a.getMonth() - this.view.m);
    if (this.viewMode !== 'days') return;
    if (idx < 0) this.view = { y: a.getFullYear(), m: a.getMonth() };
    else if (idx >= n) {
      var s = addMonths(mk(a.getFullYear(), a.getMonth(), 1), -(n - 1));
      this.view = { y: s.getFullYear(), m: s.getMonth() };
    }
  };

  P._blocked = function (d) {
    if (this._isDisN(dn(d))) return true;
    if (this.mode === 'range' && this.pending && !this._pendingOk(d)) return true;
    if (this.mode === 'multiple' && this.o.maxDates > 0 && this.v.length >= this.o.maxDates && !this._has(d)) return true;
    return false;
  };

  P._has = function (d) {
    var k = key(d);
    return this.v.some(function (x) { return key(x) === k; });
  };

  P._pickMonth = function (m) {
    this.view = { y: this.view.y, m: m };
    this.active = this._clampActive(mk(this.view.y, m, Math.min(this.active.getDate(), 28)));
    this.viewMode = 'days';
    this._viewChanged();
    this._render();
    this._pos();
    this._focusCell();
  };

  P._pickYear = function (y) {
    this.view = { y: y, m: this.view.m };
    this.viewMode = 'months';
    this._viewChanged();
    this._render();
    this._pos();
  };

  P._clampActive = function (d) {
    if (this.min && dn(d) < dn(this.min)) return this.min;
    if (this.max && dn(d) > dn(this.max)) return this.max;
    return d;
  };

  P._preset = function (i) {
    var p = this.o.presets[i];
    if (!p) return;
    var val = typeof p.value === 'function' ? p.value() : p.value;
    var v = this._coerce(val);
    if (this.mode !== 'multiple' ? !v : !v.length) return;
    this.v = v;
    this.pending = null;
    var a = this._anchorDate();
    this.active = a;
    this.view = { y: a.getFullYear(), m: a.getMonth() };
    this.viewMode = 'days';
    this._commit();
    this._render();
    if (this._closeOnSelect() && !this.inline) this.close(true); else this._pos();
  };

  P._act = function (act) {
    switch (act) {
      case 'prev': this._nav(-1); break;
      case 'next': this._nav(1); break;
      case 'vmonths': this.viewMode = 'months'; this._render(); this._pos(); break;
      case 'vyears': this.viewMode = 'years'; this._render(); this._pos(); break;
      case 'today': this._today(); break;
      case 'clear': this.clear(true); if (!this.inline) this.close(true); break;
      case 'done': this.close(true); break;
    }
  };

  P._today = function () {
    var t = sod(new Date());
    if (this._isDis(t)) { this._goto(this._clampActive(t)); return; }
    if (this.mode === 'single') this._pick(t);
    else { this._goto(t); }
  };

  P._goto = function (d) {
    this.active = d;
    this.view = { y: d.getFullYear(), m: d.getMonth() };
    this.viewMode = 'days';
    this._viewChanged();
    this._render();
    this._pos();
    this._focusCell();
  };

  P._nav = function (dir) {
    var v = this.view;
    if (this.viewMode === 'days') {
      var d = mk(v.y, v.m + dir, 1);
      this.view = { y: d.getFullYear(), m: d.getMonth() };
    } else if (this.viewMode === 'months') {
      this.view = { y: v.y + dir, m: v.m };
    } else {
      this.view = { y: v.y + dir * 12, m: v.m };
    }
    this._viewChanged();
    this._render();
    this._pos();
  };

  P._viewChanged = function () {
    this._cb(this.o.onViewChange, { year: this.view.y, month: this.view.m, mode: this.viewMode }, this);
  };

  /* ---------------------- Çizim ---------------------- */
  P._nMonths = function () {
    return this.viewMode === 'days' && !this._sheet && this.o.months >= 2 ? 2 : 1;
  };

  P._render = function () {
    var cal = this.cal, n = this._nMonths();

    // Satır içi modda odak yeniden çizimde kaybolmasın: odaktaki öğeyi hatırla, sonra geri ver
    var fk = null, ae = document.activeElement;
    if (this.inline && ae && ae !== document.body && this.pop.contains(ae)) {
      ['data-act', 'data-d', 'data-m', 'data-y'].some(function (a) {
        if (ae.hasAttribute && ae.hasAttribute(a)) { fk = [a, ae.getAttribute(a)]; return true; }
        return false;
      });
    }

    cal.textContent = '';
    this.cells = [];
    this.cellMap = {};
    this.pop.classList.toggle('cdp-has-wk', !!this.o.weekNumbers);
    if (this.viewMode === 'days') {
      for (var i = 0; i < n; i++) cal.appendChild(this._monthBlock(i, i === 0, i === n - 1));
    } else if (this.viewMode === 'months') {
      cal.appendChild(this._monthsBlock());
    } else {
      cal.appendChild(this._yearsBlock());
    }
    this._paint();

    if (fk) {
      var t = this.pop.querySelector('[' + fk[0] + '="' + fk[1] + '"]');
      if (t && t.focus) t.focus({ preventScroll: true });
    }
  };

  P._navBar = function (first, last, titleNodes, labels, prevDis, nextDis) {
    var nav = h('div', 'cdp-nav');
    if (first) {
      var p = h('button', 'cdp-nav-btn', { type: 'button', 'data-act': 'prev', 'aria-label': labels[0] }, ICON.prev);
      p.disabled = !!prevDis;
      nav.appendChild(p);
    } else nav.appendChild(h('span', 'cdp-nav-spacer'));
    var ttl = h('div', 'cdp-nav-title', { 'aria-live': 'polite' });
    titleNodes.forEach(function (n) { ttl.appendChild(n); });
    nav.appendChild(ttl);
    if (last) {
      var nx = h('button', 'cdp-nav-btn', { type: 'button', 'data-act': 'next', 'aria-label': labels[1] }, ICON.next);
      nx.disabled = !!nextDis;
      nav.appendChild(nx);
    } else nav.appendChild(h('span', 'cdp-nav-spacer'));
    return nav;
  };

  P._monthBlock = function (i, first, last) {
    var self = this, o = this.o, N = names(this.loc), t = this.t;
    var base = mk(this.view.y, this.view.m + i, 1), month = base.getMonth();
    var blk = h('div', 'cdp-month' + (o.weekNumbers ? ' cdp-wk' : ''));

    var mBtn = h('button', 'cdp-link', { type: 'button', 'data-act': 'vmonths', 'aria-label': t.chooseMonth });
    mBtn.textContent = N.months[month];
    var yBtn = h('button', 'cdp-link', { type: 'button', 'data-act': 'vyears', 'aria-label': t.chooseYear });
    yBtn.textContent = base.getFullYear();
    var prevLast = addDays(base, -1), nextFirst = mk(this.view.y, this.view.m + this._nMonths(), 1);
    blk.appendChild(this._navBar(first, last, [mBtn, yBtn], [t.prevMonth, t.nextMonth],
      this.min && dn(prevLast) < dn(this.min), this.max && dn(nextFirst) > dn(this.max)));

    var grid = h('div', 'cdp-grid', { role: 'grid', 'aria-label': N.months[month] + ' ' + base.getFullYear() });
    var dow = h('div', 'cdp-row', { role: 'row' });
    if (o.weekNumbers) { var wh = h('span', 'cdp-dow', { role: 'columnheader' }); wh.textContent = t.week; dow.appendChild(wh); }
    for (var k = 0; k < 7; k++) {
      var di = (this.ws + k) % 7;
      var dh = h('span', 'cdp-dow', { role: 'columnheader', 'aria-label': N.days[di] });
      dh.textContent = N.daysShort[di];
      dow.appendChild(dh);
    }
    grid.appendChild(dow);

    var start = addDays(base, -((base.getDay() - this.ws + 7) % 7));
    var fmtLong = longFormatter(this.loc);
    var nM = this._nMonths();

    for (var r = 0; r < 6; r++) {
      var row = h('div', 'cdp-row', { role: 'row' });
      if (o.weekNumbers) {
        var thu = addDays(start, r * 7 + ((4 - this.ws + 7) % 7));
        var wn = h('span', 'cdp-wnum', { 'aria-hidden': 'true' });
        wn.textContent = isoWeek(thu);
        row.appendChild(wn);
      }
      for (var c = 0; c < 7; c++) {
        var d = addDays(start, r * 7 + c), main = d.getMonth() === month;
        // İki ay yan yana iken tekrar eden dış günler yalnızca dış kenarlarda gösterilir
        var show = main || (o.showOutsideDays && (nM === 1 ||
          (first && dn(d) < dn(base)) || (last && !first && dn(d) > dn(base))));
        if (!show) { row.appendChild(h('span', 'cdp-day-empty')); continue; }
        var kd = key(d);
        var b = h('button', 'cdp-day cdp-c' + c, {
          type: 'button',
          tabindex: '-1',
          role: 'gridcell',
          'data-d': kd,
          id: this.id + (main ? '-d-' : '-o-') + kd + (main ? '' : '-' + i),
          'aria-label': fmtLong.format(d),
          'aria-selected': 'false'
        });
        var num = h('span', 'cdp-num');
        num.textContent = d.getDate();
        b.appendChild(num);
        row.appendChild(b);
        var cell = { el: b, d: d, n: dn(d), main: main, col: c, dis: this._isDisN(dn(d)) };
        this.cells.push(cell);
        if (main || !this.cellMap[kd]) this.cellMap[kd] = cell;
      }
      grid.appendChild(row);
    }
    blk.appendChild(grid);
    return blk;
  };

  P._monthsBlock = function () {
    var self = this, N = names(this.loc), t = this.t, y = this.view.y;
    var blk = h('div', 'cdp-month');
    var yBtn = h('button', 'cdp-link', { type: 'button', 'data-act': 'vyears', 'aria-label': t.chooseYear });
    yBtn.textContent = y;
    blk.appendChild(this._navBar(true, true, [yBtn], [t.prevYear, t.nextYear],
      this.min && y - 1 < this.min.getFullYear(), this.max && y + 1 > this.max.getFullYear()));
    var g = h('div', 'cdp-grid3', { role: 'grid' });
    this.cells = [];
    for (var m = 0; m < 12; m++) {
      var first = mk(y, m, 1), last = mk(y, m + 1, 0);
      var dis = (this.min && dn(last) < dn(this.min)) || (this.max && dn(first) > dn(this.max));
      var b = h('button', 'cdp-cell', { type: 'button', 'data-m': m, role: 'gridcell', tabindex: '-1', id: this.id + '-m-' + m });
      b.textContent = N.monthsShort[m];
      b.setAttribute('aria-label', N.months[m] + ' ' + y);
      b.disabled = !!dis;
      g.appendChild(b);
      this.cells.push({ el: b, kind: 'm', i: m });
    }
    blk.appendChild(g);
    return blk;
  };

  P._yearsBlock = function () {
    var t = this.t, base = Math.floor(this.view.y / 12) * 12;
    var blk = h('div', 'cdp-month');
    var lbl = h('span', 'cdp-link', { 'aria-live': 'polite' });
    lbl.textContent = base + ' – ' + (base + 11);
    blk.appendChild(this._navBar(true, true, [lbl], [t.prevYears, t.nextYears],
      this.min && base - 1 < this.min.getFullYear(), this.max && base + 12 > this.max.getFullYear()));
    var g = h('div', 'cdp-grid3', { role: 'grid' });
    this.cells = [];
    for (var i = 0; i < 12; i++) {
      var y = base + i;
      var dis = (this.min && y < this.min.getFullYear()) || (this.max && y > this.max.getFullYear());
      var b = h('button', 'cdp-cell', { type: 'button', 'data-y': y, role: 'gridcell', tabindex: '-1', id: this.id + '-y-' + y });
      b.textContent = y;
      b.disabled = !!dis;
      g.appendChild(b);
      this.cells.push({ el: b, kind: 'y', i: y });
    }
    blk.appendChild(g);
    return blk;
  };

  // Hücre durumları (seçili, aralık, bugün, devre dışı…) — yeniden çizmeden sınıfları günceller
  P._paint = function () {
    if (!this.isOpen && !this.inline) return; // kapalıyken boyanacak DOM yok
    var self = this, today = dn(new Date()), cur = this.v;
    var act = this.active ? dn(this.active) : null;

    if (this.viewMode !== 'days') {
      var sel = this.mode === 'single' ? cur : (this.mode === 'range' ? (cur && cur[0]) : cur && cur[0]);
      var now = new Date();
      this.cells.forEach(function (c) {
        var on = false, isNow = false, isAct = false;
        if (c.kind === 'm') {
          on = !!sel && sel.getFullYear() === self.view.y && sel.getMonth() === c.i;
          isNow = now.getFullYear() === self.view.y && now.getMonth() === c.i;
          isAct = self.active && self.active.getFullYear() === self.view.y && self.active.getMonth() === c.i;
        } else {
          on = !!sel && sel.getFullYear() === c.i;
          isNow = now.getFullYear() === c.i;
          isAct = self.active && self.active.getFullYear() === c.i;
        }
        var cls = 'cdp-cell' + (on ? ' cdp-sel' : '') + (isNow ? ' cdp-now' : '') + (isAct ? ' cdp-act' : '');
        if (c.el._c !== cls) { c.el.className = cls; c.el._c = cls; }
        c.el.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      this._syncFoot();
      this._aria();
      return;
    }

    var rs = null, re = null, preview = false, set = null;
    if (this.mode === 'range') {
      if (this.pending) {
        rs = dn(this.pending);
        if (this.hover) { re = dn(this.hover); if (re < rs) { var tmp = rs; rs = re; re = tmp; } }
        else re = rs;
        preview = true;
      } else if (cur) { rs = dn(cur[0]); re = dn(cur[1]); }
    } else if (this.mode === 'multiple') {
      set = {};
      cur.forEach(function (d) { set[dn(d)] = true; });
    }
    var pendingN = this.pending ? dn(this.pending) : null;

    this.cells.forEach(function (c) {
      var cls = 'cdp-day cdp-c' + c.col, selected = false;
      if (!c.main) cls += ' cdp-out';
      if (c.n === today) cls += ' cdp-today';
      var dis = c.dis || (pendingN !== null && c.n !== pendingN && !self._pendingOk(c.d)) ||
        (self.mode === 'multiple' && self.o.maxDates > 0 && cur.length >= self.o.maxDates && !set[c.n]);
      if (dis) cls += ' cdp-dis';
      if (self.mode === 'single') { selected = !!cur && c.n === dn(cur); if (selected) cls += ' cdp-sel'; }
      else if (self.mode === 'multiple') { selected = !!set[c.n]; if (selected) cls += ' cdp-sel'; }
      else if (rs !== null) {
        var isS = c.n === rs, isE = c.n === re;
        if (isS) cls += ' cdp-rs';
        if (isE) cls += ' cdp-re';
        selected = isS || isE;
        if (c.n > rs && c.n < re) { cls += preview ? ' cdp-pv' : ' cdp-in'; selected = true; }
      }
      if (act !== null && c.main && c.n === act) cls += ' cdp-act';
      if (c.el._c !== cls) { c.el.className = cls; c.el._c = cls; }
      c.el.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (dis) c.el.setAttribute('aria-disabled', 'true'); else c.el.removeAttribute('aria-disabled');
      if (c.main && c.n === today) c.el.setAttribute('aria-current', 'date'); else c.el.removeAttribute('aria-current');
      c.el.tabIndex = self.inline && c.main && c.n === act ? 0 : -1;
    });
    this._syncFoot();
    this._aria();
  };

  P._syncFoot = function () {
    this.bDone.hidden = !(this._sheet || this.mode === 'multiple');
  };

  P._aria = function () {
    if (this.inline || !this.isInput) return;
    var cell = this.active ? this.cellMap[key(this.active)] : null;
    var id = null;
    if (this.viewMode === 'days') id = cell ? cell.el.id : null;
    else {
      var a = this.active;
      id = this.viewMode === 'months' ? this.id + '-m-' + a.getMonth() : this.id + '-y-' + a.getFullYear();
    }
    if (id && document.getElementById(id)) this.el.setAttribute('aria-activedescendant', id);
    else this.el.removeAttribute('aria-activedescendant');
  };

  P._focusCell = function () {
    if (!this.inline) return;
    var el = this.viewMode === 'days'
      ? (this.cellMap[key(this.active)] || {}).el
      : (this.cells.filter(function (c) { return c.el.classList.contains('cdp-act'); })[0] || {}).el;
    if (el && el.focus) el.focus({ preventScroll: true });
  };

  /* ---------------------- Klavye ---------------------- */
  P._key_ = function (e) {
    if (e.isComposing || this._dead) return;
    var k = e.key, self = this, inInput = this.isInput && e.target === this.el;
    var open = this.isOpen || this.inline;

    if (!open) {
      if (!inInput || this.el.disabled) return;
      if (k === 'ArrowDown' || (k === 'Enter' && this.el.readOnly)) { e.preventDefault(); this.open(); }
      return;
    }

    var typing = inInput && this._dirty && !this.el.readOnly;
    var rtl = getComputedStyle(this.themeEl).direction === 'rtl';
    var step = null;

    switch (k) {
      case 'Escape':
        if (this.viewMode !== 'days') { this.viewMode = 'days'; this._render(); this._pos(); }
        else if (!this.inline) {
          this._dirty = false; this._syncInput(); // yazılanı geri al
          this.close(true);
        } else return;
        e.preventDefault(); e.stopPropagation();
        return;
      case 'Tab':
        if (!this.inline) this.close(true); // yazılan metin close içinde uygulanır
        return;
      case 'Enter':
        if (typing) {
          e.preventDefault();
          this._commitText();
          this._reanchor();
          if (!this.inline && this._closeOnSelect()) this.close(true); else this._render();
          return;
        }
        e.preventDefault();
        this._activate();
        return;
      case ' ':
        if (inInput && !this.el.readOnly) return; // girdide boşluk yazılır
        e.preventDefault();
        this._activate();
        return;
      case 'ArrowLeft': if (typing) return; step = rtl ? 1 : -1; break;
      case 'ArrowRight': if (typing) return; step = rtl ? -1 : 1; break;
      case 'ArrowUp': step = -7; break;
      case 'ArrowDown': step = 7; break;
      case 'Home': if (typing) return; step = 'home'; break;
      case 'End': if (typing) return; step = 'end'; break;
      case 'PageUp': step = e.shiftKey ? 'py' : 'pm'; this._sign = -1; break;
      case 'PageDown': step = e.shiftKey ? 'py' : 'pm'; this._sign = 1; break;
      default: return;
    }
    e.preventDefault();
    this.pop.classList.add('cdp-kb');
    this._move(step);
    void self;
  };

  P._reanchor = function () {
    var a = this._anchorDate();
    this.active = a;
    this.view = { y: a.getFullYear(), m: a.getMonth() };
  };

  P._move = function (step) {
    var a = this.active, vm = this.viewMode, n;
    var sign = this._sign || 1;
    if (vm === 'days') {
      if (typeof step === 'number') n = addDays(a, step);
      else if (step === 'home') n = addDays(a, -((a.getDay() - this.ws + 7) % 7));
      else if (step === 'end') n = addDays(a, 6 - ((a.getDay() - this.ws + 7) % 7));
      else if (step === 'pm') n = addMonths(a, sign);
      else n = addYears(a, sign);
    } else if (vm === 'months') {
      if (typeof step === 'number') {
        var s = step === 7 ? 3 : step === -7 ? -3 : step;
        n = addMonths(a, s);
      } else if (step === 'home') n = mk(a.getFullYear(), 0, 1);
      else if (step === 'end') n = mk(a.getFullYear(), 11, 1);
      else n = addYears(a, sign);
    } else {
      if (typeof step === 'number') {
        var s2 = step === 7 ? 3 : step === -7 ? -3 : step;
        n = addYears(a, s2);
      } else if (step === 'home') n = addYears(a, -(((a.getFullYear() % 12) + 12) % 12));
      else if (step === 'end') n = addYears(a, 11 - (((a.getFullYear() % 12) + 12) % 12));
      else n = addYears(a, sign * 12);
    }
    n = this._clampActive(n);
    this.active = n;
    var before = this.view.y * 12 + this.view.m, pageBefore = Math.floor(this.view.y / 12);
    if (vm === 'days') this._followActive();
    else this.view = { y: n.getFullYear(), m: n.getMonth() };
    var after = this.view.y * 12 + this.view.m;
    if (after !== before) this._viewChanged();

    // Görünen sayfa değişmediyse DOM'u yeniden kurmadan yalnızca sınıfları güncelle
    var moved = vm === 'days' ? after !== before
      : vm === 'months' ? Math.floor(after / 12) !== Math.floor(before / 12)
      : Math.floor(this.view.y / 12) !== pageBefore;
    if (moved) { this._render(); this._pos(); } else this._paint();
    this._focusCell();
  };

  P._activate = function () {
    var vm = this.viewMode, a = this.active;
    if (vm === 'days') this._pick(a);
    else if (vm === 'months') this._pickMonth(a.getMonth());
    else this._pickYear(a.getFullYear());
  };

  /* ---------------------- Aç / kapat / konumlandır ---------------------- */
  P._isSheet = function () {
    if (this.inline) return false;
    var s = this.o.sheet;
    if (s === true) return true;
    if (s === false || !window.matchMedia) return false;
    return window.matchMedia('(max-width:' + this.o.sheetBreakpoint + 'px)').matches;
  };

  P._root = function () {
    var r = this.el.closest && this.el.closest('dialog,.modal,[aria-modal="true"],[data-cdp-root]');
    return r || document.body;
  };

  P._applyTheme = function () {
    var cs = getComputedStyle(this.themeEl), m = this.pop.style;
    var sheet = this._sheet;
    TOKENS.forEach(function (t) {
      var v = cs.getPropertyValue('--cdpi-' + t).trim();
      // mobil sayfada hücre boyutu ekran genişliğine göre CSS'ten gelir
      if (v && !(t === 'cell' && sheet)) m.setProperty('--cdpi-' + t, v);
      else m.removeProperty('--cdpi-' + t);
    });
    m.fontFamily = cs.fontFamily;
    m.colorScheme = cs.colorScheme;
    var z = parseInt(cs.getPropertyValue('--cdpi-z'), 10) || 2000;
    this.backdrop.style.zIndex = z - 1;
  };

  P._sheetTitle = function () {
    var l = this.el.labels && this.el.labels[0];
    this.title.textContent = (l && l.textContent.trim()) || this.el.getAttribute('aria-label') ||
      this.el.getAttribute('placeholder') || this.pop.getAttribute('aria-label');
  };

  // Sayfa kaydırma kilidi: takvim ve select aynı <html> üzerindeki ortak sayaçla çalışır (bkz. select.cjs)
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

  P._position = function () {
    if (this.inline) return;
    if (!this.el.isConnected) { this.close(false); return; }
    var pop = this.pop, st = pop.style;
    var sheet = this._isSheet();
    var changed = sheet !== this._sheet;
    this._sheet = sheet;
    pop.classList.toggle('cdp-sheet', sheet);
    if (changed) { this._applyTheme(); this._render(); } // ay sayısı ve hücre boyutu değişir

    if (sheet) {
      if (!this.backdrop.parentNode && pop.parentNode) pop.parentNode.insertBefore(this.backdrop, pop);
      st.left = st.top = st.bottom = st.maxHeight = '';
      pop.classList.remove('cdp-up');
      this._lock(true);
      return;
    }
    this._lock(false);
    if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);

    var r = this.el.getBoundingClientRect(), de = document.documentElement;
    var vw = de.clientWidth, vh = de.clientHeight, gap = 6, padv = 8;
    var below = vh - r.bottom - gap - padv, above = r.top - gap - padv;
    st.maxHeight = '';
    st.left = '0px';
    var natural = pop.offsetHeight, w = pop.offsetWidth;
    var up = natural > below && above > below;
    var avail = Math.max(200, up ? above : below);
    st.maxHeight = avail + 'px';

    var rtl = getComputedStyle(this.el).direction === 'rtl';
    var left = rtl ? r.right - w : r.left;
    left = Math.min(Math.max(padv, left), Math.max(padv, vw - w - padv));
    st.left = left + 'px';
    if (up) { st.top = 'auto'; st.bottom = vh - r.top + gap + 'px'; }
    else { st.bottom = 'auto'; st.top = r.bottom + gap + 'px'; }
    pop.classList.toggle('cdp-up', up);

    // transform / filter içeren bir üst eleman için gerçek konumu ölçüp farkı telafi et
    var a = pop.getBoundingClientRect(), dx = left - a.left;
    if (Math.abs(dx) > 0.5) st.left = left + dx + 'px';
    if (up) {
      var db = a.bottom - (r.top - gap);
      if (Math.abs(db) > 0.5) st.bottom = parseFloat(st.bottom) + db + 'px';
    } else {
      var dt = r.bottom + gap - a.top;
      if (Math.abs(dt) > 0.5) st.top = parseFloat(st.top) + dt + 'px';
    }
  };

  P.open = function () {
    if (this.inline || this.isOpen || this._dead || !this.el.isConnected) return this;
    if (this.el.disabled) return this;
    if (!this.el.getClientRects().length) return this; // görünmeyen (display:none) girdide konumlandırılamaz

    // Girdi dışarıdan olaysız değiştirildiyse (input.value = …) açılırken yeniden oku
    if (this.isInput && !this._dirty && this.el.value !== this._cur) {
      var ext = this._parseText(this.el.value);
      if (ext !== undefined) { this.v = ext; this._emitKey = this._key(ext); }
      this._syncInput();
    }
    this._dc = {}; // devre dışı gün önbelleği (kullanıcı fonksiyonu değişmiş olabilir)
    this._win = null;
    if (CustomDatePicker._open && CustomDatePicker._open !== this) CustomDatePicker._open.close(false);
    CustomDatePicker._open = this;
    this.isOpen = true;

    this._sheet = this._isSheet();
    this._applyTheme();
    this.pending = null;
    this.hover = null;
    this._startView();
    this._sheetTitle();
    this.pop.style.transform = '';
    this.backdrop.style.opacity = '';
    this._root().appendChild(this.pop);
    this._render();
    this.pop.classList.add('cdp-show');
    this._position();

    this.el.setAttribute('aria-expanded', 'true');
    if (this._sheet) { // mobilde ekran klavyesi açılmasın
      this._prevMode = this.el.getAttribute('inputmode');
      this._imSet = true;
      this.el.setAttribute('inputmode', 'none');
    }
    document.addEventListener('pointerdown', this._h.docPointer, true);
    window.addEventListener('resize', this._h.reposition);
    window.addEventListener('scroll', this._h.reposition, true);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this._h.reposition);
    // Klavye dinleyicileri girdide ve takvimde; düğmeyle açıldıysa odağı girdiye al (sheet'te ekran klavyesi açılmasın)
    if (!this._sheet && this.isInput && document.activeElement !== this.el) {
      try { this.el.focus({ preventScroll: true }); } catch (e) { /* odaklanamayan girdi */ }
    }
    this._cb(this.o.onOpen, this);
    this._fire('open');
    return this;
  };

  P.close = function (refocus) {
    if (this.inline || !this.isOpen) return this;
    this.isOpen = false;
    if (CustomDatePicker._open === this) CustomDatePicker._open = null;
    this._commitText(); // yazılmış metni uygula (geçersizse geri alınır)
    this.pending = null;
    this.hover = null;
    this._lock(false);
    this.pop.classList.remove('cdp-show', 'cdp-up', 'cdp-kb');
    if (this.pop.parentNode) this.pop.parentNode.removeChild(this.pop);
    if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
    this.el.setAttribute('aria-expanded', 'false');
    this.el.removeAttribute('aria-activedescendant');
    if (this._imSet) {
      this._imSet = false;
      if (this._prevMode == null) this.el.removeAttribute('inputmode'); else this.el.setAttribute('inputmode', this._prevMode);
    }
    document.removeEventListener('pointerdown', this._h.docPointer, true);
    window.removeEventListener('resize', this._h.reposition);
    window.removeEventListener('scroll', this._h.reposition, true);
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', this._h.reposition);
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
    if (refocus) {
      this._refocusing = true; // openOn:'focus' iken kapanınca yeniden açılmasın
      this.el.focus({ preventScroll: true });
      this._refocusing = false;
    }
    this._cb(this.o.onClose, this);
    this._fire('close');
    return this;
  };

  P.toggle = function () { return this.isOpen ? this.close(true) : this.open(); };

  /* ---------------------- Genel API ---------------------- */
  P.getValue = function () {
    var v = this.v;
    if (this.mode === 'single') return v ? new Date(v.getTime()) : null;
    if (this.mode === 'range') return v ? [new Date(v[0].getTime()), new Date(v[1].getTime())] : null;
    return v.map(function (d) { return new Date(d.getTime()); });
  };

  P.getText = function () { return this._text(this.v); };

  // Değeri ayarla; emit=true ise input/change olayları tetiklenir
  P.setValue = function (value, emit) {
    if (this._dead) return this;
    var v = this._coerce(value);
    this.v = v === undefined ? (this.mode === 'multiple' ? [] : null) : v;
    this._dirty = false; // programatik atama, yazılmış ama uygulanmamış metinden önceliklidir
    this.pending = null;
    var a = this._anchorDate();
    this.active = a;
    this.view = { y: a.getFullYear(), m: a.getMonth() };
    if (emit) this._commit();
    else { this._syncInput(); this._emitKey = this._key(this.v); }
    if (this.isOpen || this.inline) { this._render(); this._pos(); }
    return this;
  };

  P.clear = function (emit) {
    return this.setValue(this.mode === 'multiple' ? [] : null, emit);
  };

  // Girdiyi (örn. dışarıdan değiştirilen input.value) yeniden okur
  P.refresh = function () {
    if (this._dead) return this;
    this._dc = {}; // disable() sonuçları değişmiş olabilir
    this._win = null;
    this._dirty = false;
    if (this.isInput) {
      var v = this._parseText(this.el.value);
      this.v = v === undefined ? (this.mode === 'multiple' ? [] : null) : v;
      this._emitKey = this._key(this.v);
      this._syncInput();
    }
    this._startView();
    if (this.isOpen || this.inline) { this._render(); this._pos(); }
    return this;
  };

  P.goTo = function (date) {
    var d = this._toDate(date);
    if (d) this._goto(this._clampActive(d));
    return this;
  };

  // Seçenekleri güncelle (min, max, disabledDates, locale, format…)
  P.setOptions = function (opts) {
    extend(this.o, opts);
    var old = this._text(this.v);
    this._setup();
    this.alt = this.o.altInput ? (typeof this.o.altInput === 'string' ? document.querySelector(this.o.altInput) : this.o.altInput) : this.alt;
    var v = this._coerce(this.v);
    this.v = v === undefined ? (this.mode === 'multiple' ? [] : null) : v;
    this.bToday.textContent = this.t.today;
    this.bClear.textContent = this.t.clear;
    this.bDone.textContent = this.t.done;
    this.closeBtn.setAttribute('aria-label', this.t.close);
    this.closeBtn.setAttribute('title', this.t.close);
    this.pop.setAttribute('aria-label', this.mode === 'range' ? this.t.pickRange : this.mode === 'multiple' ? this.t.pickDates : this.t.pickDate);
    this.bToday.hidden = !this.o.today;
    this.bClear.hidden = !this.o.clear;
    this.foot.hidden = !this.o.footer;
    if (opts && 'presets' in opts) this._buildPresets();
    this._setPlaceholder();
    this._syncInput();
    void old;
    this._startView();
    if (this.isOpen || this.inline) { this._render(); this._pos(); }
    return this;
  };

  P.enable = function () { if (this.isInput) this.el.disabled = false; return this; };
  P.disable = function () { if (this.isInput) { this.close(false); this.el.disabled = true; } return this; };

  P.destroy = function () {
    if (this._dead) return;
    this.close(false);
    this._dead = true;
    var el = this.el, H = this._h;
    if (this._mo) this._mo.disconnect();
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.isInput) {
      el.removeEventListener('click', H.click);
      el.removeEventListener('focus', H.focus);
      el.removeEventListener('input', H.input);
      el.removeEventListener('change', H.change, true);
      el.removeEventListener('keydown', H.inKey);
      if (this._form) this._form.removeEventListener('reset', H.formReset);
      this._toggles.forEach(function (b) { b.removeEventListener('click', H.toggle); });
      var s = this._saved;
      [['type', s.type], ['placeholder', s.placeholder], ['autocomplete', s.autocomplete], ['role', s.role],
        ['aria-haspopup', s.haspopup], ['aria-expanded', s.expanded], ['aria-controls', s.controls],
        ['inputmode', s.inputmode]].forEach(function (p) {
        if (p[1] == null) el.removeAttribute(p[0]); else el.setAttribute(p[0], p[1]);
      });
      el.removeAttribute('aria-activedescendant');
      el.classList.remove('cdp-input');
      if (s.cls) s.cls.split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.remove(c); });
    } else {
      if (this.pop.parentNode) this.pop.parentNode.removeChild(this.pop);
      el.classList.remove('cdp-root', 'cdp-inline');
      if (this.o.className) this.o.className.split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.remove(c); });
    }
    delete el._cdp;
  };

  /* ---------------------- Statik ---------------------- */
  CustomDatePicker.defaults = extend({}, DEFAULTS);
  CustomDatePicker.version = '1.0.0';
  CustomDatePicker._open = null;
  CustomDatePicker.format = function (date, fmt, locale) {
    return formatDate(date, fmt || 'yyyy-MM-dd', locale || document.documentElement.lang || 'tr');
  };
  CustomDatePicker.parse = function (text, fmt, locale) {
    return parseDate(text, fmt || 'yyyy-MM-dd', locale || document.documentElement.lang || 'tr');
  };

  CustomDatePicker.getInstance = function (el) {
    if (typeof el === 'string') el = document.querySelector(el);
    return (el && el._cdp) || null;
  };

  CustomDatePicker.init = function (target, options) {
    if (!hasDOM) return [];
    var nodes;
    if (typeof target === 'string') nodes = toArray(document.querySelectorAll(target));
    else if (target && target.nodeType === 1) nodes = [target];
    else nodes = toArray(target);
    var out = [];
    nodes.forEach(function (n) {
      try { out.push(new CustomDatePicker(n, options)); }
      catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn(e.message); }
    });
    return out;
  };

  CustomDatePicker.autoInit = function (scope) {
    if (!hasDOM) return [];
    var out = [];
    toArray((scope || document).querySelectorAll('[data-datepicker]')).forEach(function (n) {
      if (n.getAttribute('data-datepicker') === 'false') return;
      try { out.push(new CustomDatePicker(n)); }
      catch (e) { if (typeof console !== 'undefined' && console.warn) console.warn(e.message); }
    });
    return out;
  };

  CustomDatePicker.closeAll = function () {
    if (CustomDatePicker._open) CustomDatePicker._open.close(false);
  };

  return CustomDatePicker;
});
