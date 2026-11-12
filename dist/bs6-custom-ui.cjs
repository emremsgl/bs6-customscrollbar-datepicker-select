/*! bs6-custom-ui v1.0.0 | MIT License | git+https://github.com/OWNER/REPO.git */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/scrollbar.cjs
var require_scrollbar = __commonJS({
  "src/scrollbar.cjs"(exports2, module2) {
    (function(root2, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.CustomScrollbar = factory();
      }
    })(typeof self !== "undefined" ? self : exports2, function() {
      "use strict";
      var hasDOM2 = typeof document !== "undefined";
      var DEFAULTS = {
        axis: null,
        // 'y' | 'x' | 'xy' (null: elemanın CSS overflow değerinden; sayfada 'y')
        autoHide: true,
        // true | 'scroll' | 'hover' | false (her zaman görünür)
        autoHideDelay: 900,
        // ms
        size: null,
        // 'sm' | 'lg' | null
        shadows: false,
        // kenarlarda "devamı var" gölgeleri
        gutter: false,
        // dikey çubuk için içerikten yer ayır (üstüne binmesin)
        focusable: true,
        // kaydırılabilir alana klavye odağı ver (WCAG)
        clickScroll: true,
        // yola tıklayınca sayfa sayfa kaydır
        smooth: true,
        // yola tıklamada yumuşak kaydırma
        thumbMin: 32,
        // tutamaç en küçük uzunluğu (px)
        className: "",
        // kök elemana ek sınıflar
        onScroll: null,
        // function(info, instance)
        onUpdate: null
        // function(info, instance)
      };
      var BOOL_KEYS = ["autoHide", "shadows", "gutter", "focusable", "clickScroll", "smooth"];
      var NUM_KEYS = ["autoHideDelay", "thumbMin"];
      var LAYOUT_PROPS = [
        "flexDirection",
        "flexWrap",
        "alignItems",
        "alignContent",
        "justifyContent",
        "justifyItems",
        "rowGap",
        "columnGap",
        "gridTemplateColumns",
        "gridTemplateRows",
        "gridTemplateAreas",
        "gridAutoFlow",
        "gridAutoColumns",
        "gridAutoRows",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft"
      ];
      var VIEWPORT_PROPS = [
        "scrollSnapType",
        "scrollBehavior",
        "overscrollBehavior",
        "scrollPaddingTop",
        "scrollPaddingRight",
        "scrollPaddingBottom",
        "scrollPaddingLeft"
      ];
      function toArray2(l) {
        return Array.prototype.slice.call(l || []);
      }
      function clamp(v, a, b) {
        return Math.min(b, Math.max(a, v));
      }
      function extend(t) {
        for (var i = 1; i < arguments.length; i++) {
          var s = arguments[i];
          if (!s) continue;
          for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== void 0) t[k] = s[k];
        }
        return t;
      }
      function h(tag, cls, attrs) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (attrs) {
          for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
        }
        return n;
      }
      function readData(el) {
        var out = {};
        for (var key in DEFAULTS) {
          var raw = el.dataset ? el.dataset["ccs" + key.charAt(0).toUpperCase() + key.slice(1)] : void 0;
          if (raw === void 0) continue;
          if (BOOL_KEYS.indexOf(key) > -1) {
            if (raw === "true" || raw === "") out[key] = true;
            else if (raw === "false") out[key] = false;
            else out[key] = raw;
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
        return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      }
      var LIVE = [];
      var relayoutTimer = 0, globalWatching = false;
      function relayoutAll() {
        clearTimeout(relayoutTimer);
        relayoutTimer = setTimeout(function() {
          LIVE.forEach(function(i) {
            i._layoutDirty = true;
            i._req();
          });
        }, 60);
      }
      function watchGlobal() {
        if (globalWatching || !hasDOM2) return;
        globalWatching = true;
        window.addEventListener("load", relayoutAll);
        document.addEventListener("load", function(e) {
          var t = e.target;
          if (t && t.tagName === "LINK") relayoutAll();
        }, true);
        if (typeof MutationObserver !== "undefined") {
          new MutationObserver(relayoutAll).observe(document.head || document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true
          });
        }
      }
      function userClasses(v) {
        return String(v || "").split(/\s+/).filter(function(c) {
          return c && c.indexOf("ccs-") !== 0;
        }).sort().join(" ");
      }
      function CustomScrollbar2(target, options) {
        if (!hasDOM2) return;
        var page = false;
        if (target === "page" || target === window || target === document || target === document.body || target === document.documentElement) {
          page = true;
          target = document.documentElement;
        } else if (typeof target === "string") {
          target = document.querySelector(target);
        }
        if (!target || target.nodeType !== 1) throw new TypeError("CustomScrollbar: ge\xE7erli bir eleman gerekli.");
        if (target._ccs) return target._ccs;
        if (page && !document.body) throw new TypeError("CustomScrollbar.page(): <body> hen\xFCz yok; DOMContentLoaded sonras\u0131 \xE7a\u011F\u0131r\u0131n.");
        if (!page && /^(SELECT|TEXTAREA|INPUT|IFRAME|IMG|VIDEO|CANVAS|TABLE|TBODY|THEAD|TR)$/.test(target.tagName)) {
          throw new TypeError("CustomScrollbar: <" + target.tagName.toLowerCase() + "> desteklenmiyor (i\xE7eri\u011Fi ta\u015F\u0131namaz). Bir <div> ile sar\u0131n.");
        }
        if (!page) {
          var oldVp = null;
          for (var ci = 0; ci < target.children.length; ci++) {
            if (target.children[ci].classList.contains("ccs-viewport")) {
              oldVp = target.children[ci];
              break;
            }
          }
          if (oldVp) {
            var oldContent = null;
            for (var cj = 0; cj < oldVp.children.length; cj++) {
              if (oldVp.children[cj].classList.contains("ccs-content")) {
                oldContent = oldVp.children[cj];
                break;
              }
            }
            while (oldContent && oldContent.firstChild) target.insertBefore(oldContent.firstChild, oldVp);
            toArray2(target.children).forEach(function(n) {
              if (n.classList.contains("ccs-viewport") || n.classList.contains("ccs-track") || n.classList.contains("ccs-shade")) target.removeChild(n);
            });
            toArray2(target.classList).forEach(function(c) {
              if (c.indexOf("ccs-") === 0) target.classList.remove(c);
            });
          }
        }
        this.el = target;
        this.isPage = page;
        this.o = extend({}, CustomScrollbar2.defaults, page ? { axis: "y" } : null, readData(target), options);
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
      function parseAxis(ax) {
        if (ax === "both") return { x: true, y: true };
        return { x: /x/i.test(ax), y: /y/i.test(ax) };
      }
      var P = CustomScrollbar2.prototype;
      P._build = function() {
        var el = this.el, self2 = this;
        var root2, vp, content = null;
        if (this.isPage) {
          root2 = h("div", "ccs-root ccs-page");
          document.body.appendChild(root2);
          vp = document.scrollingElement || document.documentElement;
          document.documentElement.classList.add("ccs-page-on");
          this.axes = this.o.axis ? parseAxis(this.o.axis) : { y: true, x: false };
          if (!this.axes.x && !this.axes.y) this.axes.y = true;
        } else {
          let on = function(v) {
            return v === "hidden" || v === "clip" ? false : true;
          };
          var cs = getComputedStyle(el);
          var disp = cs.display;
          var ax = this.o.axis;
          this.axes = ax ? parseAxis(ax) : { y: on(cs.overflowY), x: on(cs.overflowX) };
          if (!this.axes.x && !this.axes.y) this.axes.y = true;
          this._savedPos = el.style.position;
          this._posSet = false;
          vp = h("div", "ccs-viewport");
          content = h("div", "ccs-content");
          this.content = content;
          this.root = el;
          VIEWPORT_PROPS.forEach(function(p) {
            if (cs[p]) vp.style[p] = cs[p];
          });
          vp.style.overflowX = this.axes.x ? "auto" : "hidden";
          vp.style.overflowY = this.axes.y ? "auto" : "hidden";
          if (cs.position === "static") {
            el.style.position = "relative";
            this._posSet = true;
          }
          this._syncLayout();
          while (el.firstChild) content.appendChild(el.firstChild);
          vp.appendChild(content);
          el.appendChild(vp);
          root2 = el;
        }
        this.root = root2;
        this.vp = vp;
        this.content = content;
        if (!this.isPage) this._proxy();
        this.tr = {};
        this.th = {};
        ["y", "x"].forEach(function(a) {
          var track = h("div", "ccs-track ccs-" + a, { "aria-hidden": "true" });
          var thumb = h("div", "ccs-thumb");
          track.appendChild(thumb);
          root2.appendChild(track);
          self2.tr[a] = track;
          self2.th[a] = thumb;
        });
        this._shades = ["t", "b", "l", "r"].map(function(s) {
          var n = h("div", "ccs-shade ccs-sh-" + s, { "aria-hidden": "true" });
          root2.appendChild(n);
          return n;
        });
        if (!this.isPage) {
          var label = el.getAttribute("aria-label"), lby = el.getAttribute("aria-labelledby");
          if (label || lby) {
            vp.setAttribute("role", "region");
            if (label) vp.setAttribute("aria-label", label);
            if (lby) vp.setAttribute("aria-labelledby", lby);
          }
        }
      };
      P._syncLayout = function() {
        if (this.isPage) return;
        var el = this.el, c = this.content, cl = el.classList, cs = getComputedStyle(el);
        if (!el.isConnected || cs.display === "none") {
          cl.add("ccs-root", "ccs-host");
          this._layoutDirty = true;
          return;
        }
        cl.remove("ccs-host");
        var disp = cs.display;
        var pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
        cl.add("ccs-root", "ccs-host", "ccs-probe");
        var d = disp.indexOf("grid") > -1 ? "grid" : disp.indexOf("flex") > -1 ? "flex" : "flow-root";
        if (c.style.display !== d) c.style.display = d;
        LAYOUT_PROPS.forEach(function(p) {
          if (p.indexOf("padding") === 0) return;
          var v = cs[p];
          if (c.style[p] !== v) c.style[p] = v;
        });
        cl.remove("ccs-probe");
        c.style.paddingTop = pad[0];
        c.style.paddingRight = pad[1];
        c.style.paddingBottom = pad[2];
        c.style.paddingLeft = pad[3];
      };
      P._proxy = function() {
        var el = this.el, vp = this.vp, self2 = this;
        ["scrollTop", "scrollLeft"].forEach(function(k) {
          Object.defineProperty(el, k, {
            configurable: true,
            get: function() {
              return vp[k];
            },
            set: function(v) {
              vp[k] = v;
            }
          });
        });
        ["scrollHeight", "scrollWidth"].forEach(function(k) {
          Object.defineProperty(el, k, { configurable: true, get: function() {
            return vp[k];
          } });
        });
        ["scrollTo", "scrollBy"].forEach(function(k) {
          Object.defineProperty(el, k, {
            configurable: true,
            writable: true,
            value: function() {
              return vp[k].apply(vp, arguments);
            }
          });
        });
        this._proxied = true;
        void self2;
      };
      P._unproxy = function() {
        if (!this._proxied) return;
        var el = this.el;
        ["scrollTop", "scrollLeft", "scrollHeight", "scrollWidth", "scrollTo", "scrollBy"].forEach(function(k) {
          delete el[k];
        });
        this._proxied = false;
      };
      P._applyOptions = function() {
        var o = this.o, r = this.root, ah = o.autoHide;
        r.classList.toggle("ccs-sm", o.size === "sm");
        r.classList.toggle("ccs-lg", o.size === "lg");
        r.classList.toggle("ccs-shadows", !!o.shadows);
        r.classList.toggle("ccs-gutter", !!o.gutter && !this.isPage);
        if (o.className) {
          if (this._cls) r.classList.remove.apply(r.classList, this._cls);
          this._cls = String(o.className).split(/\s+/).filter(Boolean);
          r.classList.add.apply(r.classList, this._cls);
        }
        if (ah === false || ah === "false") this._show(true);
        else if (this.active) this._schedHide();
      };
      P._bind = function() {
        var self2 = this, H = this._h = {};
        var scrollTarget = this.isPage ? window : this.vp;
        H.scroll = function() {
          if (self2._dead) return;
          self2._paint();
          var ah = self2.o.autoHide;
          if (ah === true || ah === "scroll" || ah === "hover" && self2._coarse()) self2._show();
          if (!self2.isPage) {
            try {
              self2.el.dispatchEvent(new Event("scroll"));
            } catch (x) {
            }
          }
          if (typeof self2.o.onScroll === "function") self2._cb(self2.o.onScroll, self2.getInfo(), self2);
        };
        H.req = function() {
          self2._req();
        };
        H.winResize = function() {
          self2._layoutDirty = true;
          self2._req();
        };
        H.enter = function(e) {
          if (e.pointerType && e.pointerType !== "mouse") return;
          self2._hover = true;
          var ah = self2.o.autoHide;
          if (ah === true || ah === "hover") self2._show();
        };
        H.leave = function(e) {
          if (e.pointerType && e.pointerType !== "mouse") return;
          self2._hover = false;
          if (!self2._drag && !self2._press) self2._schedHide();
        };
        H.move = function(e) {
          if (e.pointerType && e.pointerType !== "mouse") return;
          var ah = self2.o.autoHide;
          if ((ah === true || ah === "hover") && !self2.active) self2._show();
        };
        H.pageMove = function(e) {
          if (e.pointerType && e.pointerType !== "mouse") return;
          var near = 56, ah = self2.o.autoHide;
          if (ah !== true && ah !== "hover") return;
          var de = document.documentElement;
          var edge = e.clientX >= de.clientWidth - near || self2.axes.x && e.clientY >= de.clientHeight - near;
          self2._hover = edge;
          if (edge) self2._show();
          else if (self2.active && !self2._drag && !self2._press) self2._schedHide();
        };
        H.focusin = function() {
          var ah = self2.o.autoHide;
          if (ah === true || ah === "scroll") self2._show();
        };
        scrollTarget.addEventListener("scroll", H.scroll, { passive: true });
        window.addEventListener("resize", H.winResize);
        if (this.isPage) {
          document.addEventListener("pointermove", H.pageMove, { passive: true });
        } else {
          this.root.addEventListener("pointerenter", H.enter);
          this.root.addEventListener("pointerleave", H.leave);
          this.root.addEventListener("pointermove", H.move, { passive: true });
          this.vp.addEventListener("focusin", H.focusin);
          this.vp.addEventListener("load", H.req, true);
        }
        ["y", "x"].forEach(function(a) {
          var tr = self2.tr[a];
          tr.addEventListener("pointerdown", function(e) {
            self2._down(e, a);
          });
          tr.addEventListener("pointermove", function(e) {
            self2._move(e);
          });
          tr.addEventListener("pointerup", function(e) {
            self2._up(e);
          });
          tr.addEventListener("pointercancel", function(e) {
            self2._up(e);
          });
          tr.addEventListener("lostpointercapture", function(e) {
            self2._up(e);
          });
          tr.addEventListener("wheel", function(e) {
            var k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? self2.vp.clientHeight : 1;
            self2.vp.scrollBy({ top: e.deltaY * k, left: e.deltaX * k, behavior: "auto" });
            e.preventDefault();
          }, { passive: false });
          tr.addEventListener("pointerenter", function(e) {
            if (e.pointerType === "mouse") {
              self2._hover = true;
              self2._show();
            }
          });
        });
        if (typeof ResizeObserver !== "undefined") {
          this._ro = new ResizeObserver(H.req);
          if (this.isPage) {
            this._ro.observe(document.documentElement);
            this._ro.observe(document.body);
          } else {
            this._ro.observe(this.vp);
            this._ro.observe(this.content);
          }
        }
        if (!this.isPage && typeof MutationObserver !== "undefined") {
          this._mo = new MutationObserver(H.req);
          this._mo.observe(this.content, { childList: true, subtree: true, characterData: true });
        }
        if (!this.isPage && typeof MutationObserver !== "undefined") {
          this._hostMo = new MutationObserver(function(recs) {
            recs.forEach(function(r) {
              toArray2(r.addedNodes).forEach(function(n) {
                if (n.parentNode !== self2.el) return;
                if (n === self2.vp || self2.tr.y === n || self2.tr.x === n || self2._shades.indexOf(n) > -1) return;
                self2.content.appendChild(n);
              });
            });
          });
          this._hostMo.observe(this.el, { childList: true });
          this._attrMo = new MutationObserver(function(recs) {
            for (var i = 0; i < recs.length; i++) {
              var r = recs[i];
              if (r.attributeName === "style" || userClasses(r.oldValue) !== userClasses(self2.el.className)) {
                self2._layoutDirty = true;
                self2._req();
                return;
              }
            }
          });
          this._attrMo.observe(this.el, { attributes: true, attributeFilter: ["class", "style"], attributeOldValue: true });
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(H.req);
      };
      P._coarse = function() {
        return !!(window.matchMedia && window.matchMedia("(hover: none)").matches);
      };
      P._cb = function(fn) {
        if (typeof fn !== "function") return;
        try {
          fn.apply(this, Array.prototype.slice.call(arguments, 1));
        } catch (e) {
          if (typeof console !== "undefined" && console.error) console.error("CustomScrollbar callback hatas\u0131:", e);
        }
      };
      P._req = function() {
        var self2 = this;
        if (this._raf || this._dead) return;
        function run() {
          if (!self2._raf) return;
          cancelAnimationFrame(self2._raf);
          clearTimeout(self2._rt);
          self2._raf = 0;
          self2.update();
        }
        this._raf = requestAnimationFrame(run);
        this._rt = setTimeout(run, 120);
      };
      P.update = function(relayout) {
        if (this._dead) return this;
        var idx = LIVE.indexOf(this);
        if (!this.el.isConnected) {
          if (idx > -1) LIVE.splice(idx, 1);
          return this;
        }
        if (idx < 0) LIVE.push(this);
        if (relayout === true || this._layoutDirty) {
          this._layoutDirty = false;
          this._syncLayout();
        }
        var vp = this.vp, r = this.root, o = this.o;
        this.rtl = getComputedStyle(this.isPage ? document.documentElement : vp).direction === "rtl";
        var chY = vp.clientHeight, shY = vp.scrollHeight, cwX = vp.clientWidth, swX = vp.scrollWidth;
        var hasY = this.axes.y && shY - chY > 1;
        var hasX = this.axes.x && swX - cwX > 1;
        r.classList.toggle("ccs-has-y", hasY);
        r.classList.toggle("ccs-has-x", hasX);
        r.classList.toggle("ccs-both", hasY && hasX);
        this.g.y = this.g.x = null;
        var min = o.thumbMin;
        var padY = hasY ? parseFloat(getComputedStyle(this.tr.y).paddingTop) || 0 : 0;
        var padX = hasX ? parseFloat(getComputedStyle(this.tr.x).paddingLeft) || 0 : 0;
        if (hasY) {
          var tl = this.tr.y.getBoundingClientRect().height - 2 * padY;
          var len = tl <= min ? tl : clamp(tl * chY / shY, min, tl);
          this.g.y = { max: shY - chY, trackLen: tl, thumbLen: len };
          this.th.y.style.height = len + "px";
        }
        if (hasX) {
          var tw = this.tr.x.getBoundingClientRect().width - 2 * padX;
          var wd = tw <= min ? tw : clamp(tw * cwX / swX, min, tw);
          this.g.x = { max: swX - cwX, trackLen: tw, thumbLen: wd };
          this.th.x.style.width = wd + "px";
        }
        if (!this.isPage && o.focusable) {
          var want = hasY || hasX;
          if (want && !vp.hasAttribute("tabindex")) {
            vp.setAttribute("tabindex", "0");
            this._tab = true;
          } else if (!want && this._tab) {
            vp.removeAttribute("tabindex");
            this._tab = false;
          }
        }
        this._paint();
        if (!hasY && !hasX) this._hide(true);
        else if (o.autoHide === false || o.autoHide === "false") this._show(true);
        this._cb(o.onUpdate, this.getInfo(), this);
        return this;
      };
      P._paint = function() {
        var vp = this.vp, g = this.g, e = this._e;
        var top = vp.scrollTop, left = Math.abs(vp.scrollLeft);
        if (g.y && g.y.max > 0) {
          var oy = clamp(top / g.y.max, 0, 1) * (g.y.trackLen - g.y.thumbLen);
          this.th.y.style.transform = "translate3d(0," + oy + "px,0)";
        }
        if (g.x && g.x.max > 0) {
          var ox = clamp(left / g.x.max, 0, 1) * (g.x.trackLen - g.x.thumbLen);
          this.th.x.style.transform = "translate3d(" + (this.rtl ? -ox : ox) + "px,0,0)";
        }
        var my = g.y ? g.y.max : 0, mx = g.x ? g.x.max : 0;
        var s = {
          up: my > 0 && top > 1,
          down: my > 0 && top < my - 1,
          start: mx > 0 && left > 1,
          end: mx > 0 && left < mx - 1
        };
        var cl = this.root.classList;
        if (s.up !== e.up) {
          e.up = s.up;
          cl.toggle("ccs-can-up", s.up);
        }
        if (s.down !== e.down) {
          e.down = s.down;
          cl.toggle("ccs-can-down", s.down);
        }
        if (s.start !== e.start) {
          e.start = s.start;
          cl.toggle("ccs-can-start", s.start);
        }
        if (s.end !== e.end) {
          e.end = s.end;
          cl.toggle("ccs-can-end", s.end);
        }
      };
      P._show = function(sticky) {
        clearTimeout(this._ht);
        if (!this.active) {
          this.active = true;
          this.root.classList.add("ccs-active");
        }
        if (!sticky) this._schedHide();
      };
      P._schedHide = function() {
        var self2 = this, ah = this.o.autoHide;
        clearTimeout(this._ht);
        if (ah === false || ah === "false") return;
        if (this._hover || this._drag || this._press) return;
        this._ht = setTimeout(function() {
          self2._hide();
        }, this.o.autoHideDelay);
      };
      P._hide = function(force) {
        var ah = this.o.autoHide;
        if (!force && (ah === false || ah === "false")) return;
        if (!force && (this._hover || this._drag || this._press)) return;
        clearTimeout(this._ht);
        if (this.active) {
          this.active = false;
          this.root.classList.remove("ccs-active");
        }
      };
      P._down = function(e, axis) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        var g = this.g[axis];
        if (!g || g.max <= 0) return;
        if (this._drag || this._press) return;
        var tr = this.tr[axis], th = this.th[axis], horiz = axis === "x", self2 = this;
        e.preventDefault();
        this._show();
        try {
          tr.setPointerCapture(e.pointerId);
        } catch (x) {
        }
        tr.classList.add("ccs-on");
        if (th.contains(e.target)) {
          this._drag = {
            axis,
            id: e.pointerId,
            start: horiz ? e.clientX : e.clientY,
            scroll: Math.abs(horiz ? this.vp.scrollLeft : this.vp.scrollTop)
          };
          this.root.classList.add("ccs-dragging");
          document.documentElement.classList.add("ccs-noselect");
        } else if (this.o.clickScroll) {
          this._press = { axis, id: e.pointerId, x: e.clientX, y: e.clientY };
          this._step(true);
          this._pt = setTimeout(function rep() {
            if (!self2._press) return;
            self2._step(false);
            self2._pt = setTimeout(rep, 90);
          }, 420);
        }
      };
      P._move = function(e) {
        if (this._press && e.pointerId === this._press.id) {
          this._press.x = e.clientX;
          this._press.y = e.clientY;
          return;
        }
        var d = this._drag;
        if (!d || e.pointerId !== d.id) return;
        var g = this.g[d.axis], horiz = d.axis === "x";
        var span = g.trackLen - g.thumbLen;
        if (span <= 0) return;
        var delta = (horiz ? e.clientX : e.clientY) - d.start;
        var abs = d.scroll + (horiz && this.rtl ? -delta : delta) * (g.max / span);
        this._setPos(d.axis, clamp(abs, 0, g.max));
      };
      P._step = function(first) {
        var p = this._press;
        if (!p) return;
        var horiz = p.axis === "x", r = this.th[p.axis].getBoundingClientRect();
        var pos = horiz ? p.x : p.y, a = horiz ? r.left : r.top, b = horiz ? r.right : r.bottom;
        if (pos >= a && pos <= b) {
          this._endPress();
          return;
        }
        var toward = pos < a ? -1 : 1;
        var absDir = horiz && this.rtl ? -toward : toward;
        var amt = (horiz ? this.vp.clientWidth : this.vp.clientHeight) * 0.9;
        var dx = horiz ? (this.rtl ? -absDir : absDir) * amt : 0;
        var dy = horiz ? 0 : absDir * amt;
        var smooth = first && this.o.smooth && !reducedMotion();
        this.vp.scrollBy({ top: dy, left: dx, behavior: smooth ? "smooth" : "auto" });
      };
      P._endPress = function() {
        clearTimeout(this._pt);
        this._press = null;
      };
      P._up = function(e) {
        var had = this._drag || this._press;
        if (!had) return;
        var id = (this._drag || this._press).id;
        if (e && e.pointerId !== void 0 && e.pointerId !== id) return;
        this._endPress();
        this._drag = null;
        this.root.classList.remove("ccs-dragging");
        document.documentElement.classList.remove("ccs-noselect");
        this.tr.y.classList.remove("ccs-on");
        this.tr.x.classList.remove("ccs-on");
        this._schedHide();
      };
      P._setPos = function(axis, abs) {
        var vp = this.vp, prev = vp.style.scrollBehavior;
        vp.style.scrollBehavior = "auto";
        if (axis === "y") vp.scrollTop = abs;
        else vp.scrollLeft = this.rtl ? -abs : abs;
        vp.style.scrollBehavior = prev;
      };
      P.getInfo = function() {
        var vp = this.vp;
        var maxTop = Math.max(0, vp.scrollHeight - vp.clientHeight);
        var maxLeft = Math.max(0, vp.scrollWidth - vp.clientWidth);
        return {
          top: vp.scrollTop,
          left: Math.abs(vp.scrollLeft),
          maxTop,
          maxLeft,
          progressY: maxTop ? clamp(vp.scrollTop / maxTop, 0, 1) : 0,
          progressX: maxLeft ? clamp(Math.abs(vp.scrollLeft) / maxLeft, 0, 1) : 0,
          atTop: vp.scrollTop <= 1,
          atBottom: vp.scrollTop >= maxTop - 1,
          scrollable: maxTop > 1 || maxLeft > 1
        };
      };
      P.scrollTo = function(a, b) {
        var opts = typeof a === "object" && a ? a : { left: a, top: b };
        if (opts.behavior === void 0) opts = extend({}, opts, { behavior: this.o.smooth && !reducedMotion() ? "smooth" : "auto" });
        this.vp.scrollTo(opts);
        return this;
      };
      P.scrollBy = function(a, b) {
        var opts = typeof a === "object" && a ? a : { left: a, top: b };
        if (opts.behavior === void 0) opts = extend({}, opts, { behavior: this.o.smooth && !reducedMotion() ? "smooth" : "auto" });
        this.vp.scrollBy(opts);
        return this;
      };
      P.scrollToTop = function(behavior) {
        return this.scrollTo({ top: 0, behavior });
      };
      P.scrollToBottom = function(behavior) {
        return this.scrollTo({ top: this.vp.scrollHeight, behavior });
      };
      P.scrollToElement = function(target, opts) {
        opts = opts || {};
        var node = typeof target === "string" ? this.vp.querySelector(target) : target;
        if (!node) return this;
        var vp = this.vp, vr = vp.getBoundingClientRect(), nr = node.getBoundingClientRect();
        var block = opts.block || "nearest", off = opts.offset || 0;
        var top = vp.scrollTop + (nr.top - vr.top);
        var dest = top - off;
        if (block === "center") dest = top - (vp.clientHeight - nr.height) / 2;
        else if (block === "nearest") {
          if (nr.top >= vr.top && nr.bottom <= vr.bottom) return this;
          dest = nr.top < vr.top ? top - off : top - vp.clientHeight + nr.height + off;
        }
        return this.scrollTo({ top: dest, behavior: opts.behavior });
      };
      P.show = function() {
        this._show();
        return this;
      };
      P.hide = function() {
        this._hide(true);
        return this;
      };
      P.setOptions = function(opts) {
        extend(this.o, opts);
        this._applyOptions();
        return this.update();
      };
      P.destroy = function() {
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
        (this.isPage ? window : this.vp).removeEventListener("scroll", H.scroll);
        window.removeEventListener("resize", H.winResize);
        document.documentElement.classList.remove("ccs-noselect");
        if (this.isPage) {
          document.removeEventListener("pointermove", H.pageMove);
          document.documentElement.classList.remove("ccs-page-on");
          if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
        } else {
          while (this.content.firstChild) el.insertBefore(this.content.firstChild, this.vp);
          [this.vp, this.tr.y, this.tr.x].concat(this._shades).forEach(function(n) {
            if (n.parentNode === el) el.removeChild(n);
          });
          this._unproxy();
          toArray2(el.classList).forEach(function(c) {
            if (c.indexOf("ccs-") === 0) el.classList.remove(c);
          });
          if (this._cls) el.classList.remove.apply(el.classList, this._cls);
          if (this._posSet) el.style.position = this._savedPos;
          if (!el.getAttribute("style")) el.removeAttribute("style");
          el.removeEventListener("pointerenter", H.enter);
          el.removeEventListener("pointerleave", H.leave);
          el.removeEventListener("pointermove", H.move);
        }
        delete el._ccs;
      };
      CustomScrollbar2.defaults = extend({}, DEFAULTS);
      CustomScrollbar2.version = "1.0.0";
      CustomScrollbar2.getInstance = function(el) {
        if (typeof el === "string") el = el === "page" ? document.documentElement : document.querySelector(el);
        return el && el._ccs || null;
      };
      CustomScrollbar2.init = function(target, options) {
        if (!hasDOM2) return [];
        var nodes;
        if (typeof target === "string") nodes = toArray2(document.querySelectorAll(target));
        else if (target && target.nodeType === 1) nodes = [target];
        else nodes = toArray2(target);
        var out = [];
        nodes.forEach(function(n) {
          try {
            out.push(new CustomScrollbar2(n, options));
          } catch (e) {
            if (typeof console !== "undefined" && console.warn) console.warn(e.message);
          }
        });
        return out;
      };
      CustomScrollbar2.page = function(options) {
        if (!hasDOM2) return null;
        if (!document.body) {
          document.addEventListener("DOMContentLoaded", function() {
            new CustomScrollbar2("page", options);
          });
          return null;
        }
        return new CustomScrollbar2("page", options);
      };
      CustomScrollbar2.autoInit = function(scope) {
        if (!hasDOM2) return [];
        var out = [];
        toArray2((scope || document).querySelectorAll("[data-scrollbar]")).forEach(function(n) {
          if (n.getAttribute("data-scrollbar") === "false") return;
          try {
            out.push(new CustomScrollbar2(n));
          } catch (e) {
            if (typeof console !== "undefined" && console.warn) console.warn(e.message);
          }
        });
        return out;
      };
      return CustomScrollbar2;
    });
  }
});

// src/select.cjs
var require_select = __commonJS({
  "src/select.cjs"(exports2, module2) {
    (function(root2, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.CustomSelect = factory();
      }
    })(typeof self !== "undefined" ? self : exports2, function() {
      "use strict";
      var hasDOM2 = typeof document !== "undefined";
      var uid = 0;
      var DEFAULTS = {
        placeholder: null,
        // null: boş değerli ilk <option> metni ya da yerelleştirilmiş "Seçim yapın"
        search: true,
        // true | false | 'auto' (seçenek sayısı >= searchThreshold)
        searchThreshold: 8,
        locale: null,
        // null: <html lang>; yoksa 'en'. Hazır diller: 'en', 'tr' (diğerleri için metin seçeneklerini verin)
        searchPlaceholder: "Search...",
        noResults: "No results found",
        selectAllText: "Select all",
        clearAllText: "Clear selection",
        doneText: "Done",
        clearTitle: "Clear",
        closeTitle: "Close",
        removeTitle: "Remove",
        clearable: false,
        // seçimi tek tıkla temizleyen ✕ düğmesi
        autoWidth: false,
        // tetikleyici en geniş seçeneğe göre otomatik boyutlansın
        iconRenderer: null,
        // function(option) -> HTML string | Node (özel ikon üretici)
        fitChips: true,
        // çoklu seçimde etiketler tek satırda kalır; sığmayanlar "+N" rozetine dönüşür
        maxChips: 0,
        // çoklu seçimde en fazla kaç etiket gösterilsin (0: hepsi); fitChips ile birlikte üst sınır olur
        max: 0,
        // çoklu seçimde en fazla seçim sayısı (0: sınırsız)
        maxHeight: 320,
        // menü en yüksekliği (px)
        sheet: "auto",
        // true | false | 'auto' (dar ekranda alttan açılan sayfa)
        sheetBreakpoint: 575,
        // px
        closeOnSelect: null,
        // null: tek seçimde true, çoklu seçimde false
        size: null,
        // 'sm' | 'lg' | null (null: sınıflardan algıla)
        className: "",
        // kapsayıcıya eklenecek sınıflar
        menuClass: "",
        // açılır menüye eklenecek sınıflar
        onChange: null,
        onOpen: null,
        onClose: null,
        onMax: null
      };
      var I18N = {
        en: {
          searchPlaceholder: "Search...",
          noResults: "No results found",
          selectAllText: "Select all",
          clearAllText: "Clear selection",
          doneText: "Done",
          clearTitle: "Clear",
          closeTitle: "Close",
          removeTitle: "Remove",
          emptyPlaceholder: "Select an option"
        },
        tr: {
          searchPlaceholder: "Ara...",
          noResults: "Sonu\xE7 bulunamad\u0131",
          selectAllText: "T\xFCm\xFCn\xFC Se\xE7",
          clearAllText: "Se\xE7imi Kald\u0131r",
          doneText: "Tamam",
          clearTitle: "Temizle",
          closeTitle: "Kapat",
          removeTitle: "Kald\u0131r",
          emptyPlaceholder: "Se\xE7im yap\u0131n"
        }
      };
      var BOOL_KEYS = ["search", "clearable", "sheet", "closeOnSelect", "autoWidth", "fitChips"];
      var NUM_KEYS = ["searchThreshold", "maxChips", "max", "maxHeight", "sheetBreakpoint"];
      var TOKENS = [
        "accent",
        "accent-soft",
        "accent-text",
        "on-accent",
        "ring",
        "bg",
        "fg",
        "muted",
        "placeholder",
        "border",
        "border-hover",
        "divider",
        "menu-bg",
        "hover",
        "danger",
        "danger-ring",
        "radius",
        "font-size",
        "shadow",
        "z"
      ];
      var ICON = {
        chevron: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5.5 7.75 10 12.25l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        check: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        x: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        search: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m13.2 13.2 3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      };
      function toArray2(list) {
        return Array.prototype.slice.call(list || []);
      }
      function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
          var src = arguments[i];
          if (!src) continue;
          for (var k in src) {
            if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== void 0) target[k] = src[k];
          }
        }
        return target;
      }
      function h(tag, cls, attrs, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (attrs) {
          for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
        }
        if (html) n.innerHTML = html;
        return n;
      }
      function norm(s) {
        s = String(s == null ? "" : s).toLowerCase();
        if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
        return s.replace(/ı/g, "i");
      }
      function readData(el) {
        var out = {};
        for (var key in DEFAULTS) {
          var raw = el.dataset ? el.dataset[key] : void 0;
          if (raw === void 0) continue;
          if (BOOL_KEYS.indexOf(key) > -1) {
            if (raw === "true" || raw === "") out[key] = true;
            else if (raw === "false") out[key] = false;
            else out[key] = raw;
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
      function CustomSelect2(el, options) {
        if (!hasDOM2) return;
        if (typeof el === "string") el = document.querySelector(el);
        if (!el || el.tagName !== "SELECT") throw new TypeError("CustomSelect: bir <select> eleman\u0131 gerekli.");
        if (el._cs) return el._cs;
        this.el = el;
        var data = readData(el);
        var lang = String(options && options.locale || data.locale || document.documentElement.lang || "en").toLowerCase().split(/[-_]/)[0];
        var tr = I18N[lang] || I18N.en;
        var base = extend({}, CustomSelect2.defaults);
        for (var tk in tr) if (base[tk] === I18N.en[tk]) base[tk] = tr[tk];
        this._t = tr;
        this.o = extend({}, base, data, options);
        this.multiple = el.multiple;
        this.isOpen = false;
        this.active = null;
        this.vis = [];
        this.opts = [];
        this.items = [];
        this._term = "";
        this._silent = false;
        this._sheet = false;
        this._invalid = false;
        this._ta = { buf: "", t: null };
        try {
          this._build();
          this._bind();
          this.refresh();
        } catch (err) {
          this._rollback();
          throw err;
        }
        el._cs = this;
      }
      var P = CustomSelect2.prototype;
      P._rollback = function() {
        var el = this.el, H = this._h;
        try {
          if (this._mo) this._mo.disconnect();
          if (this._ro) this._ro.disconnect();
          clearTimeout(this._moTimer);
          if (H) {
            el.removeEventListener("change", H.nativeChange);
            el.removeEventListener("focus", H.nativeFocus);
            el.removeEventListener("invalid", H.nativeInvalid);
            if (this._form) this._form.removeEventListener("reset", H.formReset);
          }
          if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
          if (this._shell) this._shell.classList.remove("cs-hidden-shell");
          el.classList.remove("cs-native");
          if (this._prev) {
            if (this._prev.tabindex == null) el.removeAttribute("tabindex");
            else el.setAttribute("tabindex", this._prev.tabindex);
            if (this._prev.ariaHidden == null) el.removeAttribute("aria-hidden");
            else el.setAttribute("aria-hidden", this._prev.ariaHidden);
          }
          (this._labels || []).forEach(function(l) {
            if (l._csId) {
              l.removeAttribute("id");
              l._csId = false;
            }
          });
        } catch (e) {
        }
      };
      P._build = function() {
        var el = this.el, o = this.o;
        var id = this.id = "cs-" + ++uid;
        if (el.classList.contains("cs-native")) {
          var host = el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("cs-hidden-shell") ? el.parentNode : el;
          var stale = host.nextElementSibling;
          if (stale && stale.classList.contains("cs-select")) stale.parentNode.removeChild(stale);
          host.classList.remove("cs-hidden-shell");
          el.classList.remove("cs-native");
          el.removeAttribute("tabindex");
          el.removeAttribute("aria-hidden");
        }
        var wrapper = h("div", "cs-select cs-root" + (o.className ? " " + o.className : ""));
        var trigger = h("div", "cs-trigger", {
          role: "combobox",
          tabindex: "0",
          "aria-haspopup": "listbox",
          "aria-expanded": "false",
          "aria-controls": id + "-list"
        });
        var value = h("div", "cs-value", { id: id + "-value" });
        var clear = h("span", "cs-clear", { "aria-hidden": "true", title: o.clearTitle }, ICON.x);
        clear.hidden = true;
        var arrow = h("span", "cs-arrow", { "aria-hidden": "true" }, ICON.chevron);
        trigger.appendChild(value);
        trigger.appendChild(clear);
        trigger.appendChild(arrow);
        wrapper.appendChild(trigger);
        var sizer = h("div", "cs-sizer", { "aria-hidden": "true" });
        wrapper.appendChild(sizer);
        var menu = h("div", "cs-menu cs-root" + (o.menuClass ? " " + o.menuClass : ""));
        var head = h("div", "cs-head");
        head.appendChild(h("span", "cs-grab", { "aria-hidden": "true" }));
        var headRow = h("div", "cs-head-row");
        var title = h("span", "cs-title");
        var closeBtn = h("button", "cs-sheet-close", { type: "button", "aria-label": o.closeTitle, title: o.closeTitle }, ICON.x);
        headRow.appendChild(title);
        headRow.appendChild(closeBtn);
        head.appendChild(headRow);
        var searchBox = h("div", "cs-search-box");
        searchBox.appendChild(h("span", "cs-search-icon", null, ICON.search));
        var search = h("input", "cs-search", {
          type: "text",
          role: "searchbox",
          autocomplete: "off",
          autocapitalize: "none",
          autocorrect: "off",
          spellcheck: "false",
          enterkeyhint: "search",
          placeholder: o.searchPlaceholder,
          "aria-label": o.searchPlaceholder,
          "aria-controls": id + "-list"
        });
        searchBox.appendChild(search);
        var actions = h("div", "cs-actions");
        var btnAll = h("button", "cs-action", { type: "button" });
        btnAll.textContent = o.selectAllText;
        var btnNone = h("button", "cs-action cs-secondary", { type: "button" });
        btnNone.textContent = o.clearAllText;
        actions.appendChild(btnAll);
        actions.appendChild(btnNone);
        var list = h("div", "cs-list", { role: "listbox", id: id + "-list", tabindex: "-1" });
        var empty = h("div", "cs-empty", { role: "status" });
        empty.textContent = o.noResults;
        empty.hidden = true;
        var footer = h("div", "cs-footer");
        var done = h("button", "cs-done", { type: "button" });
        done.textContent = o.doneText;
        footer.appendChild(done);
        menu.appendChild(head);
        menu.appendChild(searchBox);
        menu.appendChild(actions);
        menu.appendChild(list);
        menu.appendChild(empty);
        menu.appendChild(footer);
        var backdrop = h("div", "cs-backdrop");
        var anchor = el;
        var parent = el.parentNode;
        if (parent && parent.classList && parent.classList.contains("select") && parent.children.length === 1) {
          anchor = parent;
          parent.classList.add("cs-hidden-shell");
          this._shell = parent;
        }
        anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);
        this._prev = {
          tabindex: el.getAttribute("tabindex"),
          ariaHidden: el.getAttribute("aria-hidden")
        };
        el.classList.add("cs-native");
        el.setAttribute("tabindex", "-1");
        el.setAttribute("aria-hidden", "true");
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
        this._labels = el.labels ? toArray2(el.labels) : [];
        var ids = [];
        this._labels.forEach(function(lbl, i) {
          if (!lbl.id) {
            lbl.id = id + "-label-" + i;
            lbl._csId = true;
          }
          ids.push(lbl.id);
        });
        ids.push(value.id);
        trigger.setAttribute("aria-labelledby", ids.join(" "));
        list.setAttribute("aria-labelledby", ids.slice(0, -1).join(" ") || value.id);
        var aria = el.getAttribute("aria-label");
        if (aria) trigger.setAttribute("aria-label", aria);
      };
      P._bind = function() {
        var self2 = this, el = this.el;
        var H = this._h = {};
        H.triggerClick = function(e) {
          self2._syncState();
          if (self2.disabled) return;
          var x = e.target.closest ? e.target.closest(".cs-chip-x") : null;
          if (x && self2.trigger.contains(x)) {
            e.stopPropagation();
            var item = self2.opts[+x.getAttribute("data-i")];
            if (item) self2._toggleItem(item, false);
            return;
          }
          var c = e.target.closest ? e.target.closest(".cs-clear") : null;
          if (c && self2.trigger.contains(c)) {
            e.stopPropagation();
            self2.clear(true);
            self2.trigger.focus({ preventScroll: true });
            return;
          }
          self2.toggle();
        };
        H.keydown = function(e) {
          self2._keydown(e);
        };
        H.menuMouseDown = function(e) {
          if (e.target !== self2.search) e.preventDefault();
        };
        H.listClick = function(e) {
          var n = e.target.closest ? e.target.closest(".cs-option") : null;
          if (!n || !n._item || n._item.disabled) return;
          self2._choose(n._item);
        };
        H.listMove = function(e) {
          var n = e.target.closest ? e.target.closest(".cs-option") : null;
          if (n && n._item && !n._item.disabled && n._item !== self2.active) self2._setActive(n._item, false);
        };
        H.searchInput = function() {
          self2._filter(self2.search.value);
          if (self2.isOpen) self2._position();
        };
        H.selectAll = function() {
          self2._setAll(true);
        };
        H.selectNone = function() {
          self2._setAll(false);
        };
        H.done = function() {
          self2.close(true);
        };
        H.backdropClick = function() {
          self2.close(true);
        };
        var drag = null;
        H.dragStart = function(e) {
          if (!self2._sheet || e.button !== void 0 && e.button > 0) return;
          if (e.target.closest && e.target.closest(".cs-sheet-close")) return;
          drag = { y: e.clientY, t: Date.now(), dy: 0 };
          try {
            self2.head.setPointerCapture(e.pointerId);
          } catch (x) {
          }
          self2.menu.style.transition = "none";
        };
        H.dragMove = function(e) {
          if (!drag) return;
          drag.dy = Math.max(0, e.clientY - drag.y);
          self2.menu.style.transform = "translateY(" + drag.dy + "px)";
          self2.backdrop.style.opacity = String(Math.max(0, 1 - drag.dy / (self2.menu.offsetHeight || 1)));
        };
        H.dragEnd = function() {
          if (!drag) return;
          var d = drag, speed = d.dy / Math.max(1, Date.now() - d.t);
          drag = null;
          self2.menu.style.transition = "";
          if (d.dy > 90 || d.dy > 24 && speed > 0.5) {
            self2.close(true);
          } else {
            self2.menu.style.transform = "";
            self2.backdrop.style.opacity = "";
          }
        };
        H.nativeChange = function() {
          if (self2._silent) return;
          self2._invalid = false;
          self2._syncState();
          self2._sync();
        };
        H.nativeFocus = function() {
          if (!self2.disabled) self2.trigger.focus({ preventScroll: false });
        };
        H.nativeInvalid = function() {
          self2._invalid = true;
          self2._syncState();
        };
        H.formReset = function() {
          setTimeout(function() {
            self2._invalid = false;
            self2.refresh();
          }, 0);
        };
        H.docPointer = function(e) {
          var t = e.target;
          if (self2.wrapper.contains(t) || self2.menu.contains(t) || t === self2.backdrop) return;
          self2.close(false);
        };
        H.reposition = function(e) {
          var t = e && e.target;
          if (t && t.nodeType === 1 && self2.menu.contains(t)) return;
          if (!self2.wrapper.isConnected) {
            self2.close(false);
            return;
          }
          if (self2._raf) return;
          self2._raf = requestAnimationFrame(function() {
            self2._raf = 0;
            if (self2.isOpen) self2._position();
          });
        };
        this.trigger.addEventListener("click", H.triggerClick);
        this.trigger.addEventListener("keydown", H.keydown);
        this.menu.addEventListener("keydown", H.keydown);
        this.menu.addEventListener("mousedown", H.menuMouseDown);
        this.list.addEventListener("click", H.listClick);
        this.list.addEventListener("mousemove", H.listMove);
        this.search.addEventListener("input", H.searchInput);
        this.btnAll.addEventListener("click", H.selectAll);
        this.btnNone.addEventListener("click", H.selectNone);
        this.doneBtn.addEventListener("click", H.done);
        this.backdrop.addEventListener("click", H.backdropClick);
        this.closeBtn.addEventListener("click", H.done);
        this.head.addEventListener("pointerdown", H.dragStart);
        this.head.addEventListener("pointermove", H.dragMove);
        this.head.addEventListener("pointerup", H.dragEnd);
        this.head.addEventListener("pointercancel", H.dragEnd);
        el.addEventListener("change", H.nativeChange);
        el.addEventListener("focus", H.nativeFocus);
        el.addEventListener("invalid", H.nativeInvalid);
        this._form = el.form;
        if (this._form) this._form.addEventListener("reset", H.formReset);
        if (typeof ResizeObserver !== "undefined") {
          this._ro = new ResizeObserver(function() {
            if (self2._fitRaf) return;
            function run() {
              if (!self2._fitRaf) return;
              cancelAnimationFrame(self2._fitRaf);
              clearTimeout(self2._fitTimer);
              self2._fitRaf = 0;
              if (self2.el) self2._fit();
            }
            self2._fitRaf = requestAnimationFrame(run);
            self2._fitTimer = setTimeout(run, 100);
          });
          this._ro.observe(this.valueBox);
        }
        if (typeof MutationObserver !== "undefined") {
          var LIGHT = { "class": 1, "aria-invalid": 1, "required": 1, "disabled": 1 };
          this._mo = new MutationObserver(function(recs) {
            for (var i = 0; i < recs.length; i++) {
              var r = recs[i];
              if (!(r.type === "attributes" && LIGHT[r.attributeName] && (r.target === el || r.target.tagName === "FIELDSET"))) {
                self2._moHeavy = true;
                break;
              }
            }
            if (self2._moTimer) return;
            self2._moTimer = setTimeout(function() {
              self2._moTimer = 0;
              var heavy = self2._moHeavy;
              self2._moHeavy = false;
              if (!self2.el) return;
              if (heavy) self2.refresh();
              else {
                self2._syncState();
                self2._sync();
              }
            }, 0);
          });
          for (var fs = el.parentNode; fs && fs.nodeType === 1; fs = fs.parentNode) {
            if (fs.tagName === "FIELDSET") this._mo.observe(fs, { attributes: true, attributeFilter: ["disabled"] });
          }
          this._mo.observe(el, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: [
              "disabled",
              "class",
              "label",
              "value",
              "selected",
              "hidden",
              "multiple",
              "required",
              "aria-invalid",
              "data-description",
              "data-icon",
              "data-icon-class"
            ]
          });
        }
      };
      P._read = function() {
        var el = this.el;
        this.multiple = el.multiple;
        var placeholderOpt = null;
        var first = el.options[0];
        if (!this.multiple && first && first.value === "") placeholderOpt = first;
        this.placeholderOpt = placeholderOpt;
        var items = [], opts = [];
        function makeOpt(option, group) {
          if (option === placeholderOpt || option.hidden) return null;
          var label = (option.label || option.text || "").trim();
          var it = {
            type: "option",
            option,
            group: group || null,
            label,
            desc: option.getAttribute("data-description") || "",
            disabled: option.disabled || !!(group && group.disabled),
            node: null
          };
          it.norm = norm(label + " " + it.desc);
          opts.push(it);
          return it;
        }
        toArray2(el.children).forEach(function(c) {
          if (c.tagName === "OPTION") {
            var it = makeOpt(c, null);
            if (it) items.push(it);
          } else if (c.tagName === "OPTGROUP") {
            var g = { type: "group", el: c, label: c.label || "", disabled: c.disabled, opts: [], node: null };
            toArray2(c.children).forEach(function(oc) {
              if (oc.tagName !== "OPTION") return;
              var it2 = makeOpt(oc, g);
              if (it2) g.opts.push(it2);
            });
            if (g.opts.length) items.push(g);
          }
        });
        this.items = items;
        this.opts = opts;
      };
      var IMG_RE = /^(https?:|\/|\.\.?\/|data:image\/)|\.(png|jpe?g|gif|svg|webp|avif|ico)([?#].*)?$/i;
      P._icon = function(option) {
        var r = this.o.iconRenderer, s = null, v;
        if (typeof r === "function") {
          try {
            v = r(option);
          } catch (err) {
            v = null;
            if (typeof console !== "undefined" && console.warn) console.warn("CustomSelect iconRenderer hatas\u0131:", err);
          }
          if (v) {
            s = h("span", "cs-icon", { "aria-hidden": "true" });
            if (v.nodeType) s.appendChild(v);
            else s.innerHTML = String(v);
            return s;
          }
        }
        var cls = option.getAttribute("data-icon-class"), ic = option.getAttribute("data-icon");
        if (cls) {
          s = h("span", "cs-icon", { "aria-hidden": "true" });
          s.appendChild(h("i", cls, { "aria-hidden": "true" }));
        } else if (ic) {
          s = h("span", "cs-icon", { "aria-hidden": "true" });
          if (IMG_RE.test(ic)) s.appendChild(h("img", null, { src: ic, alt: "", draggable: "false" }));
          else s.textContent = ic;
        }
        return s;
      };
      P._placeholder = function() {
        if (this.o.placeholder != null && this.o.placeholder !== "") return this.o.placeholder;
        var p = this.placeholderOpt;
        if (p && (p.label || p.text).trim()) return (p.label || p.text).trim();
        return this._t.emptyPlaceholder;
      };
      P._render = function() {
        var self2 = this, id = this.id, n = 0;
        var frag = document.createDocumentFragment();
        function optNode(it) {
          var node = h("div", "cs-option" + (it.disabled ? " cs-disabled" : ""), {
            role: "option",
            id: id + "-o" + n++,
            "aria-selected": "false"
          });
          if (it.disabled) node.setAttribute("aria-disabled", "true");
          var ico = self2._icon(it.option);
          it.hasIcon = !!ico;
          if (ico) node.appendChild(ico);
          var body = h("span", "cs-option-body");
          var lab = h("span", "cs-option-label");
          lab.textContent = it.label;
          it.labelNode = lab;
          body.appendChild(lab);
          if (it.desc) {
            var d = h("span", "cs-desc");
            d.textContent = it.desc;
            body.appendChild(d);
          }
          node.appendChild(body);
          node.appendChild(h("span", "cs-check", { "aria-hidden": "true" }, ICON.check));
          node._item = it;
          it.node = node;
          return node;
        }
        this.items.forEach(function(it) {
          if (it.type === "option") {
            frag.appendChild(optNode(it));
          } else {
            var gid = id + "-g" + n++;
            var gn = h("div", "cs-group", { role: "group", "aria-labelledby": gid });
            var gl = h("div", "cs-group-label", { id: gid, "aria-hidden": "true" });
            gl.textContent = it.label;
            gn.appendChild(gl);
            it.opts.forEach(function(oi) {
              gn.appendChild(optNode(oi));
            });
            it.node = gn;
            frag.appendChild(gn);
          }
        });
        this.list.textContent = "";
        this.list.appendChild(frag);
        var sz = this.sizer, anyIcon = this.opts.some(function(x) {
          return x.hasIcon;
        });
        sz.textContent = "";
        var phRow = h("div", anyIcon && !this.multiple ? "cs-pad" : "");
        phRow.textContent = this._placeholder();
        sz.appendChild(phRow);
        this.opts.forEach(function(x) {
          var row = h("div", x.hasIcon || anyIcon && !self2.multiple ? "cs-pad" : "");
          row.textContent = x.label;
          sz.appendChild(row);
        });
        var s = this.o.search;
        this.searchOn = s === true || s === "auto" && this.opts.length >= this.o.searchThreshold;
        this.searchBox.hidden = !this.searchOn;
        if (!this.searchOn) this.search.value = "";
        this._filter(this.searchOn ? this.search.value : "");
      };
      P._snap = function() {
        return toArray2(this.el.selectedOptions).map(function(o) {
          return o.value;
        }).join("");
      };
      P._syncState = function() {
        var el = this.el, o = this.o, w = this.wrapper;
        var wasDisabled = this.disabled;
        this.disabled = el.matches(":disabled");
        if (this.disabled && this.isOpen) this.close(false);
        w.classList.toggle("cs-disabled", this.disabled);
        this.trigger.setAttribute("aria-disabled", this.disabled ? "true" : "false");
        this.trigger.setAttribute("tabindex", this.disabled ? "-1" : "0");
        if (wasDisabled !== this.disabled && this.disabled) this._setActive(null);
        var invalid = this._invalid || el.getAttribute("aria-invalid") === "true" || hasClass(el, ["is-invalid", "is-danger", "select-error", "input-error", "invalid"]);
        w.classList.toggle("cs-invalid", invalid);
        this.trigger.setAttribute("aria-invalid", invalid ? "true" : "false");
        this.trigger.setAttribute("aria-required", el.required ? "true" : "false");
        var size = o.size;
        if (!size) {
          if (hasClass(el, ["form-select-sm", "form-control-sm", "is-small", "select-sm", "select-xs"])) size = "sm";
          else if (hasClass(el, ["form-select-lg", "form-control-lg", "is-medium", "is-large", "select-lg"])) size = "lg";
        }
        w.classList.toggle("cs-sm", size === "sm");
        w.classList.toggle("cs-lg", size === "lg");
        w.classList.toggle("cs-multi", this.multiple);
        w.classList.toggle("cs-fit", this.multiple && !!o.fitChips);
        w.classList.toggle("cs-auto", !!o.autoWidth);
        this.menu.classList.toggle("cs-multi", this.multiple);
        this.list.setAttribute("aria-multiselectable", this.multiple ? "true" : "false");
        this.actions.hidden = !this.multiple;
        var st = el.style;
        for (var i = 0; st && i < st.length; i++) {
          var name = st[i];
          if (name.indexOf("--cs-") === 0) w.style.setProperty(name, st.getPropertyValue(name));
        }
      };
      P._runs = function() {
        var seen = this.opts.filter(function(it) {
          return it.node && !it.node.hidden;
        });
        function linked(a, b) {
          return !!(a && b && a.option.selected && b.option.selected && a.group === b.group);
        }
        seen.forEach(function(it, i) {
          var sel = it.option.selected;
          it.node.classList.toggle("cs-run-start", sel && !linked(seen[i - 1], it));
          it.node.classList.toggle("cs-run-end", sel && !linked(it, seen[i + 1]));
        });
        this.opts.forEach(function(it) {
          if (it.node && it.node.hidden) it.node.classList.remove("cs-run-start", "cs-run-end");
        });
      };
      P._sync = function() {
        var self2 = this;
        this._shown = this._snap();
        var selected = this.opts.filter(function(it) {
          return it.option.selected;
        });
        this.opts.forEach(function(it) {
          if (!it.node) return;
          var s = it.option.selected;
          it.node.classList.toggle("cs-selected", s);
          it.node.setAttribute("aria-selected", s ? "true" : "false");
        });
        this._runs();
        var box = this.valueBox;
        box.textContent = "";
        this._chipSet = null;
        if (!selected.length) {
          var ph = h("span", "cs-placeholder");
          ph.textContent = this._placeholder();
          box.appendChild(ph);
        } else if (this.multiple) {
          var max = this.o.maxChips, shown = max > 0 ? selected.slice(0, max) : selected;
          var nodes = shown.map(function(it) {
            var chip = h("span", "cs-chip");
            var t = h("span", "cs-chip-text");
            t.textContent = it.label;
            var ci = self2._icon(it.option);
            if (ci) chip.appendChild(ci);
            var x = h("span", "cs-chip-x", {
              "data-i": self2.opts.indexOf(it),
              title: self2.o.removeTitle
            }, ICON.x);
            chip.appendChild(t);
            chip.appendChild(x);
            return chip;
          });
          var more = h("span", "cs-chip cs-chip-more");
          var extra = selected.length - shown.length;
          if (this.o.fitChips) {
            this._chipSet = {
              nodes,
              more,
              extra,
              labels: selected.map(function(it) {
                return it.label;
              })
            };
            this._fit();
          } else {
            nodes.forEach(function(c) {
              box.appendChild(c);
            });
            if (extra > 0) {
              more.textContent = "+" + extra;
              box.appendChild(more);
            }
          }
        } else {
          var row = h("span", "cs-sel");
          var si = this._icon(selected[0].option);
          if (si) row.appendChild(si);
          var tx = h("span", "cs-text");
          tx.textContent = selected[0].label;
          row.appendChild(tx);
          box.appendChild(row);
        }
        var canClear = this.o.clearable && selected.length > 0 && !this.disabled && (this.multiple || !this.el.required);
        this.clearBtn.hidden = !canClear;
        this.wrapper.classList.toggle("cs-has-clear", canClear);
        this.wrapper.classList.toggle("cs-has-value", selected.length > 0);
        if (this.isOpen) this._position();
      };
      P._fit = function() {
        var set = this._chipSet, box = this.valueBox;
        if (!set || !this.multiple || !this.o.fitChips) return;
        var nodes = set.nodes, more = set.more, n = nodes.length, i;
        if (!n) return;
        box.textContent = "";
        for (i = 0; i < n; i++) box.appendChild(nodes[i]);
        box.appendChild(more);
        var avail = box.clientWidth;
        if (!avail) {
          more.hidden = set.extra === 0;
          if (set.extra) more.textContent = "+" + set.extra;
          return;
        }
        box.classList.add("cs-measure");
        var widths = [], sums = [0];
        for (i = 0; i < n; i++) {
          widths[i] = nodes[i].offsetWidth;
          sums[i + 1] = sums[i] + widths[i];
        }
        var gap = parseFloat(getComputedStyle(box).columnGap) || 0;
        var keep = 1;
        for (var k = n; k >= 1; k--) {
          var hid = n - k + set.extra, need = sums[k] + gap * (k - 1);
          if (hid) {
            more.hidden = false;
            more.textContent = "+" + hid;
            need += gap + more.offsetWidth;
          }
          if (need <= avail + 0.5) {
            keep = k;
            break;
          }
        }
        box.classList.remove("cs-measure");
        for (i = keep; i < n; i++) box.removeChild(nodes[i]);
        var hidden = n - keep + set.extra;
        more.hidden = hidden === 0;
        if (hidden) {
          more.textContent = "+" + hidden;
          more.title = set.labels.slice(keep).join(", ");
        } else {
          more.removeAttribute("title");
        }
      };
      P.refresh = P.update = function() {
        if (!this.el) return this;
        this._read();
        this._render();
        this._syncState();
        this._sync();
        if (this.isOpen && this.active && this.vis.indexOf(this.active) < 0) this._setActive(this.vis[0] || null);
        return this;
      };
      P._hl = function(it, term) {
        var n = it.labelNode;
        if (!n) return;
        var s = it.label, a = -1, b = -1;
        if (term) {
          var map = [], ns = "";
          for (var i = 0; i < s.length; i++) {
            var c = norm(s.charAt(i));
            for (var k = 0; k < c.length; k++) map.push(i);
            ns += c;
          }
          var p = ns.indexOf(term);
          if (p > -1) {
            a = map[p];
            b = map[p + term.length - 1] + 1;
          }
        }
        if (a < 0) {
          if (n._hl) {
            n.textContent = s;
            n._hl = false;
          }
          return;
        }
        n.textContent = "";
        n.appendChild(document.createTextNode(s.slice(0, a)));
        var mk = h("mark", "cs-hl");
        mk.textContent = s.slice(a, b);
        n.appendChild(mk);
        n.appendChild(document.createTextNode(s.slice(b)));
        n._hl = true;
      };
      P._filter = function(text) {
        var self2 = this, t = norm(text).trim(), vis = [], any = false;
        this._term = text;
        this.opts.forEach(function(it) {
          var m = !t || it.norm.indexOf(t) > -1;
          it.node.hidden = !m;
          if (m) self2._hl(it, t);
          if (m) {
            any = true;
            if (!it.disabled) vis.push(it);
          }
        });
        this.items.forEach(function(g) {
          if (g.type === "group") {
            g.node.hidden = !g.opts.some(function(o) {
              return !o.node.hidden;
            });
          }
        });
        this.vis = vis;
        this.empty.hidden = any;
        this.list.hidden = !any;
        this._runs();
        if (!this.isOpen) return;
        if (t) this._setActive(vis[0] || null, true);
        else if (!this.active || vis.indexOf(this.active) < 0) this._setActive(this._firstSelected() || vis[0] || null, true);
      };
      P._firstSelected = function() {
        for (var i = 0; i < this.vis.length; i++) if (this.vis[i].option.selected) return this.vis[i];
        return null;
      };
      P._setActive = function(item, reveal) {
        if (this.active && this.active.node) this.active.node.classList.remove("cs-active");
        this.active = item || null;
        var id = item && item.node ? item.node.id : null;
        [this.trigger, this.search].forEach(function(n) {
          if (id) n.setAttribute("aria-activedescendant", id);
          else n.removeAttribute("aria-activedescendant");
        });
        if (item && item.node) {
          item.node.classList.add("cs-active");
          if (reveal) this._reveal(item.node);
        }
      };
      P._reveal = function(node) {
        var list = this.list, pad = 4;
        var lr = list.getBoundingClientRect();
        var top = node;
        if (!node.previousElementSibling && node.parentNode && node.parentNode.classList.contains("cs-group")) {
          top = node.parentNode;
        }
        var tr = top.getBoundingClientRect(), nr = node.getBoundingClientRect();
        if (tr.top < lr.top) list.scrollTop -= lr.top - tr.top + pad;
        else if (nr.bottom > lr.bottom) list.scrollTop += nr.bottom - lr.bottom + pad;
      };
      P._move = function(delta) {
        var v = this.vis;
        if (!v.length) return;
        var i = v.indexOf(this.active);
        if (Math.abs(delta) === 1) {
          i = i < 0 ? delta > 0 ? 0 : v.length - 1 : (i + delta + v.length) % v.length;
        } else {
          i = Math.max(0, Math.min(v.length - 1, (i < 0 ? 0 : i) + delta));
        }
        this._setActive(v[i], true);
      };
      P._typeahead = function(ch) {
        var self2 = this, ta = this._ta;
        clearTimeout(ta.t);
        ta.buf += norm(ch);
        ta.t = setTimeout(function() {
          ta.buf = "";
        }, 700);
        var v = this.vis;
        if (!v.length) return;
        var start2 = Math.max(0, v.indexOf(this.active)) + (ta.buf.length === 1 ? 1 : 0);
        for (var k = 0; k < v.length; k++) {
          var it = v[(start2 + k) % v.length];
          if (norm(it.label).indexOf(ta.buf) === 0) {
            self2._setActive(it, true);
            return;
          }
        }
      };
      P._commit = function(before) {
        if (before === this._snap()) return false;
        this._sync();
        var el = this.el;
        this._silent = true;
        try {
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } finally {
          this._silent = false;
        }
        this._invalid = false;
        this._syncState();
        this._cb(this.o.onChange, this.getValue(), this);
        return true;
      };
      P._cb = function(fn) {
        if (typeof fn !== "function") return;
        try {
          fn.apply(this, Array.prototype.slice.call(arguments, 1));
        } catch (err) {
          if (typeof console !== "undefined" && console.error) console.error("CustomSelect callback hatas\u0131:", err);
        }
      };
      P._count = function() {
        return this.opts.filter(function(it) {
          return it.option.selected;
        }).length;
      };
      P._toggleItem = function(item, turnOn) {
        if (!item || item.disabled || this.disabled) return;
        var before = this._snap();
        var on = turnOn === void 0 ? !item.option.selected : turnOn;
        if (on && this.multiple && this.o.max > 0 && !item.option.selected && this._count() >= this.o.max) {
          this._limitHit();
          return;
        }
        item.option.selected = on;
        this._commit(before);
      };
      P._limitHit = function() {
        var w = this.wrapper;
        w.classList.remove("cs-limit");
        void w.offsetWidth;
        w.classList.add("cs-limit");
        setTimeout(function() {
          w.classList.remove("cs-limit");
        }, 400);
        this._cb(this.o.onMax, this.o.max, this);
      };
      P._choose = function(item) {
        if (!item || item.disabled) return;
        var close = this.o.closeOnSelect;
        if (close === null || close === void 0) close = !this.multiple;
        if (this.multiple) this._toggleItem(item);
        else {
          var before = this._snap();
          item.option.selected = true;
          this._commit(before);
        }
        if (close) this.close(true);
      };
      P._setAll = function(checked) {
        var before = this._snap();
        var pool = checked ? this.isOpen ? this.vis : this.opts.filter(function(it) {
          return !it.disabled;
        }) : this.opts.filter(function(it) {
          return !it.disabled;
        });
        var count = this._count(), max = this.o.max, hit = false;
        pool.forEach(function(it) {
          if (checked) {
            if (it.option.selected) return;
            if (max > 0 && count >= max) {
              hit = true;
              return;
            }
            it.option.selected = true;
            count++;
          } else {
            it.option.selected = false;
          }
        });
        this._commit(before);
        if (hit) this._limitHit();
      };
      P._keydown = function(e) {
        if (this.disabled || e.isComposing) return;
        var k = e.key, plain = !e.ctrlKey && !e.metaKey && !e.altKey;
        var self2 = this;
        if (!this.isOpen) {
          if (e.target !== this.trigger) return;
          if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
            e.preventDefault();
            this.open();
          } else if (k === "Backspace" || k === "Delete") {
            var sel = this.opts.filter(function(it) {
              return it.option.selected && !it.disabled;
            });
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
          case "ArrowDown":
            e.preventDefault();
            this._move(1);
            break;
          case "ArrowUp":
            e.preventDefault();
            this._move(-1);
            break;
          case "PageDown":
            e.preventDefault();
            this._move(8);
            break;
          case "PageUp":
            e.preventDefault();
            this._move(-8);
            break;
          case "Home":
            if (!inSearch || !this.search.value) {
              e.preventDefault();
              this._setActive(this.vis[0] || null, true);
            }
            break;
          case "End":
            if (!inSearch || !this.search.value) {
              e.preventDefault();
              this._setActive(this.vis[this.vis.length - 1] || null, true);
            }
            break;
          case "Enter":
            e.preventDefault();
            if (this.active) this._choose(this.active);
            break;
          case " ":
            if (!inSearch) {
              e.preventDefault();
              if (this.active) this._choose(this.active);
            }
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            this.close(true);
            break;
          case "Tab":
            this.close(true);
            break;
          case "a":
          case "A":
            if (this.multiple && (e.ctrlKey || e.metaKey) && (!inSearch || !this.search.value)) {
              e.preventDefault();
              this._setAll(true);
            }
            break;
          default:
            if (k && k.length === 1 && plain && !inSearch) {
              if (this.searchOn) {
                this.search.focus({ preventScroll: true });
              } else self2._typeahead(k);
            }
        }
      };
      P._isSheet = function() {
        var s = this.o.sheet;
        if (s === true) return true;
        if (s === false || !window.matchMedia) return false;
        return window.matchMedia("(max-width:" + this.o.sheetBreakpoint + "px)").matches;
      };
      P._applyTheme = function() {
        var cs = getComputedStyle(this.wrapper), m = this.menu.style;
        TOKENS.forEach(function(t) {
          var v = cs.getPropertyValue("--csi-" + t).trim();
          if (v) m.setProperty("--csi-" + t, v);
          else m.removeProperty("--csi-" + t);
        });
        m.fontFamily = cs.fontFamily;
        m.colorScheme = cs.colorScheme;
        var z = parseInt(cs.getPropertyValue("--csi-z"), 10) || 2e3;
        this.backdrop.style.zIndex = z - 1;
      };
      P._root = function() {
        var r = this.wrapper.closest && this.wrapper.closest('dialog,.modal,[aria-modal="true"],[data-cs-root]');
        return r || document.body;
      };
      P._position = function() {
        if (!this.wrapper.isConnected) {
          this.close(false);
          return;
        }
        var m = this.menu, st = m.style, o = this.o;
        var sheet = this._isSheet();
        this._sheet = sheet;
        m.classList.toggle("cs-sheet", sheet);
        if (sheet) {
          if (!this.backdrop.parentNode && m.parentNode) m.parentNode.insertBefore(this.backdrop, m);
          st.left = st.top = st.bottom = st.width = st.minWidth = st.maxWidth = st.maxHeight = "";
          m.classList.remove("cs-up");
          var vv = window.visualViewport;
          if (vv) {
            var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
            if (kb > 0) {
              st.bottom = kb + "px";
              st.maxHeight = Math.max(200, vv.height - 24) + "px";
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
        st.maxHeight = o.maxHeight + "px";
        st.maxWidth = Math.max(160, vw - pad * 2) + "px";
        st.minWidth = Math.min(Math.max(r.width, this._lockW || 0), Math.max(160, vw - pad * 2)) + "px";
        st.left = "0px";
        var mw = m.offsetWidth;
        if (!this._lockW || this._lockW < mw) this._lockW = mw;
        var natural = m.offsetHeight;
        var up = natural > below && above > below;
        var avail = Math.max(120, Math.min(o.maxHeight, up ? above : below));
        st.maxHeight = avail + "px";
        var rtl = getComputedStyle(this.trigger).direction === "rtl";
        var left = rtl ? r.right - mw : r.left;
        left = Math.min(Math.max(pad, left), Math.max(pad, vw - mw - pad));
        st.left = left + "px";
        if (up) {
          st.top = "auto";
          st.bottom = vh - r.top + gap + "px";
        } else {
          st.bottom = "auto";
          st.top = r.bottom + gap + "px";
        }
        m.classList.toggle("cs-up", up);
        var a = m.getBoundingClientRect(), dx = left - a.left;
        if (Math.abs(dx) > 0.5) st.left = left + dx + "px";
        if (up) {
          var db = a.bottom - (r.top - gap);
          if (Math.abs(db) > 0.5) st.bottom = parseFloat(st.bottom) + db + "px";
        } else {
          var dt = r.bottom + gap - a.top;
          if (Math.abs(dt) > 0.5) st.top = parseFloat(st.top) + dt + "px";
        }
      };
      P._lock = function(on) {
        if (on === !!this._locked) return;
        this._locked = on;
        var de = document.documentElement, b = document.body;
        var st = de.__bs6Lock || (de.__bs6Lock = { n: 0, o: "", p: "" });
        if (on) {
          if (st.n++ > 0) return;
          st.o = de.style.overflow;
          st.p = b.style.paddingRight;
          var sw = window.innerWidth - de.clientWidth;
          de.style.overflow = "hidden";
          var gutter = getComputedStyle(de).scrollbarGutter || "";
          if (sw > 0 && gutter.indexOf("stable") < 0) b.style.paddingRight = (parseFloat(getComputedStyle(b).paddingRight) || 0) + sw + "px";
        } else if (st.n > 0 && --st.n === 0) {
          de.style.overflow = st.o;
          b.style.paddingRight = st.p;
        }
      };
      P._sheetTitle = function() {
        var l = this._labels[0];
        var t = l && l.textContent.trim() || this.el.getAttribute("aria-label") || this._placeholder();
        this.title.textContent = t;
      };
      P.open = function() {
        if (!this.el) return this;
        if (!this.isOpen) this._syncState();
        if (this.isOpen || this.disabled || !this.wrapper.isConnected) return this;
        if (this._shown !== this._snap()) this._sync();
        if (CustomSelect2._open && CustomSelect2._open !== this) CustomSelect2._open.close(false);
        CustomSelect2._open = this;
        this.isOpen = true;
        this._applyTheme();
        this._lockW = 0;
        this._sheetTitle();
        this.menu.style.transform = "";
        this.backdrop.style.opacity = "";
        this._root().appendChild(this.menu);
        this.search.value = "";
        this._term = "";
        this.active = null;
        this._filter("");
        this._setActive(this._firstSelected() || this.vis[0] || null, false);
        this.menu.classList.add("cs-show");
        this._position();
        this.list.scrollTop = 0;
        if (this.active) this._reveal(this.active.node);
        this.wrapper.classList.add("cs-open");
        this.trigger.setAttribute("aria-expanded", "true");
        document.addEventListener("pointerdown", this._h.docPointer, true);
        window.addEventListener("resize", this._h.reposition);
        window.addEventListener("scroll", this._h.reposition, true);
        if (window.visualViewport) {
          window.visualViewport.addEventListener("resize", this._h.reposition);
          window.visualViewport.addEventListener("scroll", this._h.reposition);
        }
        if (this.searchOn && !this._sheet) this.search.focus({ preventScroll: true });
        else this.trigger.focus({ preventScroll: true });
        this._emit("open", this.o.onOpen);
        return this;
      };
      P.close = function(refocus) {
        if (!this.isOpen) return this;
        this.isOpen = false;
        this._lockW = 0;
        if (CustomSelect2._open === this) CustomSelect2._open = null;
        this._lock(false);
        this.menu.classList.remove("cs-show", "cs-up");
        if (this.menu.parentNode) this.menu.parentNode.removeChild(this.menu);
        if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
        this.wrapper.classList.remove("cs-open");
        this.trigger.setAttribute("aria-expanded", "false");
        this._setActive(null);
        document.removeEventListener("pointerdown", this._h.docPointer, true);
        window.removeEventListener("resize", this._h.reposition);
        window.removeEventListener("scroll", this._h.reposition, true);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", this._h.reposition);
          window.visualViewport.removeEventListener("scroll", this._h.reposition);
        }
        if (refocus) this.trigger.focus({ preventScroll: true });
        this._emit("close", this.o.onClose);
        return this;
      };
      P.toggle = function() {
        return this.isOpen ? this.close(true) : this.open();
      };
      P._emit = function(name, cb) {
        try {
          this.el.dispatchEvent(new CustomEvent("cs:" + name, { bubbles: true, detail: { instance: this } }));
        } catch (e) {
        }
        this._cb(cb, this);
      };
      P.getValue = function() {
        if (!this.el) return this.multiple ? [] : "";
        return this.multiple ? toArray2(this.el.selectedOptions).map(function(o) {
          return o.value;
        }) : this.el.value;
      };
      P.setValue = function(value, emit) {
        if (!this.el) return this;
        var arr = [].concat(value == null ? [] : value).map(String);
        var before = this._snap();
        var el = this.el;
        if (this.multiple) {
          toArray2(el.options).forEach(function(o) {
            o.selected = arr.indexOf(o.value) > -1;
          });
        } else {
          var found = toArray2(el.options).filter(function(o) {
            return o.value === arr[0];
          })[0];
          if (found) found.selected = true;
          else if (this.placeholderOpt) this.placeholderOpt.selected = true;
          else el.selectedIndex = -1;
        }
        if (emit) this._commit(before);
        else this._sync();
        return this;
      };
      P.clear = function(emit) {
        if (!this.el) return this;
        var before = this._snap();
        if (this.multiple) {
          this.opts.forEach(function(it) {
            if (!it.disabled) it.option.selected = false;
          });
        } else if (this.placeholderOpt) {
          this.placeholderOpt.selected = true;
        } else {
          this.el.selectedIndex = -1;
        }
        if (emit) this._commit(before);
        else this._sync();
        return this;
      };
      P.selectAll = function() {
        if (this.el) this._setAll(true);
        return this;
      };
      P.enable = function() {
        if (this.el) {
          this.el.disabled = false;
          this._syncState();
          this._sync();
        }
        return this;
      };
      P.disable = function() {
        if (this.el) {
          this.el.disabled = true;
          this._syncState();
          this._sync();
        }
        return this;
      };
      P.focus = function() {
        if (this.el && !this.disabled) this.trigger.focus();
        return this;
      };
      P.destroy = function() {
        var el = this.el;
        if (!el) return;
        this.close(false);
        clearTimeout(this._moTimer);
        if (this._raf) cancelAnimationFrame(this._raf);
        if (this._fitRaf) cancelAnimationFrame(this._fitRaf);
        clearTimeout(this._fitTimer);
        if (this._ro) this._ro.disconnect();
        if (this._mo) this._mo.disconnect();
        el.removeEventListener("change", this._h.nativeChange);
        el.removeEventListener("focus", this._h.nativeFocus);
        el.removeEventListener("invalid", this._h.nativeInvalid);
        if (this._form) this._form.removeEventListener("reset", this._h.formReset);
        this._labels.forEach(function(l) {
          if (l._csId) {
            l.removeAttribute("id");
            l._csId = false;
          }
        });
        if (this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
        if (this._shell) this._shell.classList.remove("cs-hidden-shell");
        el.classList.remove("cs-native");
        ["tabindex", "aria-hidden"].forEach(function(a, i) {
          var prev = i === 0 ? this._prev.tabindex : this._prev.ariaHidden;
          if (prev == null) el.removeAttribute(a);
          else el.setAttribute(a, prev);
        }, this);
        delete el._cs;
        this.el = null;
      };
      CustomSelect2.defaults = extend({}, DEFAULTS);
      CustomSelect2._open = null;
      CustomSelect2.version = "2.0.0";
      CustomSelect2.getInstance = function(el) {
        if (typeof el === "string") el = document.querySelector(el);
        return el && el._cs || null;
      };
      CustomSelect2.init = function(target, options) {
        if (!hasDOM2) return [];
        var nodes;
        if (typeof target === "string") nodes = toArray2(document.querySelectorAll(target));
        else if (target && target.nodeType === 1) nodes = [target];
        else nodes = toArray2(target);
        var out = [];
        nodes.forEach(function(n) {
          if (n && n.tagName === "SELECT") out.push(new CustomSelect2(n, options));
        });
        return out;
      };
      CustomSelect2.autoInit = function(scope) {
        if (!hasDOM2) return [];
        var out = [];
        toArray2((scope || document).querySelectorAll("select[data-custom-select]")).forEach(function(s) {
          if (s.getAttribute("data-custom-select") === "false") return;
          out.push(new CustomSelect2(s));
        });
        return out;
      };
      CustomSelect2.closeAll = function() {
        if (CustomSelect2._open) CustomSelect2._open.close(false);
      };
      return CustomSelect2;
    });
  }
});

// src/datepicker.cjs
var require_datepicker = __commonJS({
  "src/datepicker.cjs"(exports2, module2) {
    (function(root2, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.CustomDatePicker = factory();
      }
    })(typeof self !== "undefined" ? self : exports2, function() {
      "use strict";
      var hasDOM2 = typeof document !== "undefined";
      var uid = 0;
      var DEFAULTS = {
        mode: "single",
        // 'single' | 'range' | 'multiple'
        inline: null,
        // null: hedef <input> değilse true
        value: null,
        format: null,
        // null: dile göre (tr: dd.MM.yyyy)
        locale: null,
        // null: <html lang>; yoksa 'en'
        weekStart: null,
        // 0 = Pazar … 6; null: dile göre
        months: 1,
        // 1 | 2 (geniş ekranda yan yana ay sayısı)
        min: null,
        // Date | 'yyyy-MM-dd' | 'today'
        max: null,
        disabledDates: null,
        // Array<Date | string | [from, to]>
        disabledDays: null,
        // haftanın günleri: [0, 6] (0 = Pazar)
        disable: null,
        // function(date) -> true ise seçilemez
        minDays: 0,
        // range: en az gün sayısı (başlangıç ve bitiş dahil)
        maxDays: 0,
        // range: en çok gün sayısı (0: sınırsız)
        maxDates: 0,
        // multiple: en çok seçim sayısı (0: sınırsız)
        allowDisabledInRange: false,
        weekNumbers: false,
        showOutsideDays: true,
        footer: true,
        today: true,
        // "Bugün" düğmesi
        clear: true,
        // "Temizle" düğmesi
        closeOnSelect: null,
        // null: single/range true, multiple false
        openOn: "click",
        // 'click' | 'focus'
        sheet: "auto",
        // true | false | 'auto' (dar ekranda alttan açılan sayfa)
        sheetBreakpoint: 575,
        presets: null,
        // [{ label, value: Date | [Date, Date] | function }]
        altInput: null,
        // ISO değerin yazılacağı gizli girdi (seçici ya da eleman)
        toggle: null,
        // açma/kapama düğmesi (seçici ya da eleman)
        separator: " \u2013 ",
        // range metin ayracı
        placeholder: null,
        className: "",
        popupClass: "",
        texts: null,
        onChange: null,
        onOpen: null,
        onClose: null,
        onViewChange: null
      };
      var BOOL_KEYS = [
        "weekNumbers",
        "showOutsideDays",
        "footer",
        "today",
        "clear",
        "closeOnSelect",
        "allowDisabledInRange",
        "sheet",
        "inline"
      ];
      var NUM_KEYS = ["months", "minDays", "maxDays", "maxDates", "weekStart", "sheetBreakpoint"];
      var LIST_KEYS = ["disabledDays"];
      var I18N = {
        tr: {
          today: "Bug\xFCn",
          clear: "Temizle",
          done: "Tamam",
          close: "Kapat",
          prevMonth: "\xD6nceki ay",
          nextMonth: "Sonraki ay",
          prevYear: "\xD6nceki y\u0131l",
          nextYear: "Sonraki y\u0131l",
          prevYears: "\xD6nceki y\u0131llar",
          nextYears: "Sonraki y\u0131llar",
          chooseMonth: "Ay se\xE7",
          chooseYear: "Y\u0131l se\xE7",
          week: "Hf",
          calendar: "Takvim",
          pickDate: "Tarih se\xE7in",
          pickRange: "Tarih aral\u0131\u011F\u0131 se\xE7in",
          pickDates: "Tarihleri se\xE7in"
        },
        en: {
          today: "Today",
          clear: "Clear",
          done: "Done",
          close: "Close",
          prevMonth: "Previous month",
          nextMonth: "Next month",
          prevYear: "Previous year",
          nextYear: "Next year",
          prevYears: "Previous years",
          nextYears: "Next years",
          chooseMonth: "Choose month",
          chooseYear: "Choose year",
          week: "Wk",
          calendar: "Calendar",
          pickDate: "Select a date",
          pickRange: "Select a date range",
          pickDates: "Select dates"
        }
      };
      var TOKENS = [
        "accent",
        "accent-soft",
        "accent-text",
        "on-accent",
        "ring",
        "bg",
        "fg",
        "muted",
        "faint",
        "border",
        "divider",
        "hover",
        "radius",
        "cell",
        "font-size",
        "shadow",
        "z"
      ];
      var ICON = {
        prev: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        next: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        x: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
      };
      function toArray2(l) {
        return Array.prototype.slice.call(l || []);
      }
      function clamp(v, a, b) {
        return Math.min(b, Math.max(a, v));
      }
      function pad(n, l) {
        n = String(Math.abs(n));
        while (n.length < (l || 2)) n = "0" + n;
        return n;
      }
      function extend(t) {
        for (var i = 1; i < arguments.length; i++) {
          var s = arguments[i];
          if (!s) continue;
          for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== void 0) t[k] = s[k];
        }
        return t;
      }
      function h(tag, cls, attrs, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (attrs) {
          for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
        }
        if (html) n.innerHTML = html;
        return n;
      }
      function readData(el) {
        var out = {};
        for (var key2 in DEFAULTS) {
          var raw = el.dataset ? el.dataset["cdp" + key2.charAt(0).toUpperCase() + key2.slice(1)] : void 0;
          if (raw === void 0) continue;
          if (BOOL_KEYS.indexOf(key2) > -1) {
            if (raw === "true" || raw === "") out[key2] = true;
            else if (raw === "false") out[key2] = false;
            else out[key2] = raw;
          } else if (NUM_KEYS.indexOf(key2) > -1) {
            var n = Number(raw);
            if (!isNaN(n)) out[key2] = n;
          } else if (LIST_KEYS.indexOf(key2) > -1) {
            out[key2] = raw.split(",").map(function(x) {
              return +x;
            }).filter(function(x) {
              return !isNaN(x);
            });
          } else {
            out[key2] = raw;
          }
        }
        return out;
      }
      function norm(s) {
        s = String(s == null ? "" : s).toLowerCase();
        if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
        return s.replace(/ı/g, "i").replace(/\.$/, "");
      }
      function mk(y, m, d) {
        var x = new Date(2e3, 0, 1);
        x.setFullYear(y, m, d);
        x.setHours(0, 0, 0, 0);
        return x;
      }
      function sod(d) {
        return mk(d.getFullYear(), d.getMonth(), d.getDate());
      }
      function addDays(d, n) {
        return mk(d.getFullYear(), d.getMonth(), d.getDate() + n);
      }
      function addMonths(d, n) {
        var y = d.getFullYear(), m = d.getMonth() + n;
        var last = mk(y, m + 1, 0).getDate();
        return mk(y, m, Math.min(d.getDate(), last));
      }
      function addYears(d, n) {
        return addMonths(d, n * 12);
      }
      function validDate(d) {
        return d instanceof Date && !isNaN(d.getTime());
      }
      function dn(d) {
        var u = /* @__PURE__ */ new Date(0);
        u.setUTCFullYear(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.round(u.getTime() / 864e5);
      }
      function fromDn(n) {
        var u = new Date(n * 864e5);
        return mk(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
      }
      function key(d) {
        return pad(d.getFullYear(), 4) + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      }
      function parseISO(s) {
        var m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
        if (!m) return null;
        var d = mk(+m[1], +m[2] - 1, +m[3]);
        return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
      }
      function isoWeek(d) {
        var t = mk(d.getFullYear(), d.getMonth(), d.getDate());
        t.setDate(t.getDate() + 3 - (t.getDay() + 6) % 7);
        var w1 = mk(t.getFullYear(), 0, 4);
        return 1 + Math.round((dn(t) - dn(w1) - 3 + (w1.getDay() + 6) % 7) / 7);
      }
      var nameCache = {};
      function names(loc) {
        if (nameCache[loc]) return nameCache[loc];
        var mkF = function(opt) {
          try {
            return new Intl.DateTimeFormat(loc, opt);
          } catch (e) {
            return new Intl.DateTimeFormat("en", opt);
          }
        };
        var mL = mkF({ month: "long" }), mS = mkF({ month: "short" });
        var wL = mkF({ weekday: "long" }), wS = mkF({ weekday: "short" });
        var out = { months: [], monthsShort: [], days: [], daysShort: [] };
        for (var i = 0; i < 12; i++) {
          out.months.push(mL.format(mk(2021, i, 1)));
          out.monthsShort.push(mS.format(mk(2021, i, 1)));
        }
        for (var j = 0; j < 7; j++) {
          out.days.push(wL.format(mk(2021, 7, 1 + j)));
          out.daysShort.push(wS.format(mk(2021, 7, 1 + j)));
        }
        return nameCache[loc] = out;
      }
      var longCache = {};
      function longFormatter(loc) {
        if (longCache[loc]) return longCache[loc];
        var opt = { weekday: "long", day: "numeric", month: "long", year: "numeric" }, f;
        try {
          f = new Intl.DateTimeFormat(loc, opt);
        } catch (e) {
          f = new Intl.DateTimeFormat("en", opt);
        }
        return longCache[loc] = f;
      }
      function weekStartFor(loc) {
        try {
          var L = new Intl.Locale(loc);
          var wi = L.getWeekInfo ? L.getWeekInfo() : L.weekInfo;
          if (wi && wi.firstDay) return wi.firstDay % 7;
        } catch (e) {
        }
        var lang = String(loc).toLowerCase().split("-")[0];
        return lang === "en" && !/-(gb|au|ie|nz|in)$/i.test(loc) ? 0 : lang === "ja" || lang === "he" ? 0 : 1;
      }
      var TOKEN_RE = /'[^']*'|yyyy|yy|MMMM|MMM|MM|M|dd|d|gg|aa|EEEE|EEE/g;
      function formatDate(d, fmt, loc) {
        var N = names(loc);
        return fmt.replace(TOKEN_RE, function(t) {
          switch (t) {
            case "yyyy":
              return pad(d.getFullYear(), 4);
            case "yy":
              return pad(d.getFullYear() % 100, 2);
            case "MMMM":
              return N.months[d.getMonth()];
            case "MMM":
              return N.monthsShort[d.getMonth()];
            case "MM":
            case "aa":
              return pad(d.getMonth() + 1);
            case "M":
              return String(d.getMonth() + 1);
            case "dd":
            case "gg":
              return pad(d.getDate());
            case "d":
              return String(d.getDate());
            case "EEEE":
              return N.days[d.getDay()];
            case "EEE":
              return N.daysShort[d.getDay()];
            default:
              return t.slice(1, -1) || "'";
          }
        });
      }
      function esc(s) {
        return s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
      }
      function compileFormat(fmt) {
        var parts = [], re = "", last = 0, m;
        TOKEN_RE.lastIndex = 0;
        function lit(s) {
          for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            if (/[.\/\-]/.test(c)) re += "[.\\/\\-]";
            else if (/\s/.test(c)) re += "\\s*";
            else re += esc(c);
          }
        }
        while (m = TOKEN_RE.exec(fmt)) {
          if (m.index > last) lit(fmt.slice(last, m.index));
          last = m.index + m[0].length;
          var t = m[0];
          if (t.charAt(0) === "'") {
            lit(t.slice(1, -1));
            continue;
          }
          parts.push(t);
          if (t === "yyyy") re += "(\\d{4}|\\d{2})";
          else if (t === "yy") re += "(\\d{2})";
          else if (t === "MM" || t === "M" || t === "dd" || t === "d" || t === "gg" || t === "aa") re += "(\\d{1,2})";
          else re += "([^\\d\\s.,\\/\\-\\u2013]+\\.?)";
        }
        if (last < fmt.length) lit(fmt.slice(last));
        return { re: new RegExp("^\\s*" + re + "\\s*$", "i"), parts };
      }
      var fmtCache = {};
      function parseDate(text, fmt, loc) {
        var c = fmtCache[fmt] || (fmtCache[fmt] = compileFormat(fmt));
        var m = c.re.exec(text);
        if (!m) return null;
        var now = /* @__PURE__ */ new Date(), y = now.getFullYear(), mo2 = 0, d = 1, hasM = false, hasD = false, N = names(loc);
        for (var i = 0; i < c.parts.length; i++) {
          var t = c.parts[i], v = m[i + 1];
          if (t === "yyyy" && v.length === 4) y = +v;
          else if (t === "yyyy" || t === "yy") {
            y = 2e3 + +v;
            if (y > now.getFullYear() + 20) y -= 100;
          } else if (t === "MM" || t === "M" || t === "aa") {
            mo2 = +v - 1;
            hasM = true;
          } else if (t === "dd" || t === "d" || t === "gg") {
            d = +v;
            hasD = true;
          } else if (t === "MMMM" || t === "MMM") {
            var nv = norm(v), idx = -1;
            for (var k = 0; k < 12; k++) {
              if (norm(N.months[k]) === nv || norm(N.monthsShort[k]) === nv) {
                idx = k;
                break;
              }
            }
            if (idx < 0) return null;
            mo2 = idx;
            hasM = true;
          }
        }
        if (!hasD && !hasM) return null;
        if (mo2 < 0 || mo2 > 11 || d < 1 || d > 31) return null;
        var out = mk(y, mo2, d);
        return out.getMonth() === mo2 && out.getDate() === d ? out : null;
      }
      function CustomDatePicker2(target, options) {
        if (!hasDOM2) return;
        if (typeof target === "string") target = document.querySelector(target);
        if (!target || target.nodeType !== 1) throw new TypeError("CustomDatePicker: ge\xE7erli bir eleman gerekli.");
        if (target._cdp) return target._cdp;
        this.el = target;
        this.o = extend({}, CustomDatePicker2.defaults, readData(target), options);
        this.isInput = target.tagName === "INPUT";
        this.inline = this.o.inline === null || this.o.inline === void 0 ? !this.isInput : !!this.o.inline;
        if (!this.isInput && !this.inline) throw new TypeError("CustomDatePicker: a\xE7\u0131l\u0131r takvim i\xE7in <input> gerekli.");
        if (this.inline && this.isInput) throw new TypeError("CustomDatePicker: sat\u0131r i\xE7i takvim i\xE7in <div> gibi bir kapsay\u0131c\u0131 kullan\u0131n.");
        this.id = "cdp-" + ++uid;
        this.isOpen = false;
        this.viewMode = "days";
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
          try {
            this.destroy();
          } catch (e2) {
          }
          if (this.isInput) target.classList.remove("cdp-input");
          delete target._cdp;
          throw err;
        }
        target._cdp = this;
      }
      var P = CustomDatePicker2.prototype;
      P._setup = function() {
        var o = this.o;
        this.loc = o.locale || document.documentElement.lang || "en";
        var lang = String(this.loc).toLowerCase().split("-")[0];
        this.t = extend({}, I18N[lang] || I18N.en, o.texts);
        this.fmt = o.format || (lang === "tr" ? "gg.aa.yyyy" : lang === "en" ? /-(gb|au|ie|nz|in)$/i.test(this.loc) ? "dd/MM/yyyy" : "MM/dd/yyyy" : "yyyy-MM-dd");
        this.ws = o.weekStart != null ? (+o.weekStart % 7 + 7) % 7 : weekStartFor(this.loc);
        this.mode = o.mode === "range" || o.mode === "multiple" ? o.mode : "single";
        this.multiSep = this.fmt.indexOf(",") > -1 ? "; " : ", ";
        this._compileConstraints();
      };
      P._compileConstraints = function() {
        var self2 = this, o = this.o;
        this.min = o.min ? this._toDate(o.min) : null;
        this.max = o.max ? this._toDate(o.max) : null;
        this.disabledRanges = [];
        this._dc = {};
        this._win = null;
        toArray2(o.disabledDates).forEach(function(x) {
          if (Array.isArray(x)) {
            var a = self2._toDate(x[0]), b = self2._toDate(x[1]);
            if (a && b) self2.disabledRanges.push([dn(a), dn(b)]);
          } else {
            var d = self2._toDate(x);
            if (d) self2.disabledRanges.push([dn(d), dn(d)]);
          }
        });
      };
      P._toDate = function(x) {
        if (x == null || x === "") return null;
        if (x instanceof Date) return validDate(x) ? sod(x) : null;
        if (typeof x === "number") {
          var d0 = new Date(x);
          return validDate(d0) ? sod(d0) : null;
        }
        var s = String(x).trim();
        if (s === "today") return sod(/* @__PURE__ */ new Date());
        return parseISO(s) || parseDate(s, this.fmt, this.loc);
      };
      P._isDis = function(d) {
        var n = dn(d);
        if (this.min && n < dn(this.min)) return true;
        if (this.max && n > dn(this.max)) return true;
        var dd = this.o.disabledDays;
        if (dd && dd.indexOf(d.getDay()) > -1) return true;
        for (var i = 0; i < this.disabledRanges.length; i++) {
          if (n >= this.disabledRanges[i][0] && n <= this.disabledRanges[i][1]) return true;
        }
        if (typeof this.o.disable === "function") {
          try {
            if (this.o.disable(new Date(d.getTime()))) return true;
          } catch (e) {
          }
        }
        return false;
      };
      P._isDisN = function(n) {
        var c = this._dc;
        if (c[n] !== void 0) return c[n];
        return c[n] = this._isDis(fromDn(n));
      };
      P._rangeOk = function(a, b) {
        var x = dn(a), y = dn(b);
        if (y < x) {
          var t = x;
          x = y;
          y = t;
        }
        var count = y - x + 1, o = this.o;
        if (o.minDays && count < o.minDays) return false;
        if (o.maxDays && count > o.maxDays) return false;
        if (!o.allowDisabledInRange && count <= 400) {
          for (var n = x; n <= y; n++) if (this._isDisN(n)) return false;
        }
        return true;
      };
      P._calcWindow = function(start2) {
        var o = this.o, s = dn(start2), lo = -Infinity, hi = Infinity, n;
        if (o.maxDays) {
          hi = s + o.maxDays - 1;
          lo = s - o.maxDays + 1;
        }
        if (!o.allowDisabledInRange) {
          var cap = o.maxDays || 400;
          for (n = s + 1; n <= s + cap; n++) if (this._isDisN(n)) {
            hi = Math.min(hi, n - 1);
            break;
          }
          for (n = s - 1; n >= s - cap; n--) if (this._isDisN(n)) {
            lo = Math.max(lo, n + 1);
            break;
          }
        }
        return { s, lo, hi };
      };
      P._pendingOk = function(d) {
        if (!this.pending) return true;
        var s = dn(this.pending);
        if (!this._win || this._win.s !== s) this._win = this._calcWindow(this.pending);
        var w = this._win, n = dn(d);
        if (n < w.lo || n > w.hi) return false;
        return !(this.o.minDays && Math.abs(n - s) + 1 < this.o.minDays);
      };
      P._splitRange = function(s) {
        var sep = this.o.separator.trim();
        var parts = sep ? s.split(sep) : [s];
        if (parts.length !== 2) parts = s.split(/\s+[–—\-]\s+|\s+(?:to|ile|–)\s+/i);
        return parts.length === 2 ? parts : null;
      };
      P._coerce = function(x) {
        var self2 = this, m = this.mode;
        var empty = m === "multiple" ? [] : null;
        if (x == null || x === "") return empty;
        if (m === "single") {
          if (Array.isArray(x)) x = x[0];
          var d = this._toDate(x);
          return d && !this._isDis(d) ? d : null;
        }
        if (m === "range") {
          var a, b;
          if (Array.isArray(x)) {
            a = this._toDate(x[0]);
            b = this._toDate(x[1]);
          } else if (typeof x === "string") {
            var iso = /^\s*(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})\s*$/.exec(x);
            var p = iso ? [iso[1], iso[2]] : this._splitRange(x);
            if (p) {
              a = this._toDate(p[0]);
              b = this._toDate(p[1]);
            }
          } else if (x && typeof x === "object" && !(x instanceof Date)) {
            a = this._toDate(x.start || x.from);
            b = this._toDate(x.end || x.to);
          }
          if (!a || !b) return null;
          if (dn(b) < dn(a)) {
            var t = a;
            a = b;
            b = t;
          }
          return this._isDis(a) || this._isDis(b) || !this._rangeOk(a, b) ? null : [a, b];
        }
        var list = Array.isArray(x) ? x : typeof x === "string" ? x.split(/\s*[;,]\s*/) : [x];
        var seen = {}, out = [];
        list.forEach(function(it) {
          var dd = self2._toDate(it);
          if (dd && !self2._isDis(dd) && !seen[key(dd)]) {
            seen[key(dd)] = 1;
            out.push(dd);
          }
        });
        out.sort(function(p1, p2) {
          return p1 - p2;
        });
        if (this.o.maxDates > 0) out = out.slice(0, this.o.maxDates);
        return out;
      };
      P._key = function(v) {
        if (this.mode === "single") return v ? key(v) : "";
        if (this.mode === "range") return v ? key(v[0]) + "/" + key(v[1]) : "";
        return v.map(key).join(",");
      };
      P._text = function(v) {
        var self2 = this;
        if (this.mode === "single") return v ? formatDate(v, this.fmt, this.loc) : "";
        if (this.mode === "range") return v ? formatDate(v[0], this.fmt, this.loc) + this.o.separator + formatDate(v[1], this.fmt, this.loc) : "";
        return v.map(function(d) {
          return formatDate(d, self2.fmt, self2.loc);
        }).join(this.multiSep);
      };
      P._parseText = function(s) {
        s = String(s == null ? "" : s).trim();
        var empty = this.mode === "multiple" ? [] : null;
        if (!s) return empty;
        var self2 = this, d;
        if (this.mode === "single") {
          d = parseDate(s, this.fmt, this.loc);
          return d && !this._isDis(d) ? d : void 0;
        }
        if (this.mode === "range") {
          var p = this._splitRange(s);
          if (!p) return void 0;
          var a = parseDate(p[0], this.fmt, this.loc), b = parseDate(p[1], this.fmt, this.loc);
          if (!a || !b) return void 0;
          var v = this._coerce([a, b]);
          return v || void 0;
        }
        var parts = s.split(/\s*[;,]\s*/), out = [], bad = false;
        if (this.fmt.indexOf(",") > -1) parts = s.split(/\s*;\s*/);
        parts.forEach(function(it) {
          var dd = parseDate(it, self2.fmt, self2.loc);
          if (!dd || self2._isDis(dd)) bad = true;
          else out.push(dd);
        });
        return bad ? void 0 : this._coerce(out);
      };
      P._build = function() {
        var el = this.el, o = this.o, t = this.t, id = this.id;
        var pop = h("div", "cdp-popup cdp-root" + (this.inline ? "" : " cdp-float") + (o.popupClass ? " " + o.popupClass : ""), {
          role: "dialog",
          "aria-label": this.mode === "range" ? t.pickRange : this.mode === "multiple" ? t.pickDates : t.pickDate,
          id: id + "-pop"
        });
        var head = h("div", "cdp-head");
        head.appendChild(h("span", "cdp-grab", { "aria-hidden": "true" }));
        var row = h("div", "cdp-head-row");
        var title = h("span", "cdp-title");
        var close = h("button", "cdp-sheet-close", { type: "button", "aria-label": t.close, title: t.close }, ICON.x);
        row.appendChild(title);
        row.appendChild(close);
        head.appendChild(row);
        pop.appendChild(head);
        this.presetBox = null;
        this.pop = pop;
        var cal = h("div", "cdp-cal");
        pop.appendChild(cal);
        this.cal = cal;
        this._buildPresets();
        var foot = h("div", "cdp-foot");
        var bToday = h("button", "cdp-foot-btn", { type: "button", "data-act": "today" });
        bToday.textContent = t.today;
        var bClear = h("button", "cdp-foot-btn cdp-muted", { type: "button", "data-act": "clear" });
        bClear.textContent = t.clear;
        var bDone = h("button", "cdp-foot-btn cdp-primary", { type: "button", "data-act": "done" });
        bDone.textContent = t.done;
        foot.appendChild(bToday);
        foot.appendChild(h("span", "cdp-foot-spacer"));
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
        this.backdrop = h("div", "cdp-backdrop");
        if (this.inline) {
          el.classList.add("cdp-root", "cdp-inline");
          if (o.className) o.className.split(/\s+/).filter(Boolean).forEach(function(c) {
            el.classList.add(c);
          });
          el.appendChild(pop);
          this.themeEl = el;
        } else {
          if (el.classList.contains("cdp-input")) {
            el.classList.remove("cdp-input");
            ["role", "aria-haspopup", "aria-expanded", "aria-controls", "aria-activedescendant"].forEach(function(a) {
              el.removeAttribute(a);
            });
          }
          this._saved = {
            type: el.getAttribute("type"),
            placeholder: el.getAttribute("placeholder"),
            autocomplete: el.getAttribute("autocomplete"),
            role: el.getAttribute("role"),
            haspopup: el.getAttribute("aria-haspopup"),
            expanded: el.getAttribute("aria-expanded"),
            controls: el.getAttribute("aria-controls"),
            inputmode: el.getAttribute("inputmode"),
            cls: o.className
          };
          if ((el.getAttribute("type") || "").toLowerCase() === "date") el.setAttribute("type", "text");
          el.classList.add("cdp-input");
          if (o.className) o.className.split(/\s+/).filter(Boolean).forEach(function(c) {
            el.classList.add(c);
          });
          el.setAttribute("autocomplete", "off");
          el.setAttribute("role", "combobox");
          el.setAttribute("aria-haspopup", "dialog");
          el.setAttribute("aria-expanded", "false");
          el.setAttribute("aria-controls", id + "-pop");
          this._autoPh = !el.getAttribute("placeholder") && !o.placeholder;
          this._setPlaceholder();
          this.themeEl = el;
        }
        this.alt = o.altInput ? typeof o.altInput === "string" ? document.querySelector(o.altInput) : o.altInput : null;
      };
      P._setPlaceholder = function() {
        if (!this.isInput) return;
        var el = this.el, o = this.o;
        if (o.placeholder) el.setAttribute("placeholder", o.placeholder);
        else if (this._autoPh || !el.getAttribute("placeholder")) {
          this._autoPh = true;
          el.setAttribute("placeholder", this.mode === "range" ? this.fmt + o.separator + this.fmt : this.fmt);
        }
      };
      P._buildPresets = function() {
        var presets = this.o.presets;
        if (this.presetBox && this.presetBox.parentNode) this.presetBox.parentNode.removeChild(this.presetBox);
        this.presetBox = null;
        if (!presets || !presets.length) return;
        var pb = h("div", "cdp-presets");
        presets.forEach(function(p, i) {
          var b = h("button", "cdp-preset", { type: "button", "data-p": i });
          b.textContent = p.label;
          pb.appendChild(b);
        });
        this.pop.insertBefore(pb, this.cal);
        this.presetBox = pb;
      };
      P._init = function() {
        var o = this.o, v;
        if (o.value != null) v = this._coerce(o.value);
        else if (this.isInput && this.el.value) {
          var parsed = this._parseText(this.el.value);
          v = parsed === void 0 ? this._coerce(this.el.value) : parsed;
        } else v = this._coerce(this.el.getAttribute && this.el.getAttribute("data-value"));
        this.v = v === void 0 ? this.mode === "multiple" ? [] : null : v;
        this._emitKey = this._key(this.v);
        this._startView();
        this._syncInput();
        if (this.inline) this._render();
      };
      P._startView = function() {
        var base = this._anchorDate();
        this.active = base;
        this.view = { y: base.getFullYear(), m: base.getMonth() };
        this.viewMode = "days";
      };
      P._anchorDate = function() {
        var v = this.v, d;
        if (this.mode === "single") d = v;
        else if (this.mode === "range") d = v && v[0];
        else d = v && v[0];
        d = d || sod(/* @__PURE__ */ new Date());
        if (this.min && dn(d) < dn(this.min)) d = this.min;
        if (this.max && dn(d) > dn(this.max)) d = this.max;
        return d;
      };
      P._bind = function() {
        var self2 = this, el = this.el, H = this._h = {}, pop = this.pop;
        H.popClick = function(e) {
          var b = e.target.closest ? e.target.closest("[data-act],[data-d],[data-m],[data-y],[data-p]") : null;
          if (!b || !pop.contains(b)) return;
          if (b.hasAttribute("data-d")) {
            if (!b.disabled) self2._pick(parseISO(b.getAttribute("data-d")));
            return;
          }
          if (b.hasAttribute("data-m")) {
            self2._pickMonth(+b.getAttribute("data-m"));
            return;
          }
          if (b.hasAttribute("data-y")) {
            self2._pickYear(+b.getAttribute("data-y"));
            return;
          }
          if (b.hasAttribute("data-p")) {
            self2._preset(+b.getAttribute("data-p"));
            return;
          }
          self2._act(b.getAttribute("data-act"));
        };
        H.popDown = function(e) {
          if (!self2.inline && e.target !== self2.el) e.preventDefault();
        };
        H.popOver = function(e) {
          if (self2.mode !== "range" || !self2.pending) return;
          var b = e.target.closest ? e.target.closest("[data-d]") : null;
          var d = b ? parseISO(b.getAttribute("data-d")) : null;
          if (d && (!self2.hover || dn(d) !== dn(self2.hover))) {
            self2.hover = d;
            self2._paint();
          }
        };
        H.popLeave = function() {
          if (self2.hover) {
            self2.hover = null;
            self2._paint();
          }
        };
        H.popMove = function() {
          self2.pop.classList.remove("cdp-kb");
        };
        H.keydown = function(e) {
          self2._key_(e);
        };
        pop.addEventListener("click", H.popClick);
        pop.addEventListener("mousedown", H.popDown);
        pop.addEventListener("mouseover", H.popOver);
        pop.addEventListener("mouseleave", H.popLeave);
        pop.addEventListener("pointermove", H.popMove, { passive: true });
        pop.addEventListener("keydown", H.keydown);
        this.backdrop.addEventListener("click", function() {
          self2.close(true);
        });
        this.closeBtn.addEventListener("click", function() {
          self2.close(true);
        });
        var drag = null;
        H.dragStart = function(e) {
          if (!self2._sheet || e.button !== void 0 && e.button > 0) return;
          if (e.target.closest && e.target.closest(".cdp-sheet-close")) return;
          drag = { y: e.clientY, t: Date.now(), dy: 0 };
          try {
            self2.head.setPointerCapture(e.pointerId);
          } catch (x) {
          }
          self2.pop.style.transition = "none";
        };
        H.dragMove = function(e) {
          if (!drag) return;
          drag.dy = Math.max(0, e.clientY - drag.y);
          self2.pop.style.transform = "translateY(" + drag.dy + "px)";
          self2.backdrop.style.opacity = String(Math.max(0, 1 - drag.dy / (self2.pop.offsetHeight || 1)));
        };
        H.dragEnd = function() {
          if (!drag) return;
          var d = drag, speed = d.dy / Math.max(1, Date.now() - d.t);
          drag = null;
          self2.pop.style.transition = "";
          if (d.dy > 90 || d.dy > 24 && speed > 0.5) self2.close(true);
          else {
            self2.pop.style.transform = "";
            self2.backdrop.style.opacity = "";
          }
        };
        this.head.addEventListener("pointerdown", H.dragStart);
        this.head.addEventListener("pointermove", H.dragMove);
        this.head.addEventListener("pointerup", H.dragEnd);
        this.head.addEventListener("pointercancel", H.dragEnd);
        H.docPointer = function(e) {
          var t = e.target;
          if (pop.contains(t) || t === self2.el || t === self2.backdrop) return;
          if (self2._toggles.some(function(b) {
            return b === t || b.contains(t);
          })) return;
          self2.close(false);
        };
        H.reposition = function(e) {
          var t = e && e.target;
          if (t && t.nodeType === 1 && pop.contains(t)) return;
          if (!self2.el.isConnected) {
            self2.close(false);
            return;
          }
          if (self2._raf) return;
          self2._raf = requestAnimationFrame(function() {
            self2._raf = 0;
            if (self2.isOpen) self2._position();
          });
        };
        this._toggles = [];
        if (this.isInput) {
          H.click = function() {
            if (!self2.isOpen && self2.o.openOn !== "focus") self2.open();
          };
          H.focus = function() {
            if (!self2.isOpen && !self2._refocusing && self2.o.openOn === "focus") self2.open();
          };
          H.input = function() {
            self2._onInput();
          };
          H.change = function(e) {
            self2._onNativeChange(e);
          };
          H.blur = function() {
          };
          H.inKey = function(e) {
            self2._key_(e);
          };
          H.formReset = function() {
            setTimeout(function() {
              if (!self2._dead) self2.refresh();
            }, 0);
          };
          el.addEventListener("click", H.click);
          el.addEventListener("focus", H.focus);
          el.addEventListener("input", H.input);
          el.addEventListener("change", H.change, true);
          el.addEventListener("keydown", H.inKey);
          this._form = el.form;
          if (this._form) this._form.addEventListener("reset", H.formReset);
          var tg = this.o.toggle;
          if (tg) {
            this._toggles = (typeof tg === "string" ? toArray2(document.querySelectorAll(tg)) : [tg]).filter(Boolean);
            H.toggle = function(e) {
              e.preventDefault();
              self2.toggle();
            };
            this._toggles.forEach(function(b) {
              b.addEventListener("click", H.toggle);
            });
          }
          if (typeof MutationObserver !== "undefined") {
            this._mo = new MutationObserver(function() {
              if (el.disabled && self2.isOpen) self2.close(false);
            });
            this._mo.observe(el, { attributes: true, attributeFilter: ["disabled"] });
          }
        }
      };
      P._syncInput = function() {
        var txt = this._text(this.v);
        this._cur = txt;
        if (this.isInput && this.el.value !== txt) this.el.value = txt;
        if (this.alt) {
          var v = this.v, s = "";
          if (this.mode === "single") s = v ? key(v) : "";
          else if (this.mode === "range") s = v ? key(v[0]) + "/" + key(v[1]) : "";
          else s = v.map(key).join(",");
          this.alt.value = s;
        }
      };
      P._onInput = function() {
        this._dirty = true;
        var v = this._parseText(this.el.value);
        if (v === void 0) return;
        this.v = v;
        var a = this._anchorDate(), ov = this.view.y * 12 + this.view.m, om = this.viewMode;
        this.active = a;
        this.view = { y: a.getFullYear(), m: a.getMonth() };
        this.viewMode = "days";
        if (!this.isOpen) return;
        var n = this._nMonths(), idx = a.getFullYear() * 12 + a.getMonth() - ov;
        if (om === "days" && idx >= 0 && idx < n) {
          this.view = { y: Math.floor(ov / 12), m: ov % 12 };
          this._paint();
        } else {
          this._render();
          this._position();
        }
      };
      P._onNativeChange = function(e) {
        if (!e.isTrusted || this._silent) return;
        var txt = this.el.value, v = this._parseText(txt);
        var changed;
        if (v === void 0) v = this.v;
        else this.v = v;
        this._syncInput();
        this._dirty = false;
        changed = this._key(this.v) !== this._emitKey;
        if (!changed) {
          e.stopImmediatePropagation();
          return;
        }
        this._emitKey = this._key(this.v);
        this._paint();
        this._cb(this.o.onChange, this.getValue(), this);
        this._fire("change", false);
      };
      P._commitText = function() {
        if (!this._dirty) return;
        var v = this._parseText(this.el.value);
        var prev = this._emitKey;
        if (v !== void 0) this.v = v;
        this._syncInput();
        this._dirty = false;
        if (this._key(this.v) !== prev) this._commit();
      };
      P._commit = function() {
        var k = this._key(this.v);
        this._syncInput();
        this._dirty = false;
        if (k === this._emitKey) {
          this._paint();
          return false;
        }
        this._emitKey = k;
        this._paint();
        if (this.isInput) {
          this._silent = true;
          try {
            this.el.dispatchEvent(new Event("input", { bubbles: true }));
            this.el.dispatchEvent(new Event("change", { bubbles: true }));
          } finally {
            this._silent = false;
          }
        }
        this._cb(this.o.onChange, this.getValue(), this);
        this._fire("change", true);
        return true;
      };
      P._fire = function(name) {
        try {
          this.el.dispatchEvent(new CustomEvent("cdp:" + name, { bubbles: true, detail: { value: this.getValue(), instance: this } }));
        } catch (e) {
        }
      };
      P._cb = function(fn) {
        if (typeof fn !== "function") return;
        try {
          fn.apply(this, Array.prototype.slice.call(arguments, 1));
        } catch (e) {
          if (typeof console !== "undefined" && console.error) console.error("CustomDatePicker callback hatas\u0131:", e);
        }
      };
      P._closeOnSelect = function() {
        var c = this.o.closeOnSelect;
        return c === null || c === void 0 ? this.mode !== "multiple" : !!c;
      };
      P._pick = function(d) {
        if (!d) return;
        if (this.mode === "range" && this.pending && dn(d) === dn(this.pending) && !this._rangeOk(d, d)) {
          this.pending = null;
          this.hover = null;
          this.active = d;
          this._paint();
          return;
        }
        if (this._blocked(d)) return;
        this.active = d;
        var m = this.mode;
        if (m === "single") {
          this.v = d;
          this._afterPick(true);
        } else if (m === "range") {
          if (!this.pending) {
            this.pending = d;
            this.hover = null;
          } else {
            var a = this.pending, b = d;
            if (dn(b) < dn(a)) {
              var t = a;
              a = b;
              b = t;
            }
            this.v = [a, b];
            this.pending = null;
            this.hover = null;
            this._afterPick(true);
            return;
          }
        } else {
          var k = key(d), list = this.v.slice(), i = -1;
          list.forEach(function(x, idx) {
            if (key(x) === k) i = idx;
          });
          if (i > -1) list.splice(i, 1);
          else {
            if (this.o.maxDates > 0 && list.length >= this.o.maxDates) return;
            list.push(d);
            list.sort(function(p, q) {
              return p - q;
            });
          }
          this.v = list;
          this._afterPick(false);
          return;
        }
        this._followActive();
        this._render();
        this._pos();
      };
      P._afterPick = function(maybeClose) {
        this._followActive();
        this._commit();
        this._render();
        if (maybeClose && this._closeOnSelect() && !this.inline) this.close(true);
        else this._pos();
      };
      P._pos = function() {
        if (this.isOpen) this._position();
      };
      P._followActive = function() {
        var a = this.active, n = this._nMonths();
        var idx = (a.getFullYear() - this.view.y) * 12 + (a.getMonth() - this.view.m);
        if (this.viewMode !== "days") return;
        if (idx < 0) this.view = { y: a.getFullYear(), m: a.getMonth() };
        else if (idx >= n) {
          var s = addMonths(mk(a.getFullYear(), a.getMonth(), 1), -(n - 1));
          this.view = { y: s.getFullYear(), m: s.getMonth() };
        }
      };
      P._blocked = function(d) {
        if (this._isDisN(dn(d))) return true;
        if (this.mode === "range" && this.pending && !this._pendingOk(d)) return true;
        if (this.mode === "multiple" && this.o.maxDates > 0 && this.v.length >= this.o.maxDates && !this._has(d)) return true;
        return false;
      };
      P._has = function(d) {
        var k = key(d);
        return this.v.some(function(x) {
          return key(x) === k;
        });
      };
      P._pickMonth = function(m) {
        this.view = { y: this.view.y, m };
        this.active = this._clampActive(mk(this.view.y, m, Math.min(this.active.getDate(), 28)));
        this.viewMode = "days";
        this._viewChanged();
        this._render();
        this._pos();
        this._focusCell();
      };
      P._pickYear = function(y) {
        this.view = { y, m: this.view.m };
        this.viewMode = "months";
        this._viewChanged();
        this._render();
        this._pos();
      };
      P._clampActive = function(d) {
        if (this.min && dn(d) < dn(this.min)) return this.min;
        if (this.max && dn(d) > dn(this.max)) return this.max;
        return d;
      };
      P._preset = function(i) {
        var p = this.o.presets[i];
        if (!p) return;
        var val = typeof p.value === "function" ? p.value() : p.value;
        var v = this._coerce(val);
        if (this.mode !== "multiple" ? !v : !v.length) return;
        this.v = v;
        this.pending = null;
        var a = this._anchorDate();
        this.active = a;
        this.view = { y: a.getFullYear(), m: a.getMonth() };
        this.viewMode = "days";
        this._commit();
        this._render();
        if (this._closeOnSelect() && !this.inline) this.close(true);
        else this._pos();
      };
      P._act = function(act) {
        switch (act) {
          case "prev":
            this._nav(-1);
            break;
          case "next":
            this._nav(1);
            break;
          case "vmonths":
            this.viewMode = "months";
            this._render();
            this._pos();
            break;
          case "vyears":
            this.viewMode = "years";
            this._render();
            this._pos();
            break;
          case "today":
            this._today();
            break;
          case "clear":
            this.clear(true);
            if (!this.inline) this.close(true);
            break;
          case "done":
            this.close(true);
            break;
        }
      };
      P._today = function() {
        var t = sod(/* @__PURE__ */ new Date());
        if (this._isDis(t)) {
          this._goto(this._clampActive(t));
          return;
        }
        if (this.mode === "single") this._pick(t);
        else {
          this._goto(t);
        }
      };
      P._goto = function(d) {
        this.active = d;
        this.view = { y: d.getFullYear(), m: d.getMonth() };
        this.viewMode = "days";
        this._viewChanged();
        this._render();
        this._pos();
        this._focusCell();
      };
      P._nav = function(dir) {
        var v = this.view;
        if (this.viewMode === "days") {
          var d = mk(v.y, v.m + dir, 1);
          this.view = { y: d.getFullYear(), m: d.getMonth() };
        } else if (this.viewMode === "months") {
          this.view = { y: v.y + dir, m: v.m };
        } else {
          this.view = { y: v.y + dir * 12, m: v.m };
        }
        this._viewChanged();
        this._render();
        this._pos();
      };
      P._viewChanged = function() {
        this._cb(this.o.onViewChange, { year: this.view.y, month: this.view.m, mode: this.viewMode }, this);
      };
      P._nMonths = function() {
        return this.viewMode === "days" && !this._sheet && this.o.months >= 2 ? 2 : 1;
      };
      P._render = function() {
        var cal = this.cal, n = this._nMonths();
        var fk = null, ae = document.activeElement;
        if (this.inline && ae && ae !== document.body && this.pop.contains(ae)) {
          ["data-act", "data-d", "data-m", "data-y"].some(function(a) {
            if (ae.hasAttribute && ae.hasAttribute(a)) {
              fk = [a, ae.getAttribute(a)];
              return true;
            }
            return false;
          });
        }
        cal.textContent = "";
        this.cells = [];
        this.cellMap = {};
        this.pop.classList.toggle("cdp-has-wk", !!this.o.weekNumbers);
        if (this.viewMode === "days") {
          for (var i = 0; i < n; i++) cal.appendChild(this._monthBlock(i, i === 0, i === n - 1));
        } else if (this.viewMode === "months") {
          cal.appendChild(this._monthsBlock());
        } else {
          cal.appendChild(this._yearsBlock());
        }
        this._paint();
        if (fk) {
          var t = this.pop.querySelector("[" + fk[0] + '="' + fk[1] + '"]');
          if (t && t.focus) t.focus({ preventScroll: true });
        }
      };
      P._navBar = function(first, last, titleNodes, labels, prevDis, nextDis) {
        var nav = h("div", "cdp-nav");
        if (first) {
          var p = h("button", "cdp-nav-btn", { type: "button", "data-act": "prev", "aria-label": labels[0] }, ICON.prev);
          p.disabled = !!prevDis;
          nav.appendChild(p);
        } else nav.appendChild(h("span", "cdp-nav-spacer"));
        var ttl = h("div", "cdp-nav-title", { "aria-live": "polite" });
        titleNodes.forEach(function(n) {
          ttl.appendChild(n);
        });
        nav.appendChild(ttl);
        if (last) {
          var nx = h("button", "cdp-nav-btn", { type: "button", "data-act": "next", "aria-label": labels[1] }, ICON.next);
          nx.disabled = !!nextDis;
          nav.appendChild(nx);
        } else nav.appendChild(h("span", "cdp-nav-spacer"));
        return nav;
      };
      P._monthBlock = function(i, first, last) {
        var self2 = this, o = this.o, N = names(this.loc), t = this.t;
        var base = mk(this.view.y, this.view.m + i, 1), month = base.getMonth();
        var blk = h("div", "cdp-month" + (o.weekNumbers ? " cdp-wk" : ""));
        var mBtn = h("button", "cdp-link", { type: "button", "data-act": "vmonths", "aria-label": t.chooseMonth });
        mBtn.textContent = N.months[month];
        var yBtn = h("button", "cdp-link", { type: "button", "data-act": "vyears", "aria-label": t.chooseYear });
        yBtn.textContent = base.getFullYear();
        var prevLast = addDays(base, -1), nextFirst = mk(this.view.y, this.view.m + this._nMonths(), 1);
        blk.appendChild(this._navBar(
          first,
          last,
          [mBtn, yBtn],
          [t.prevMonth, t.nextMonth],
          this.min && dn(prevLast) < dn(this.min),
          this.max && dn(nextFirst) > dn(this.max)
        ));
        var grid = h("div", "cdp-grid", { role: "grid", "aria-label": N.months[month] + " " + base.getFullYear() });
        var dow = h("div", "cdp-row", { role: "row" });
        if (o.weekNumbers) {
          var wh = h("span", "cdp-dow", { role: "columnheader" });
          wh.textContent = t.week;
          dow.appendChild(wh);
        }
        for (var k = 0; k < 7; k++) {
          var di = (this.ws + k) % 7;
          var dh = h("span", "cdp-dow", { role: "columnheader", "aria-label": N.days[di] });
          dh.textContent = N.daysShort[di];
          dow.appendChild(dh);
        }
        grid.appendChild(dow);
        var start2 = addDays(base, -((base.getDay() - this.ws + 7) % 7));
        var fmtLong = longFormatter(this.loc);
        var nM = this._nMonths();
        for (var r = 0; r < 6; r++) {
          var row = h("div", "cdp-row", { role: "row" });
          if (o.weekNumbers) {
            var thu = addDays(start2, r * 7 + (4 - this.ws + 7) % 7);
            var wn = h("span", "cdp-wnum", { "aria-hidden": "true" });
            wn.textContent = isoWeek(thu);
            row.appendChild(wn);
          }
          for (var c = 0; c < 7; c++) {
            var d = addDays(start2, r * 7 + c), main = d.getMonth() === month;
            var show = main || o.showOutsideDays && (nM === 1 || first && dn(d) < dn(base) || last && !first && dn(d) > dn(base));
            if (!show) {
              row.appendChild(h("span", "cdp-day-empty"));
              continue;
            }
            var kd = key(d);
            var b = h("button", "cdp-day cdp-c" + c, {
              type: "button",
              tabindex: "-1",
              role: "gridcell",
              "data-d": kd,
              id: this.id + (main ? "-d-" : "-o-") + kd + (main ? "" : "-" + i),
              "aria-label": fmtLong.format(d),
              "aria-selected": "false"
            });
            var num = h("span", "cdp-num");
            num.textContent = d.getDate();
            b.appendChild(num);
            row.appendChild(b);
            var cell = { el: b, d, n: dn(d), main, col: c, dis: this._isDisN(dn(d)) };
            this.cells.push(cell);
            if (main || !this.cellMap[kd]) this.cellMap[kd] = cell;
          }
          grid.appendChild(row);
        }
        blk.appendChild(grid);
        return blk;
      };
      P._monthsBlock = function() {
        var self2 = this, N = names(this.loc), t = this.t, y = this.view.y;
        var blk = h("div", "cdp-month");
        var yBtn = h("button", "cdp-link", { type: "button", "data-act": "vyears", "aria-label": t.chooseYear });
        yBtn.textContent = y;
        blk.appendChild(this._navBar(
          true,
          true,
          [yBtn],
          [t.prevYear, t.nextYear],
          this.min && y - 1 < this.min.getFullYear(),
          this.max && y + 1 > this.max.getFullYear()
        ));
        var g = h("div", "cdp-grid3", { role: "grid" });
        this.cells = [];
        for (var m = 0; m < 12; m++) {
          var first = mk(y, m, 1), last = mk(y, m + 1, 0);
          var dis = this.min && dn(last) < dn(this.min) || this.max && dn(first) > dn(this.max);
          var b = h("button", "cdp-cell", { type: "button", "data-m": m, role: "gridcell", tabindex: "-1", id: this.id + "-m-" + m });
          b.textContent = N.monthsShort[m];
          b.setAttribute("aria-label", N.months[m] + " " + y);
          b.disabled = !!dis;
          g.appendChild(b);
          this.cells.push({ el: b, kind: "m", i: m });
        }
        blk.appendChild(g);
        return blk;
      };
      P._yearsBlock = function() {
        var t = this.t, base = Math.floor(this.view.y / 12) * 12;
        var blk = h("div", "cdp-month");
        var lbl = h("span", "cdp-link", { "aria-live": "polite" });
        lbl.textContent = base + " \u2013 " + (base + 11);
        blk.appendChild(this._navBar(
          true,
          true,
          [lbl],
          [t.prevYears, t.nextYears],
          this.min && base - 1 < this.min.getFullYear(),
          this.max && base + 12 > this.max.getFullYear()
        ));
        var g = h("div", "cdp-grid3", { role: "grid" });
        this.cells = [];
        for (var i = 0; i < 12; i++) {
          var y = base + i;
          var dis = this.min && y < this.min.getFullYear() || this.max && y > this.max.getFullYear();
          var b = h("button", "cdp-cell", { type: "button", "data-y": y, role: "gridcell", tabindex: "-1", id: this.id + "-y-" + y });
          b.textContent = y;
          b.disabled = !!dis;
          g.appendChild(b);
          this.cells.push({ el: b, kind: "y", i: y });
        }
        blk.appendChild(g);
        return blk;
      };
      P._paint = function() {
        if (!this.isOpen && !this.inline) return;
        var self2 = this, today = dn(/* @__PURE__ */ new Date()), cur = this.v;
        var act = this.active ? dn(this.active) : null;
        if (this.viewMode !== "days") {
          var sel = this.mode === "single" ? cur : this.mode === "range" ? cur && cur[0] : cur && cur[0];
          var now = /* @__PURE__ */ new Date();
          this.cells.forEach(function(c) {
            var on = false, isNow = false, isAct = false;
            if (c.kind === "m") {
              on = !!sel && sel.getFullYear() === self2.view.y && sel.getMonth() === c.i;
              isNow = now.getFullYear() === self2.view.y && now.getMonth() === c.i;
              isAct = self2.active && self2.active.getFullYear() === self2.view.y && self2.active.getMonth() === c.i;
            } else {
              on = !!sel && sel.getFullYear() === c.i;
              isNow = now.getFullYear() === c.i;
              isAct = self2.active && self2.active.getFullYear() === c.i;
            }
            var cls = "cdp-cell" + (on ? " cdp-sel" : "") + (isNow ? " cdp-now" : "") + (isAct ? " cdp-act" : "");
            if (c.el._c !== cls) {
              c.el.className = cls;
              c.el._c = cls;
            }
            c.el.setAttribute("aria-selected", on ? "true" : "false");
          });
          this._syncFoot();
          this._aria();
          return;
        }
        var rs = null, re = null, preview = false, set = null;
        if (this.mode === "range") {
          if (this.pending) {
            rs = dn(this.pending);
            if (this.hover) {
              re = dn(this.hover);
              if (re < rs) {
                var tmp = rs;
                rs = re;
                re = tmp;
              }
            } else re = rs;
            preview = true;
          } else if (cur) {
            rs = dn(cur[0]);
            re = dn(cur[1]);
          }
        } else if (this.mode === "multiple") {
          set = {};
          cur.forEach(function(d) {
            set[dn(d)] = true;
          });
        }
        var pendingN = this.pending ? dn(this.pending) : null;
        this.cells.forEach(function(c) {
          var cls = "cdp-day cdp-c" + c.col, selected = false;
          if (!c.main) cls += " cdp-out";
          if (c.n === today) cls += " cdp-today";
          var dis = c.dis || pendingN !== null && c.n !== pendingN && !self2._pendingOk(c.d) || self2.mode === "multiple" && self2.o.maxDates > 0 && cur.length >= self2.o.maxDates && !set[c.n];
          if (dis) cls += " cdp-dis";
          if (self2.mode === "single") {
            selected = !!cur && c.n === dn(cur);
            if (selected) cls += " cdp-sel";
          } else if (self2.mode === "multiple") {
            selected = !!set[c.n];
            if (selected) cls += " cdp-sel";
          } else if (rs !== null) {
            var isS = c.n === rs, isE = c.n === re;
            if (isS) cls += " cdp-rs";
            if (isE) cls += " cdp-re";
            selected = isS || isE;
            if (c.n > rs && c.n < re) {
              cls += preview ? " cdp-pv" : " cdp-in";
              selected = true;
            }
          }
          if (act !== null && c.main && c.n === act) cls += " cdp-act";
          if (c.el._c !== cls) {
            c.el.className = cls;
            c.el._c = cls;
          }
          c.el.setAttribute("aria-selected", selected ? "true" : "false");
          if (dis) c.el.setAttribute("aria-disabled", "true");
          else c.el.removeAttribute("aria-disabled");
          if (c.main && c.n === today) c.el.setAttribute("aria-current", "date");
          else c.el.removeAttribute("aria-current");
          c.el.tabIndex = self2.inline && c.main && c.n === act ? 0 : -1;
        });
        this._syncFoot();
        this._aria();
      };
      P._syncFoot = function() {
        this.bDone.hidden = !(this._sheet || this.mode === "multiple");
      };
      P._aria = function() {
        if (this.inline || !this.isInput) return;
        var cell = this.active ? this.cellMap[key(this.active)] : null;
        var id = null;
        if (this.viewMode === "days") id = cell ? cell.el.id : null;
        else {
          var a = this.active;
          id = this.viewMode === "months" ? this.id + "-m-" + a.getMonth() : this.id + "-y-" + a.getFullYear();
        }
        if (id && document.getElementById(id)) this.el.setAttribute("aria-activedescendant", id);
        else this.el.removeAttribute("aria-activedescendant");
      };
      P._focusCell = function() {
        if (!this.inline) return;
        var el = this.viewMode === "days" ? (this.cellMap[key(this.active)] || {}).el : (this.cells.filter(function(c) {
          return c.el.classList.contains("cdp-act");
        })[0] || {}).el;
        if (el && el.focus) el.focus({ preventScroll: true });
      };
      P._key_ = function(e) {
        if (e.isComposing || this._dead) return;
        var k = e.key, self2 = this, inInput = this.isInput && e.target === this.el;
        var open = this.isOpen || this.inline;
        if (!open) {
          if (!inInput || this.el.disabled) return;
          if (k === "ArrowDown" || k === "Enter" && this.el.readOnly) {
            e.preventDefault();
            this.open();
          }
          return;
        }
        var typing = inInput && this._dirty && !this.el.readOnly;
        var rtl = getComputedStyle(this.themeEl).direction === "rtl";
        var step = null;
        switch (k) {
          case "Escape":
            if (this.viewMode !== "days") {
              this.viewMode = "days";
              this._render();
              this._pos();
            } else if (!this.inline) {
              this._dirty = false;
              this._syncInput();
              this.close(true);
            } else return;
            e.preventDefault();
            e.stopPropagation();
            return;
          case "Tab":
            if (!this.inline) this.close(true);
            return;
          case "Enter":
            if (typing) {
              e.preventDefault();
              this._commitText();
              this._reanchor();
              if (!this.inline && this._closeOnSelect()) this.close(true);
              else this._render();
              return;
            }
            e.preventDefault();
            this._activate();
            return;
          case " ":
            if (inInput && !this.el.readOnly) return;
            e.preventDefault();
            this._activate();
            return;
          case "ArrowLeft":
            if (typing) return;
            step = rtl ? 1 : -1;
            break;
          case "ArrowRight":
            if (typing) return;
            step = rtl ? -1 : 1;
            break;
          case "ArrowUp":
            step = -7;
            break;
          case "ArrowDown":
            step = 7;
            break;
          case "Home":
            if (typing) return;
            step = "home";
            break;
          case "End":
            if (typing) return;
            step = "end";
            break;
          case "PageUp":
            step = e.shiftKey ? "py" : "pm";
            this._sign = -1;
            break;
          case "PageDown":
            step = e.shiftKey ? "py" : "pm";
            this._sign = 1;
            break;
          default:
            return;
        }
        e.preventDefault();
        this.pop.classList.add("cdp-kb");
        this._move(step);
        void self2;
      };
      P._reanchor = function() {
        var a = this._anchorDate();
        this.active = a;
        this.view = { y: a.getFullYear(), m: a.getMonth() };
      };
      P._move = function(step) {
        var a = this.active, vm = this.viewMode, n;
        var sign = this._sign || 1;
        if (vm === "days") {
          if (typeof step === "number") n = addDays(a, step);
          else if (step === "home") n = addDays(a, -((a.getDay() - this.ws + 7) % 7));
          else if (step === "end") n = addDays(a, 6 - (a.getDay() - this.ws + 7) % 7);
          else if (step === "pm") n = addMonths(a, sign);
          else n = addYears(a, sign);
        } else if (vm === "months") {
          if (typeof step === "number") {
            var s = step === 7 ? 3 : step === -7 ? -3 : step;
            n = addMonths(a, s);
          } else if (step === "home") n = mk(a.getFullYear(), 0, 1);
          else if (step === "end") n = mk(a.getFullYear(), 11, 1);
          else n = addYears(a, sign);
        } else {
          if (typeof step === "number") {
            var s2 = step === 7 ? 3 : step === -7 ? -3 : step;
            n = addYears(a, s2);
          } else if (step === "home") n = addYears(a, -((a.getFullYear() % 12 + 12) % 12));
          else if (step === "end") n = addYears(a, 11 - (a.getFullYear() % 12 + 12) % 12);
          else n = addYears(a, sign * 12);
        }
        n = this._clampActive(n);
        this.active = n;
        var before = this.view.y * 12 + this.view.m, pageBefore = Math.floor(this.view.y / 12);
        if (vm === "days") this._followActive();
        else this.view = { y: n.getFullYear(), m: n.getMonth() };
        var after = this.view.y * 12 + this.view.m;
        if (after !== before) this._viewChanged();
        var moved = vm === "days" ? after !== before : vm === "months" ? Math.floor(after / 12) !== Math.floor(before / 12) : Math.floor(this.view.y / 12) !== pageBefore;
        if (moved) {
          this._render();
          this._pos();
        } else this._paint();
        this._focusCell();
      };
      P._activate = function() {
        var vm = this.viewMode, a = this.active;
        if (vm === "days") this._pick(a);
        else if (vm === "months") this._pickMonth(a.getMonth());
        else this._pickYear(a.getFullYear());
      };
      P._isSheet = function() {
        if (this.inline) return false;
        var s = this.o.sheet;
        if (s === true) return true;
        if (s === false || !window.matchMedia) return false;
        return window.matchMedia("(max-width:" + this.o.sheetBreakpoint + "px)").matches;
      };
      P._root = function() {
        var r = this.el.closest && this.el.closest('dialog,.modal,[aria-modal="true"],[data-cdp-root]');
        return r || document.body;
      };
      P._applyTheme = function() {
        var cs = getComputedStyle(this.themeEl), m = this.pop.style;
        var sheet = this._sheet;
        TOKENS.forEach(function(t) {
          var v = cs.getPropertyValue("--cdpi-" + t).trim();
          if (v && !(t === "cell" && sheet)) m.setProperty("--cdpi-" + t, v);
          else m.removeProperty("--cdpi-" + t);
        });
        m.fontFamily = cs.fontFamily;
        m.colorScheme = cs.colorScheme;
        var z = parseInt(cs.getPropertyValue("--cdpi-z"), 10) || 2e3;
        this.backdrop.style.zIndex = z - 1;
      };
      P._sheetTitle = function() {
        var l = this.el.labels && this.el.labels[0];
        this.title.textContent = l && l.textContent.trim() || this.el.getAttribute("aria-label") || this.el.getAttribute("placeholder") || this.pop.getAttribute("aria-label");
      };
      P._lock = function(on) {
        if (on === !!this._locked) return;
        this._locked = on;
        var de = document.documentElement, b = document.body;
        var st = de.__bs6Lock || (de.__bs6Lock = { n: 0, o: "", p: "" });
        if (on) {
          if (st.n++ > 0) return;
          st.o = de.style.overflow;
          st.p = b.style.paddingRight;
          var sw = window.innerWidth - de.clientWidth;
          de.style.overflow = "hidden";
          var gutter = getComputedStyle(de).scrollbarGutter || "";
          if (sw > 0 && gutter.indexOf("stable") < 0) b.style.paddingRight = (parseFloat(getComputedStyle(b).paddingRight) || 0) + sw + "px";
        } else if (st.n > 0 && --st.n === 0) {
          de.style.overflow = st.o;
          b.style.paddingRight = st.p;
        }
      };
      P._position = function() {
        if (this.inline) return;
        if (!this.el.isConnected) {
          this.close(false);
          return;
        }
        var pop = this.pop, st = pop.style;
        var sheet = this._isSheet();
        var changed = sheet !== this._sheet;
        this._sheet = sheet;
        pop.classList.toggle("cdp-sheet", sheet);
        if (changed) {
          this._applyTheme();
          this._render();
        }
        if (sheet) {
          if (!this.backdrop.parentNode && pop.parentNode) pop.parentNode.insertBefore(this.backdrop, pop);
          st.left = st.top = st.bottom = st.maxHeight = "";
          pop.classList.remove("cdp-up");
          this._lock(true);
          return;
        }
        this._lock(false);
        if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
        var r = this.el.getBoundingClientRect(), de = document.documentElement;
        var vw = de.clientWidth, vh = de.clientHeight, gap = 6, padv = 8;
        var below = vh - r.bottom - gap - padv, above = r.top - gap - padv;
        st.maxHeight = "";
        st.left = "0px";
        var natural = pop.offsetHeight, w = pop.offsetWidth;
        var up = natural > below && above > below;
        var avail = Math.max(200, up ? above : below);
        st.maxHeight = avail + "px";
        var rtl = getComputedStyle(this.el).direction === "rtl";
        var left = rtl ? r.right - w : r.left;
        left = Math.min(Math.max(padv, left), Math.max(padv, vw - w - padv));
        st.left = left + "px";
        if (up) {
          st.top = "auto";
          st.bottom = vh - r.top + gap + "px";
        } else {
          st.bottom = "auto";
          st.top = r.bottom + gap + "px";
        }
        pop.classList.toggle("cdp-up", up);
        var a = pop.getBoundingClientRect(), dx = left - a.left;
        if (Math.abs(dx) > 0.5) st.left = left + dx + "px";
        if (up) {
          var db = a.bottom - (r.top - gap);
          if (Math.abs(db) > 0.5) st.bottom = parseFloat(st.bottom) + db + "px";
        } else {
          var dt = r.bottom + gap - a.top;
          if (Math.abs(dt) > 0.5) st.top = parseFloat(st.top) + dt + "px";
        }
      };
      P.open = function() {
        if (this.inline || this.isOpen || this._dead || !this.el.isConnected) return this;
        if (this.el.disabled) return this;
        if (!this.el.getClientRects().length) return this;
        if (this.isInput && !this._dirty && this.el.value !== this._cur) {
          var ext = this._parseText(this.el.value);
          if (ext !== void 0) {
            this.v = ext;
            this._emitKey = this._key(ext);
          }
          this._syncInput();
        }
        this._dc = {};
        this._win = null;
        if (CustomDatePicker2._open && CustomDatePicker2._open !== this) CustomDatePicker2._open.close(false);
        CustomDatePicker2._open = this;
        this.isOpen = true;
        this._sheet = this._isSheet();
        this._applyTheme();
        this.pending = null;
        this.hover = null;
        this._startView();
        this._sheetTitle();
        this.pop.style.transform = "";
        this.backdrop.style.opacity = "";
        this._root().appendChild(this.pop);
        this._render();
        this.pop.classList.add("cdp-show");
        this._position();
        this.el.setAttribute("aria-expanded", "true");
        if (this._sheet) {
          this._prevMode = this.el.getAttribute("inputmode");
          this._imSet = true;
          this.el.setAttribute("inputmode", "none");
        }
        document.addEventListener("pointerdown", this._h.docPointer, true);
        window.addEventListener("resize", this._h.reposition);
        window.addEventListener("scroll", this._h.reposition, true);
        if (window.visualViewport) window.visualViewport.addEventListener("resize", this._h.reposition);
        if (!this._sheet && this.isInput && document.activeElement !== this.el) {
          try {
            this.el.focus({ preventScroll: true });
          } catch (e) {
          }
        }
        this._cb(this.o.onOpen, this);
        this._fire("open");
        return this;
      };
      P.close = function(refocus) {
        if (this.inline || !this.isOpen) return this;
        this.isOpen = false;
        if (CustomDatePicker2._open === this) CustomDatePicker2._open = null;
        this._commitText();
        this.pending = null;
        this.hover = null;
        this._lock(false);
        this.pop.classList.remove("cdp-show", "cdp-up", "cdp-kb");
        if (this.pop.parentNode) this.pop.parentNode.removeChild(this.pop);
        if (this.backdrop.parentNode) this.backdrop.parentNode.removeChild(this.backdrop);
        this.el.setAttribute("aria-expanded", "false");
        this.el.removeAttribute("aria-activedescendant");
        if (this._imSet) {
          this._imSet = false;
          if (this._prevMode == null) this.el.removeAttribute("inputmode");
          else this.el.setAttribute("inputmode", this._prevMode);
        }
        document.removeEventListener("pointerdown", this._h.docPointer, true);
        window.removeEventListener("resize", this._h.reposition);
        window.removeEventListener("scroll", this._h.reposition, true);
        if (window.visualViewport) window.visualViewport.removeEventListener("resize", this._h.reposition);
        if (this._raf) {
          cancelAnimationFrame(this._raf);
          this._raf = 0;
        }
        if (refocus) {
          this._refocusing = true;
          this.el.focus({ preventScroll: true });
          this._refocusing = false;
        }
        this._cb(this.o.onClose, this);
        this._fire("close");
        return this;
      };
      P.toggle = function() {
        return this.isOpen ? this.close(true) : this.open();
      };
      P.getValue = function() {
        var v = this.v;
        if (this.mode === "single") return v ? new Date(v.getTime()) : null;
        if (this.mode === "range") return v ? [new Date(v[0].getTime()), new Date(v[1].getTime())] : null;
        return v.map(function(d) {
          return new Date(d.getTime());
        });
      };
      P.getText = function() {
        return this._text(this.v);
      };
      P.setValue = function(value, emit) {
        if (this._dead) return this;
        var v = this._coerce(value);
        this.v = v === void 0 ? this.mode === "multiple" ? [] : null : v;
        this._dirty = false;
        this.pending = null;
        var a = this._anchorDate();
        this.active = a;
        this.view = { y: a.getFullYear(), m: a.getMonth() };
        if (emit) this._commit();
        else {
          this._syncInput();
          this._emitKey = this._key(this.v);
        }
        if (this.isOpen || this.inline) {
          this._render();
          this._pos();
        }
        return this;
      };
      P.clear = function(emit) {
        return this.setValue(this.mode === "multiple" ? [] : null, emit);
      };
      P.refresh = function() {
        if (this._dead) return this;
        this._dc = {};
        this._win = null;
        this._dirty = false;
        if (this.isInput) {
          var v = this._parseText(this.el.value);
          this.v = v === void 0 ? this.mode === "multiple" ? [] : null : v;
          this._emitKey = this._key(this.v);
          this._syncInput();
        }
        this._startView();
        if (this.isOpen || this.inline) {
          this._render();
          this._pos();
        }
        return this;
      };
      P.goTo = function(date) {
        var d = this._toDate(date);
        if (d) this._goto(this._clampActive(d));
        return this;
      };
      P.setOptions = function(opts) {
        extend(this.o, opts);
        var old = this._text(this.v);
        this._setup();
        this.alt = this.o.altInput ? typeof this.o.altInput === "string" ? document.querySelector(this.o.altInput) : this.o.altInput : this.alt;
        var v = this._coerce(this.v);
        this.v = v === void 0 ? this.mode === "multiple" ? [] : null : v;
        this.bToday.textContent = this.t.today;
        this.bClear.textContent = this.t.clear;
        this.bDone.textContent = this.t.done;
        this.closeBtn.setAttribute("aria-label", this.t.close);
        this.closeBtn.setAttribute("title", this.t.close);
        this.pop.setAttribute("aria-label", this.mode === "range" ? this.t.pickRange : this.mode === "multiple" ? this.t.pickDates : this.t.pickDate);
        this.bToday.hidden = !this.o.today;
        this.bClear.hidden = !this.o.clear;
        this.foot.hidden = !this.o.footer;
        if (opts && "presets" in opts) this._buildPresets();
        this._setPlaceholder();
        this._syncInput();
        void old;
        this._startView();
        if (this.isOpen || this.inline) {
          this._render();
          this._pos();
        }
        return this;
      };
      P.enable = function() {
        if (this.isInput) this.el.disabled = false;
        return this;
      };
      P.disable = function() {
        if (this.isInput) {
          this.close(false);
          this.el.disabled = true;
        }
        return this;
      };
      P.destroy = function() {
        if (this._dead) return;
        this.close(false);
        this._dead = true;
        var el = this.el, H = this._h;
        if (this._mo) this._mo.disconnect();
        if (this._raf) cancelAnimationFrame(this._raf);
        if (this.isInput) {
          el.removeEventListener("click", H.click);
          el.removeEventListener("focus", H.focus);
          el.removeEventListener("input", H.input);
          el.removeEventListener("change", H.change, true);
          el.removeEventListener("keydown", H.inKey);
          if (this._form) this._form.removeEventListener("reset", H.formReset);
          this._toggles.forEach(function(b) {
            b.removeEventListener("click", H.toggle);
          });
          var s = this._saved;
          [
            ["type", s.type],
            ["placeholder", s.placeholder],
            ["autocomplete", s.autocomplete],
            ["role", s.role],
            ["aria-haspopup", s.haspopup],
            ["aria-expanded", s.expanded],
            ["aria-controls", s.controls],
            ["inputmode", s.inputmode]
          ].forEach(function(p) {
            if (p[1] == null) el.removeAttribute(p[0]);
            else el.setAttribute(p[0], p[1]);
          });
          el.removeAttribute("aria-activedescendant");
          el.classList.remove("cdp-input");
          if (s.cls) s.cls.split(/\s+/).filter(Boolean).forEach(function(c) {
            el.classList.remove(c);
          });
        } else {
          if (this.pop.parentNode) this.pop.parentNode.removeChild(this.pop);
          el.classList.remove("cdp-root", "cdp-inline");
          if (this.o.className) this.o.className.split(/\s+/).filter(Boolean).forEach(function(c) {
            el.classList.remove(c);
          });
        }
        delete el._cdp;
      };
      CustomDatePicker2.defaults = extend({}, DEFAULTS);
      CustomDatePicker2.version = "1.0.0";
      CustomDatePicker2._open = null;
      CustomDatePicker2.format = function(date, fmt, locale) {
        return formatDate(date, fmt || "yyyy-MM-dd", locale || document.documentElement.lang || "tr");
      };
      CustomDatePicker2.parse = function(text, fmt, locale) {
        return parseDate(text, fmt || "yyyy-MM-dd", locale || document.documentElement.lang || "tr");
      };
      CustomDatePicker2.getInstance = function(el) {
        if (typeof el === "string") el = document.querySelector(el);
        return el && el._cdp || null;
      };
      CustomDatePicker2.init = function(target, options) {
        if (!hasDOM2) return [];
        var nodes;
        if (typeof target === "string") nodes = toArray2(document.querySelectorAll(target));
        else if (target && target.nodeType === 1) nodes = [target];
        else nodes = toArray2(target);
        var out = [];
        nodes.forEach(function(n) {
          try {
            out.push(new CustomDatePicker2(n, options));
          } catch (e) {
            if (typeof console !== "undefined" && console.warn) console.warn(e.message);
          }
        });
        return out;
      };
      CustomDatePicker2.autoInit = function(scope) {
        if (!hasDOM2) return [];
        var out = [];
        toArray2((scope || document).querySelectorAll("[data-datepicker]")).forEach(function(n) {
          if (n.getAttribute("data-datepicker") === "false") return;
          try {
            out.push(new CustomDatePicker2(n));
          } catch (e) {
            if (typeof console !== "undefined" && console.warn) console.warn(e.message);
          }
        });
        return out;
      };
      CustomDatePicker2.closeAll = function() {
        if (CustomDatePicker2._open) CustomDatePicker2._open.close(false);
      };
      return CustomDatePicker2;
    });
  }
});

// src/select-scrollbar.cjs
var require_select_scrollbar = __commonJS({
  "src/select-scrollbar.cjs"(exports2, module2) {
    (function(root2, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.CustomSelectScrollbar = factory();
      }
    })(typeof self !== "undefined" ? self : exports2, function() {
      "use strict";
      var hasDOM2 = typeof document !== "undefined";
      var DEFAULTS = {
        axis: "y",
        // menüde yatay kaydırma yok; ayrıca ayrık (DOM'da olmayan) eleman ölçülemez
        autoHide: false,
        // liste kaydırılabilir olduğunda çubuk hep görünsün
        shadows: true,
        // kenarlarda "devamı var" solması
        focusable: false,
        // odak zaten arama kutusunda / tetikleyicide; kaydırıcı Tab durağı olmasın
        thumbMin: 28
      };
      var BOOL_KEYS = ["shadows", "focusable", "clickScroll", "smooth"];
      var NUM_KEYS = ["autoHideDelay", "thumbMin"];
      var DATA_KEYS = ["autoHide", "autoHideDelay", "size", "shadows", "thumbMin", "clickScroll", "smooth", "className"];
      function toArray2(l) {
        return Array.prototype.slice.call(l || []);
      }
      function extend(t) {
        for (var i = 1; i < arguments.length; i++) {
          var s = arguments[i];
          if (!s) continue;
          for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k) && s[k] !== void 0) t[k] = s[k];
        }
        return t;
      }
      function readData(el) {
        var out = {};
        DATA_KEYS.forEach(function(key) {
          var raw = el.dataset ? el.dataset["csScrollbar" + key.charAt(0).toUpperCase() + key.slice(1)] : void 0;
          if (raw === void 0) return;
          if (key === "autoHide") out[key] = raw === "false" ? false : raw === "true" || raw === "" ? true : raw;
          else if (BOOL_KEYS.indexOf(key) > -1) out[key] = raw !== "false";
          else if (NUM_KEYS.indexOf(key) > -1) {
            var n = Number(raw);
            if (!isNaN(n)) out[key] = n;
          } else out[key] = raw;
        });
        return out;
      }
      var deps = {};
      function use(d) {
        extend(deps, d);
      }
      function libs() {
        var g = typeof window !== "undefined" ? window : root;
        var CS = deps.CustomSelect || g && g.CustomSelect, SB = deps.CustomScrollbar || g && g.CustomScrollbar;
        if (!CS) throw new ReferenceError("CustomSelectScrollbar: CustomSelect bulunamad\u0131.");
        if (!SB) throw new ReferenceError("CustomSelectScrollbar: CustomScrollbar bulunamad\u0131.");
        return { CustomSelect: CS, CustomScrollbar: SB };
      }
      function resolve(target, selectOptions) {
        var g = libs(), CS = g.CustomSelect;
        if (typeof target === "string") target = document.querySelector(target);
        if (target instanceof CS) return target;
        if (target && target.tagName === "SELECT") return CS.getInstance(target) || new CS(target, selectOptions);
        throw new TypeError("CustomSelectScrollbar: bir <select>, se\xE7ici ya da CustomSelect nesnesi gerekli.");
      }
      function attach(target, options) {
        var cs = resolve(target);
        if (cs.scrollbar) {
          if (options) cs.scrollbar.setOptions(options);
          return cs.scrollbar;
        }
        var SB = libs().CustomScrollbar;
        var list = cs.list, menu = cs.menu;
        var host = document.createElement("div");
        host.className = "cs-scroll";
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
        Object.defineProperty(list, "scrollTop", {
          configurable: true,
          get: function() {
            return vp.scrollTop;
          },
          set: function(v) {
            vp.scrollTop = v;
          }
        });
        cs._reveal = function(node) {
          var pad = sb.o.shadows ? 18 : 4;
          var lr = vp.getBoundingClientRect();
          var top = node;
          if (!node.previousElementSibling && node.parentNode && node.parentNode.classList.contains("cs-group")) {
            top = node.parentNode;
          }
          var tr = top.getBoundingClientRect(), nr = node.getBoundingClientRect();
          if (tr.top < lr.top + pad) vp.scrollTop -= lr.top + pad - tr.top;
          else if (nr.bottom > lr.bottom - pad) vp.scrollTop += nr.bottom - (lr.bottom - pad);
        };
        function onOpen() {
          sb.update(true);
        }
        cs.el.addEventListener("cs:open", onOpen);
        var origDestroy = cs.destroy;
        cs.destroy = function() {
          detach(cs);
          return origDestroy.apply(cs, arguments);
        };
        cs.scrollbar = sb;
        cs._csb = { host, onOpen };
        return sb;
      }
      function detach(target) {
        var cs = resolve(target);
        var state = cs._csb;
        if (!state) return cs;
        cs.el.removeEventListener("cs:open", state.onOpen);
        cs.scrollbar.destroy();
        delete cs.list.scrollTop;
        delete cs._reveal;
        delete cs.destroy;
        delete cs.scrollbar;
        delete cs._csb;
        cs.menu.insertBefore(cs.list, state.host);
        cs.menu.removeChild(state.host);
        return cs;
      }
      function init2(target, selectOptions, scrollbarOptions) {
        if (!hasDOM2) return [];
        var nodes;
        if (typeof target === "string") nodes = toArray2(document.querySelectorAll(target));
        else if (target && target.nodeType === 1) nodes = [target];
        else nodes = toArray2(target);
        var out = [];
        nodes.forEach(function(n) {
          if (!n || n.tagName !== "SELECT") return;
          var cs = resolve(n, selectOptions);
          attach(cs, scrollbarOptions);
          out.push(cs);
        });
        return out;
      }
      function autoInit(scope) {
        if (!hasDOM2) return [];
        var out = [];
        toArray2((scope || document).querySelectorAll("select[data-cs-scrollbar]")).forEach(function(s) {
          if (s.getAttribute("data-cs-scrollbar") === "false") return;
          try {
            out.push(attach(resolve(s)));
          } catch (e) {
            if (typeof console !== "undefined" && console.warn) console.warn(e.message);
          }
        });
        return out;
      }
      return {
        version: "1.0.0",
        defaults: DEFAULTS,
        use,
        attach,
        detach,
        init: init2,
        autoInit
      };
    });
  }
});

// src/bs6.cjs
var require_bs6 = __commonJS({
  "src/bs6.cjs"(exports2, module2) {
    (function(root2, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root2.Bootstrap6Compat = factory();
      }
    })(typeof self !== "undefined" ? self : exports2, function() {
      "use strict";
      var g = typeof window !== "undefined" ? window : null;
      var ADORN = ".form-adorn";
      var deps = {};
      var installed = false;
      function adornOf(node) {
        return node && node.closest ? node.closest(ADORN) : null;
      }
      function withAnchor(node, anchor, fn, args, self2) {
        node.getBoundingClientRect = function() {
          return anchor.getBoundingClientRect();
        };
        try {
          return fn.apply(self2, args);
        } finally {
          delete node.getBoundingClientRect;
        }
      }
      function patch() {
        var CS = deps.CustomSelect || g && g.CustomSelect, DP = deps.CustomDatePicker || g && g.CustomDatePicker;
        if (CS && CS.prototype && !CS.prototype._bs6) {
          CS.prototype._bs6 = true;
          var pos = CS.prototype._position;
          CS.prototype._position = function() {
            var a = adornOf(this.trigger);
            return a ? withAnchor(this.trigger, a, pos, arguments, this) : pos.apply(this, arguments);
          };
          var build = CS.prototype._build;
          CS.prototype._build = function() {
            build.apply(this, arguments);
            if (this.search) this.search.classList.add("form-control");
            if (!adornOf(this.el)) return;
            var ids = [];
            this._labels.forEach(function(l) {
              if (l.id && !l.classList.contains("form-adorn")) ids.push(l.id);
            });
            if (!ids.length && this.trigger.getAttribute("aria-label")) {
              this.trigger.removeAttribute("aria-labelledby");
              this.list.removeAttribute("aria-labelledby");
              this.list.setAttribute("aria-label", this.trigger.getAttribute("aria-label"));
            } else {
              this.trigger.setAttribute("aria-labelledby", ids.concat(this.valueBox.id).join(" "));
              this.list.setAttribute("aria-labelledby", ids.join(" ") || this.valueBox.id);
            }
          };
          var title = CS.prototype._sheetTitle;
          CS.prototype._sheetTitle = function() {
            if (!adornOf(this.el)) return title.apply(this, arguments);
            var l = this._labels.filter(function(x) {
              return !x.classList.contains("form-adorn");
            })[0];
            this.title.textContent = l && l.textContent.trim() || this.el.getAttribute("aria-label") || this._placeholder();
          };
        }
        if (DP && DP.prototype && !DP.prototype._bs6) {
          DP.prototype._bs6 = true;
          var dpos = DP.prototype._position;
          DP.prototype._position = function() {
            var a = !this.inline && this.el ? adornOf(this.el) : null;
            return a ? withAnchor(this.el, a, dpos, arguments, this) : dpos.apply(this, arguments);
          };
        }
      }
      function instanceIn(a) {
        var CS = deps.CustomSelect || g.CustomSelect, DP = deps.CustomDatePicker || g.CustomDatePicker;
        var sel = a.querySelector("select"), inp = a.querySelector("input");
        if (sel && CS && CS.getInstance(sel)) return CS.getInstance(sel);
        if (inp && DP && DP.getInstance && DP.getInstance(inp)) return DP.getInstance(inp);
        return null;
      }
      function bindClicks() {
        var wasOpen = false;
        document.addEventListener("pointerdown", function(e) {
          wasOpen = false;
          var a = adornOf(e.target);
          var inst = a && instanceIn(a);
          if (inst) wasOpen = !!inst.isOpen;
        }, true);
        document.addEventListener("click", function(e) {
          var a = adornOf(e.target);
          var inst = a && instanceIn(a);
          if (!inst || !inst.el) return;
          var t = e.target;
          if (t === inst.el || inst.trigger && inst.trigger.contains(t)) return;
          if (inst.el.disabled) return;
          var interactive = t.closest && t.closest('button, a[href], input, select, textarea, summary, [role="button"], [contenteditable="true"]');
          if (interactive && interactive !== inst.el && a.contains(interactive)) return;
          e.preventDefault();
          if (wasOpen) {
            wasOpen = false;
            return;
          }
          if (typeof inst.open === "function") inst.open();
        });
      }
      function install(d) {
        if (d) {
          for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) deps[k] = d[k];
        }
        if (!g || typeof document === "undefined") return;
        patch();
        if (!installed) {
          installed = true;
          bindClicks();
        }
      }
      return { version: "1.0.0", adornOf, patch, install };
    });
  }
});

// src/index.js
var index_exports = {};
__export(index_exports, {
  CustomDatePicker: () => import_datepicker.default,
  CustomScrollbar: () => import_scrollbar.default,
  CustomSelect: () => import_select.default,
  SelectScrollbar: () => import_select_scrollbar.default,
  config: () => config,
  datepicker: () => datepicker,
  destroy: () => destroy,
  getInstance: () => getInstance,
  init: () => init,
  observe: () => observe,
  scrollbar: () => scrollbar,
  select: () => select,
  version: () => version
});
module.exports = __toCommonJS(index_exports);
var import_scrollbar = __toESM(require_scrollbar(), 1);
var import_select = __toESM(require_select(), 1);
var import_datepicker = __toESM(require_datepicker(), 1);
var import_select_scrollbar = __toESM(require_select_scrollbar(), 1);
var import_bs6 = __toESM(require_bs6(), 1);
var version = true ? "1.0.0" : "dev";
var hasDOM = typeof document !== "undefined";
import_select_scrollbar.default.use({ CustomSelect: import_select.default, CustomScrollbar: import_scrollbar.default });
import_bs6.default.install({ CustomSelect: import_select.default, CustomDatePicker: import_datepicker.default });
function toArray(l) {
  return Array.prototype.slice.call(l || []);
}
function warn(err) {
  if (typeof console !== "undefined" && console.warn) console.warn("[bs6-custom-ui]", err && err.message ? err.message : err);
}
function nodesOf(target, root2) {
  if (!hasDOM || target == null) return [];
  if (typeof target === "string") return toArray((root2 || document).querySelectorAll(target));
  if (target.nodeType === 1) return [target];
  return toArray(target).filter(function(n) {
    return n && n.nodeType === 1;
  });
}
function each(nodes, fn) {
  var out = [];
  nodes.forEach(function(n) {
    try {
      var r = fn(n);
      if (r) out.push(r);
    } catch (e) {
      warn(e);
    }
  });
  return out;
}
function select(target, options, scrollbarOptions) {
  return each(nodesOf(target).filter(function(n) {
    return n.tagName === "SELECT";
  }), function(el) {
    var cs = import_select.default.getInstance(el) || new import_select.default(el, options);
    var off = scrollbarOptions === false || el.getAttribute("data-bs-scrollbar") === "false";
    if (!off && !cs.scrollbar) import_select_scrollbar.default.attach(cs, scrollbarOptions || void 0);
    return cs;
  });
}
function datepicker(target, options) {
  return each(nodesOf(target), function(el) {
    return new import_datepicker.default(el, options);
  });
}
function scrollbar(target, options) {
  return each(nodesOf(target), function(el) {
    return new import_scrollbar.default(el, options);
  });
}
function getInstance(target) {
  var el = nodesOf(target)[0];
  return el && (el._cs || el._cdp || el._ccs) || null;
}
function destroy(target) {
  var nodes = target == null ? toArray(document.querySelectorAll("select.cs-native, .cdp-input, .cdp-inline, .ccs-host")).concat([document.documentElement]) : nodesOf(target);
  nodes.forEach(function(el) {
    var inst = el._cs || el._cdp || el._ccs;
    if (inst && typeof inst.destroy === "function") {
      try {
        inst.destroy();
      } catch (e) {
        warn(e);
      }
    }
  });
}
function init(root2) {
  if (!hasDOM) return [];
  root2 = root2 || document;
  var found = [];
  if (root2.nodeType === 1 && root2.hasAttribute("data-bs-ui")) found.push(root2);
  if (root2.querySelectorAll) found = found.concat(toArray(root2.querySelectorAll("[data-bs-ui]")));
  return each(found, function(el) {
    var kind = (el.getAttribute("data-bs-ui") || "").trim().toLowerCase();
    if (kind === "false" || kind === "off") return null;
    if (!kind) kind = el.tagName === "SELECT" ? "select" : el.tagName === "INPUT" ? "datepicker" : "scrollbar";
    var existing = getInstance(el), inst;
    if (kind === "select") inst = select(el)[0];
    else if (kind === "datepicker" || kind === "date") inst = datepicker(el)[0];
    else if (kind === "scrollbar" || kind === "scroll") inst = scrollbar(el)[0];
    else throw new TypeError('data-bs-ui de\u011Feri tan\u0131nm\u0131yor: "' + kind + '"');
    if (inst && !existing) el._bs6Auto = true;
    return inst;
  });
}
var mo = null;
var POPUP = /(^|\s)(cs-menu|cs-backdrop|cdp-popup|cdp-backdrop|ccs-track)(\s|$)/;
var removedQueue = [];
var removedTimer = 0;
function flushRemoved() {
  removedTimer = 0;
  var nodes = removedQueue;
  removedQueue = [];
  nodes.forEach(function(n) {
    if (n.isConnected) return;
    var els = [n].concat(toArray(n.querySelectorAll("[data-bs-ui], select, input, .ccs-host, .cdp-inline")));
    els.forEach(function(el) {
      if (!el._bs6Auto || el.isConnected) return;
      var inst = el._cs || el._cdp || el._ccs;
      el._bs6Auto = false;
      if (inst && typeof inst.destroy === "function") {
        try {
          inst.destroy();
        } catch (e) {
          warn(e);
        }
      }
    });
  });
}
function scanAdded(records) {
  for (var i = 0; i < records.length; i++) {
    var gone = records[i].removedNodes;
    for (var k = 0; k < gone.length; k++) {
      var rn = gone[k];
      if (rn.nodeType !== 1 || typeof rn.className === "string" && POPUP.test(rn.className)) continue;
      removedQueue.push(rn);
      if (!removedTimer) removedTimer = setTimeout(flushRemoved, 0);
    }
    var added = records[i].addedNodes;
    for (var j = 0; j < added.length; j++) {
      var n = added[j];
      if (n.nodeType !== 1) continue;
      if (typeof n.className === "string" && POPUP.test(n.className)) continue;
      init(n);
    }
  }
}
function observe(on) {
  if (!hasDOM || typeof MutationObserver === "undefined") return;
  if (on === false) {
    if (mo) {
      mo.disconnect();
      mo = null;
    }
    return;
  }
  if (mo) return;
  mo = new MutationObserver(scanAdded);
  mo.observe(document.documentElement, { childList: true, subtree: true });
}
var settings = { auto: true, observe: true };
function config(options) {
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
  pre = typeof window !== "undefined" ? window.BS6UI_CONFIG : null;
  if (pre && typeof pre === "object") config(pre);
  if (document.documentElement.getAttribute("data-bs-ui-auto") === "false") settings.auto = false;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
var pre;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomDatePicker,
  CustomScrollbar,
  CustomSelect,
  SelectScrollbar,
  config,
  datepicker,
  destroy,
  getInstance,
  init,
  observe,
  scrollbar,
  select,
  version
});
