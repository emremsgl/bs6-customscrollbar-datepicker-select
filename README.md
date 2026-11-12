# bs6-custom-ui

Custom **select**, **date picker** and **scrollbar** for **Bootstrap 6** — in one small package, with zero runtime dependencies.

[Türkçe](README.tr.md)

- One CSS file + one JS file (`~33 KB` + `~8 KB` gzipped). No jQuery, no Popper/Floating UI.
- Works with Bootstrap 6 `form-control`, `form-floating`, `form-adorn`, validation states, dark mode and the native `<dialog>`.
- Keeps the real `<select>` / `<input>` in place: forms, `FormData`, validation, labels and frameworks keep working.
- Accessible (combobox / listbox roles, full keyboard support), responsive (bottom sheet on small screens), RTL-aware.
- Multi-select shows chips on **one line** and collapses what does not fit into a `+3` badge.

> Bootstrap 6 is still in alpha (`6.0.0-alpha.1`). Token names may change until it is stable; this package maps its look to Bootstrap's `--bs-*` tokens and falls back to its own defaults if a token is missing.

## Quick start

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@6.0.0-alpha.1/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="dist/bs6-custom-ui.min.css">

<select class="form-control" data-bs-ui>…</select>
<input  class="form-control" data-bs-ui>                 <!-- date picker -->
<div style="max-height:200px;overflow:auto" data-bs-ui>…</div>   <!-- scrollbar -->

<script src="dist/bs6-custom-ui.min.js"></script>
```

That is all: elements with `data-bs-ui` are enhanced when the page loads, and also when they are added to the page later (AJAX, modals, framework renders).

`data-bs-ui` picks the component from the tag (`select` → select, `input` → date picker, anything else → scrollbar). You can be explicit: `data-bs-ui="select|datepicker|scrollbar"`, or skip an element with `data-bs-ui="false"`.

### npm / bundlers (ES modules)

Bootstrap 6 ships as ES modules only (no `window.bootstrap`). This package supports both styles:

```js
import { select, datepicker, scrollbar, init } from 'bs6-custom-ui';
import 'bs6-custom-ui/css';           // or 'bs6-custom-ui/css/min'

select('#city', { clearable: true });
datepicker('#birth', { mode: 'range' });
```

```html
<script type="module">
  import { select } from './dist/bs6-custom-ui.esm.min.js';
</script>
```

The classic `<script src>` build exposes one global, `BS6UI`.

## Options via `data-*`

| Component | Attribute pattern | Example |
|---|---|---|
| Select | `data-<option>` | `data-clearable="true"` `data-search="false"` `data-max-chips="3"` `data-placeholder="Pick"` |
| Select scrollbar | `data-cs-scrollbar-<option>` | `data-cs-scrollbar-auto-hide="scroll"`; `data-bs-scrollbar="false"` turns the custom scrollbar off |
| Date picker | `data-cdp-<option>` | `data-cdp-mode="range"` `data-cdp-format="yyyy-aa-gg"` `data-cdp-min="today"` |
| Scrollbar | `data-ccs-<option>` | `data-ccs-auto-hide="false"` `data-ccs-shadows="true"` |

See [`types/index.d.ts`](types/index.d.ts) for every option.

## JavaScript API

```js
const [cs] = BS6UI.select('#city', { max: 3 });   // returns CustomSelect[]
cs.setValue('izmir', true);                        // true → fire `change`
cs.getValue(); cs.clear(true); cs.open(); cs.destroy();

const [dp] = BS6UI.datepicker('#date', { min: 'today' });
dp.setValue('2026-07-14'); dp.getValue();          // Date | Date[] | null

BS6UI.scrollbar('#panel', { autoHide: 'hover' });

BS6UI.init(container);        // scan a subtree for [data-bs-ui]
BS6UI.getInstance('#city');   // component instance or null
BS6UI.destroy('#city');       // restore the original DOM (no argument: everything)
```

Events: native `change` / `input` on the original element, plus `cs:open`, `cs:close` (select) and `cdp:open`, `cdp:close`, `cdp:change` (date picker).

### Settings

```html
<html data-bs-ui-auto="false">                       <!-- no automatic start -->
<script>window.BS6UI_CONFIG = { observe: false };</script>   <!-- before the script -->
```

```js
BS6UI.config({ auto: true, observe: true });
BS6UI.observe(false);       // stop watching for newly added elements
```

## Localization

Built-in texts follow `<html lang>` (`en`, `tr`; anything else falls back to English). The date picker has the same two languages plus locale-aware formats and week start. For other languages pass the texts yourself:

```js
BS6UI.select('#s', { searchPlaceholder: 'Rechercher…', noResults: 'Aucun résultat', placeholder: 'Choisir' });
BS6UI.datepicker('#d', { locale: 'fr-FR', texts: { today: "Aujourd'hui", clear: 'Effacer', done: 'OK' } });
```

## Good to know

- **Changing a value from code.** `el.value = 'x'` fires no event. The select picks it up the next time it opens; call `instance.update()` if you need the closed state to refresh immediately. Adding/removing `<option>`s, toggling `disabled`, `is-invalid` etc. are detected automatically.
- **Removed elements.** Components started through `data-bs-ui` are destroyed automatically when their element leaves the page, and started again if it comes back. Components you created yourself with `select()` / `new CustomSelect()` are never touched — call `destroy()` when you are done with them.
- **Cloned markup.** Cloning an already-enhanced container (e.g. an "add row" button) is safe; the stale copies are cleaned up when the clone is initialised.
- **Errors are isolated.** A failing element (or a throwing `iconRenderer`) is logged with `console.warn`, rolled back to the plain native control, and does not stop the rest of the page.

## Bootstrap 6 specifics

```html
<!-- form-floating: the label stays up; selects and date inputs always show their value/format -->
<div class="form-floating">
  <label for="c">City</label>
  <select id="c" class="form-control" data-bs-ui>…</select>
</div>

<!-- form-adorn: put the control inside the adorn <label>; the menu aligns to the whole box -->
<label class="form-control form-adorn">
  <span class="form-adorn-icon" aria-hidden="true">…</span>
  <select id="c" class="form-ghost" data-bs-ui>…</select>
</label>
```

Also handled: `is-valid` / `is-invalid` (+ `data-bs-validate`), `form-control-sm/-lg`, `data-bs-theme="dark"`, menus inside native `<dialog>` (rendered in the dialog so they stay on top), and `scrollbar-gutter: stable` while a dialog is open.

## Customizing

All colors, radii and sizes come from Bootstrap tokens. To override, set the plugin variables anywhere:

```css
:root {
  --cs-accent: #0d9488;   /* select */
  --cdp-accent: #0d9488;  /* date picker */
  --ccs-accent: #0d9488;  /* scrollbar */
}
```

## Development

```bash
npm install
npm run build     # src/ → dist/
npm test          # jsdom smoke tests against dist/
npm run serve     # http://localhost:5190/examples/
```

Browser support follows Bootstrap 6: Chrome/Edge 130, Firefox 132, Safari 18.

## License

MIT — see [LICENSE](LICENSE).
