/*!
 * Bootstrap 6 uyumluluk katmanı 1.0 (MIT)
 * CustomSelect / CustomDatePicker × Bootstrap 6 `.form-adorn` (ve `.form-floating`)
 *
 * Orijinal eklenti dosyalarını DEĞİŞTİRMEZ; yüklendiğinde prototip düzeyinde üç küçük
 * ayarlama yapar (sonradan oluşturulan örnekler dahil hepsi otomatik etkilenir):
 *
 *  1) Açılır menü / takvim, `.form-adorn` içindeyse tetikleyici yerine tüm adorn kutusuna hizalanır
 *     (ghost kontrol yalnızca adorn'un bir bölümünü kaplar; menü dar ve kaymış açılırdı).
 *  2) Adorn `<label>` elemanı select'in erişilebilir adına karışmaz. (Label içeriği tetikleyicinin
 *     kendi değerini de içerdiğinden ad "Seçin Seçin" gibi tekrarlanırdı.)
 *  3) Adorn kutusunun kenar boşluğuna / simgesine tıklamak, `<label>` varsayılanı yerine
 *     bileşeni açar / kapatır (açıkken tıklayınca kapanır).
 *
 * `.form-floating` için JS gerekmez; yalnızca bootstrap6-compat.css yeterlidir.
 * Kurulum: Bootstrap6Compat.install({ CustomSelect, CustomDatePicker }) — bs6-custom-ui paketinde otomatik yapılır.
 * Eklentilerden biri verilmezse o bölüm atlanır.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Bootstrap6Compat = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var g = typeof window !== 'undefined' ? window : null;
  var ADORN = '.form-adorn';
  var deps = {};
  var installed = false;

  function adornOf(node) {
    return node && node.closest ? node.closest(ADORN) : null;
  }

  // Bir fonksiyon çalışırken `node.getBoundingClientRect()` adorn kutusunu döndürsün
  function withAnchor(node, anchor, fn, args, self) {
    node.getBoundingClientRect = function () { return anchor.getBoundingClientRect(); };
    try { return fn.apply(self, args); }
    finally { delete node.getBoundingClientRect; }
  }

  function patch() {
    var CS = deps.CustomSelect || (g && g.CustomSelect), DP = deps.CustomDatePicker || (g && g.CustomDatePicker);

    if (CS && CS.prototype && !CS.prototype._bs6) {
      CS.prototype._bs6 = true;

      var pos = CS.prototype._position;
      CS.prototype._position = function () {
        var a = adornOf(this.trigger);
        return a ? withAnchor(this.trigger, a, pos, arguments, this) : pos.apply(this, arguments);
      };

      var build = CS.prototype._build;
      CS.prototype._build = function () {
        build.apply(this, arguments);
        // Menüdeki arama kutusu gerçek Bootstrap .form-control olsun (stil: bootstrap6-compat.css)
        if (this.search) this.search.classList.add('form-control');
        if (!adornOf(this.el)) return;
        // adorn <label> hariç gerçek etiketler
        var ids = [];
        this._labels.forEach(function (l) { if (l.id && !l.classList.contains('form-adorn')) ids.push(l.id); });
        if (!ids.length && this.trigger.getAttribute('aria-label')) {
          this.trigger.removeAttribute('aria-labelledby');
          this.list.removeAttribute('aria-labelledby');
          this.list.setAttribute('aria-label', this.trigger.getAttribute('aria-label'));
        } else {
          this.trigger.setAttribute('aria-labelledby', ids.concat(this.valueBox.id).join(' '));
          this.list.setAttribute('aria-labelledby', ids.join(' ') || this.valueBox.id);
        }
      };

      var title = CS.prototype._sheetTitle;
      CS.prototype._sheetTitle = function () {
        if (!adornOf(this.el)) return title.apply(this, arguments);
        var l = this._labels.filter(function (x) { return !x.classList.contains('form-adorn'); })[0];
        this.title.textContent = (l && l.textContent.trim()) || this.el.getAttribute('aria-label') || this._placeholder();
      };
    }

    if (DP && DP.prototype && !DP.prototype._bs6) {
      DP.prototype._bs6 = true;
      var dpos = DP.prototype._position;
      DP.prototype._position = function () {
        var a = !this.inline && this.el ? adornOf(this.el) : null;
        return a ? withAnchor(this.el, a, dpos, arguments, this) : dpos.apply(this, arguments);
      };
    }
  }

  // Adorn alanındaki bileşen örneği: select → CustomSelect, text input → CustomDatePicker
  function instanceIn(a) {
    var CS = deps.CustomSelect || g.CustomSelect, DP = deps.CustomDatePicker || g.CustomDatePicker;
    var sel = a.querySelector('select'), inp = a.querySelector('input');
    if (sel && CS && CS.getInstance(sel)) return CS.getInstance(sel);
    if (inp && DP && DP.getInstance && DP.getInstance(inp)) return DP.getInstance(inp);
    return null;
  }

  function bindClicks() {
    var wasOpen = false;
    // Eklentilerin "dışarı tıklayınca kapat" dinleyicisinden ÖNCE (yakalama, ilk kayıt) durumu not et
    document.addEventListener('pointerdown', function (e) {
      wasOpen = false;
      var a = adornOf(e.target);
      var inst = a && instanceIn(a);
      if (inst) wasOpen = !!inst.isOpen;
    }, true);

    document.addEventListener('click', function (e) {
      var a = adornOf(e.target);
      var inst = a && instanceIn(a);
      if (!inst || !inst.el) return;
      var t = e.target;
      // Bileşenin kendi alanı / gizli select üzerinden gelen (etiketin ürettiği) tıklamalar zaten ele alınıyor
      if (t === inst.el || (inst.trigger && inst.trigger.contains(t))) return;
      if (inst.el.disabled) return;
      // Adorn içindeki başka etkileşimli öğeler (düğme, bağlantı, onay kutusu…) kendi davranışını korusun
      var interactive = t.closest && t.closest('button, a[href], input, select, textarea, summary, [role="button"], [contenteditable="true"]');
      if (interactive && interactive !== inst.el && a.contains(interactive)) return;
      e.preventDefault(); // <label> kendi odaklama / yeniden tıklama davranışını yapmasın
      if (wasOpen) { wasOpen = false; return; } // pointerdown'da zaten kapandı
      if (typeof inst.open === 'function') inst.open(); // açılış odağı kendisi yönetir
    });
  }

  // Eklenti sınıfları verilerek bir kez kurulur (tekrar çağrılması zararsızdır)
  function install(d) {
    if (d) { for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) deps[k] = d[k]; }
    if (!g || typeof document === 'undefined') return;
    patch();
    if (!installed) { installed = true; bindClicks(); }
  }

  return { version: '1.0.0', adornOf: adornOf, patch: patch, install: install };
});
