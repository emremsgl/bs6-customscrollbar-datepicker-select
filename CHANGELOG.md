# Changelog

## 1.0.0

İlk sürüm.

- Tek paket: `CustomSelect` + `CustomDatePicker` + `CustomScrollbar`, tek CSS ve tek JS.
- `data-bs-ui` ile otomatik başlatma; sonradan eklenen elemanlar için `MutationObserver`.
- Birleşik API: `select`, `datepicker`, `scrollbar`, `init`, `getInstance`, `destroy`, `observe`, `config`.
- Bootstrap 6 uyumu: `form-control`, `form-floating`, `form-adorn`, `is-valid` / `is-invalid`, koyu tema, native `<dialog>`.
- Select: arama, çoklu seçim, gruplar, tek satır etiket + `+N` rozeti, alttan açılan sayfa, menüde özel kaydırma çubuğu.
- Derleme çıktıları: IIFE (`BS6UI`), ESM, CJS; CSS tek dosya; TypeScript tip tanımları.
- Dil desteği: select metinleri `<html lang>` ile `en` / `tr`; bilinmeyen dil İngilizceye düşer.
- Kararlılık: ortak sayaçlı sayfa kaydırma kilidi (iç içe select + takvim), `data-bs-ui` ile başlatılanların DOM'dan çıkınca otomatik sökümü,
  kurucu hatasında geri alma, `cloneNode` kopyası temizliği, `class`/`aria-invalid` değişiminde listeyi yeniden kurmama,
  menü genişliğinin pencereyi aşmaması, takvimde açılış odağı, adorn içi etkileşimli öğelerin korunması.
