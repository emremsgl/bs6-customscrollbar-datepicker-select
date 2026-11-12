# bs6-custom-ui

**Bootstrap 6** için özel **select**, **tarih seçici** ve **kaydırma çubuğu**: tek küçük pakette, çalışma zamanı bağımlılığı olmadan.

[English](README.md)

- Tek CSS + tek JS dosyası (gzip ile yaklaşık `33 KB` + `8 KB`). jQuery, Popper veya Floating UI gerekmez.
- Bootstrap 6 `form-control`, `form-floating`, `form-adorn`, doğrulama durumları, koyu tema ve native `<dialog>` ile uyumlu.
- Gerçek `<select>` / `<input>` yerinde kalır: formlar, `FormData`, doğrulama, etiketler ve framework'ler bozulmaz.
- Erişilebilir (combobox / listbox rolleri, tam klavye desteği), duyarlı (dar ekranda alttan açılan sayfa), RTL uyumlu.
- Çoklu seçimde etiketler **tek satırda** durur; sığmayanlar `+3` gibi bir rozete dönüşür.

> Bootstrap 6 henüz alpha (`6.0.0-alpha.1`). Kararlı sürüme kadar token adları değişebilir; bu paket görünümü Bootstrap'in `--bs-*` token'larına bağlar, bir token yoksa kendi varsayılanına döner.

## Hızlı başlangıç

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@6.0.0-alpha.1/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="dist/bs6-custom-ui.min.css">

<select class="form-control" data-bs-ui>…</select>
<input  class="form-control" data-bs-ui>                 <!-- tarih seçici -->
<div style="max-height:200px;overflow:auto" data-bs-ui>…</div>   <!-- kaydırma çubuğu -->

<script src="dist/bs6-custom-ui.min.js"></script>
```

Hepsi bu: `data-bs-ui` taşıyan elemanlar sayfa yüklenince, ayrıca sonradan eklenirlerse (AJAX, modal, framework çıktısı) kendiliğinden başlar.

Bileşen etikete göre seçilir (`select` → select, `input` → tarih seçici, diğerleri → kaydırma çubuğu). Açıkça belirtmek için `data-bs-ui="select|datepicker|scrollbar"`, atlamak için `data-bs-ui="false"`.

### npm / paketleyiciler (ES modülleri)

Bootstrap 6 yalnızca ES modülü olarak gelir (`window.bootstrap` yok). Paket iki biçimi de destekler:

```js
import { select, datepicker, scrollbar, init } from 'bs6-custom-ui';
import 'bs6-custom-ui/css';           // ya da 'bs6-custom-ui/css/min'

select('#sehir', { clearable: true });
datepicker('#dogum', { mode: 'range' });
```

Klasik `<script src>` sürümü tek bir global tanımlar: `BS6UI`.

## `data-*` ile seçenekler

| Bileşen | Öznitelik deseni | Örnek |
|---|---|---|
| Select | `data-<seçenek>` | `data-clearable="true"` `data-search="false"` `data-max-chips="3"` `data-placeholder="Seçin"` |
| Select çubuğu | `data-cs-scrollbar-<seçenek>` | `data-cs-scrollbar-auto-hide="scroll"`; özel çubuğu kapatmak için `data-bs-scrollbar="false"` |
| Tarih seçici | `data-cdp-<seçenek>` | `data-cdp-mode="range"` `data-cdp-format="yyyy-aa-gg"` `data-cdp-min="today"` |
| Kaydırma çubuğu | `data-ccs-<seçenek>` | `data-ccs-auto-hide="false"` `data-ccs-shadows="true"` |

Tüm seçenekler için [`types/index.d.ts`](types/index.d.ts) dosyasına bakın.

## JavaScript API

```js
const [cs] = BS6UI.select('#sehir', { max: 3 });   // CustomSelect[] döner
cs.setValue('izmir', true);                         // true → `change` olayı tetikle
cs.getValue(); cs.clear(true); cs.open(); cs.destroy();

const [dp] = BS6UI.datepicker('#tarih', { min: 'today' });
dp.setValue('2026-07-14'); dp.getValue();           // Date | Date[] | null

BS6UI.scrollbar('#panel', { autoHide: 'hover' });

BS6UI.init(kapsayici);         // alt ağacı [data-bs-ui] için tara
BS6UI.getInstance('#sehir');   // bileşen örneği ya da null
BS6UI.destroy('#sehir');       // özgün DOM'u geri getir (argümansız: hepsi)
```

Olaylar: özgün elemanda `change` / `input`, ayrıca `cs:open`, `cs:close` (select) ve `cdp:open`, `cdp:close`, `cdp:change` (tarih seçici).

### Ayarlar

```html
<html data-bs-ui-auto="false">                               <!-- otomatik başlatma yok -->
<script>window.BS6UI_CONFIG = { observe: false };</script>   <!-- paketten önce -->
```

```js
BS6UI.config({ auto: true, observe: true });
BS6UI.observe(false);       // sonradan eklenen elemanları izlemeyi durdur
```

## Yerelleştirme

Hazır metinler `<html lang>`'e uyar (`en`, `tr`; diğer diller İngilizceye düşer). Tarih seçicide de aynı iki dil, ayrıca dile uygun biçim ve hafta başlangıcı vardır. Başka diller için metinleri kendiniz verin:

```js
BS6UI.select('#s', { searchPlaceholder: 'Rechercher…', noResults: 'Aucun résultat', placeholder: 'Choisir' });
BS6UI.datepicker('#d', { locale: 'fr-FR', texts: { today: "Aujourd'hui", clear: 'Effacer', done: 'OK' } });
```

## Bilmeniz gerekenler

- **Değeri koddan değiştirmek.** `el.value = 'x'` olay üretmez. Select bunu bir sonraki açılışta yakalar; kapalıyken hemen yenilemek istiyorsanız `instance.update()` çağırın. `<option>` ekleme/silme, `disabled`, `is-invalid` gibi değişimler kendiliğinden algılanır.
- **Çıkarılan elemanlar.** `data-bs-ui` ile başlatılan bileşenler, elemanı sayfadan çıkınca otomatik sökülür; geri gelirse yeniden başlatılır. `select()` / `new CustomSelect()` ile kendiniz oluşturduklarınıza dokunulmaz; işiniz bitince `destroy()` çağırın.
- **Kopyalanan işaretleme.** Başlatılmış bir kapsayıcıyı kopyalamak (örn. "satır ekle" düğmesi) güvenlidir; kopyadaki eski parçalar başlatma sırasında temizlenir.
- **Hatalar yalıtılır.** Hata veren bir eleman (ya da hata fırlatan `iconRenderer`) `console.warn` ile bildirilir, yalın yerel kontrole geri alınır ve sayfanın geri kalanını durdurmaz.

## Bootstrap 6'ya özgü kullanım

```html
<!-- form-floating: etiket yukarıda kalır; select ve tarih alanları değer/biçimi hep gösterir -->
<div class="form-floating">
  <label for="c">Şehir</label>
  <select id="c" class="form-control" data-bs-ui>…</select>
</div>

<!-- form-adorn: kontrolü adorn <label>'ı içine koyun; menü tüm kutuya hizalanır -->
<label class="form-control form-adorn">
  <span class="form-adorn-icon" aria-hidden="true">…</span>
  <select id="c" class="form-ghost" data-bs-ui>…</select>
</label>
```

Ayrıca: `is-valid` / `is-invalid` (+ `data-bs-validate`), `form-control-sm/-lg`, `data-bs-theme="dark"`, native `<dialog>` içindeki menüler (dialog'un içine çizilir, üstte kalır) ve dialog açıkken `scrollbar-gutter: stable` desteklenir.

## Özelleştirme

Renk, yarıçap ve boyutlar Bootstrap token'larından gelir. Değiştirmek için eklenti değişkenlerini istediğiniz yerde tanımlayın:

```css
:root {
  --cs-accent: #0d9488;   /* select */
  --cdp-accent: #0d9488;  /* tarih seçici */
  --ccs-accent: #0d9488;  /* kaydırma çubuğu */
}
```

## Geliştirme

```bash
npm install
npm run build     # src/ → dist/
npm test          # dist/ üzerinde jsdom duman testleri
npm run serve     # http://localhost:5190/examples/
```

Tarayıcı desteği Bootstrap 6 ile aynıdır: Chrome/Edge 130, Firefox 132, Safari 18.

## Lisans

MIT — bkz. [LICENSE](LICENSE).
