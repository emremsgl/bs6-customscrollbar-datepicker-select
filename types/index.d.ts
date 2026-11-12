// bs6-custom-ui — TypeScript tip tanımları

export const version: string;

/* ------------------------------------------------------------------ */
/* Ortak                                                               */
/* ------------------------------------------------------------------ */
export type Target = string | Element | ArrayLike<Element>;

/* ------------------------------------------------------------------ */
/* CustomSelect                                                        */
/* ------------------------------------------------------------------ */
export interface CustomSelectOptions {
  /** null: boş değerli ilk <option> metni ya da "Seçim yapın" */
  placeholder?: string | null;
  /** null: <html lang>; yoksa 'en'. Hazır diller: 'en', 'tr'. Diğer diller için metin seçeneklerini verin */
  locale?: string | null;
  /** true | false | 'auto' (seçenek sayısı >= searchThreshold) */
  search?: boolean | 'auto';
  searchThreshold?: number;
  searchPlaceholder?: string;
  noResults?: string;
  selectAllText?: string;
  clearAllText?: string;
  doneText?: string;
  clearTitle?: string;
  closeTitle?: string;
  removeTitle?: string;
  /** Seçimi tek tıkla temizleyen ✕ düğmesi */
  clearable?: boolean;
  /** Tetikleyici en geniş seçeneğe göre boyutlanır */
  autoWidth?: boolean;
  iconRenderer?: ((option: HTMLOptionElement) => string | Node | null | undefined) | null;
  /** Çoklu seçimde etiketler tek satırda kalır, sığmayanlar "+N" rozetine dönüşür (varsayılan: true) */
  fitChips?: boolean;
  /** Çoklu seçimde en fazla kaç etiket gösterilsin (0: hepsi) */
  maxChips?: number;
  /** Çoklu seçimde en fazla seçim sayısı (0: sınırsız) */
  max?: number;
  /** Menü en yüksekliği (px) */
  maxHeight?: number;
  /** true | false | 'auto': dar ekranda alttan açılan sayfa */
  sheet?: boolean | 'auto';
  sheetBreakpoint?: number;
  /** null: tek seçimde true, çoklu seçimde false */
  closeOnSelect?: boolean | null;
  size?: 'sm' | 'lg' | null;
  className?: string;
  menuClass?: string;
  onChange?: ((value: string | string[], instance: CustomSelect) => void) | null;
  onOpen?: ((instance: CustomSelect) => void) | null;
  onClose?: ((instance: CustomSelect) => void) | null;
  onMax?: ((max: number, instance: CustomSelect) => void) | null;
}

export declare class CustomSelect {
  constructor(el: string | HTMLSelectElement, options?: CustomSelectOptions);
  static defaults: CustomSelectOptions;
  static getInstance(el: string | Element): CustomSelect | null;
  static init(target: Target, options?: CustomSelectOptions): CustomSelect[];
  static closeAll(): void;

  readonly el: HTMLSelectElement;
  readonly wrapper: HTMLElement;
  readonly trigger: HTMLElement;
  readonly menu: HTMLElement;
  readonly isOpen: boolean;
  readonly multiple: boolean;
  /** SelectScrollbar köprüsüyle bağlıysa menü kaydırma çubuğu */
  scrollbar?: CustomScrollbar;

  open(): this;
  close(refocus?: boolean): this;
  toggle(): this;
  getValue(): string | string[];
  /** emit=true: change olayı tetiklenir */
  setValue(value: string | string[] | null, emit?: boolean): this;
  clear(emit?: boolean): this;
  selectAll(): this;
  enable(): this;
  disable(): this;
  focus(): this;
  /** <option> / <select> dışarıdan değiştirildiyse elle yenilemek için (genelde otomatiktir) */
  refresh(): this;
  update(): this;
  destroy(): void;
}

/* ------------------------------------------------------------------ */
/* CustomDatePicker                                                    */
/* ------------------------------------------------------------------ */
export type DateLike = Date | string;

export interface CustomDatePickerOptions {
  mode?: 'single' | 'range' | 'multiple';
  /** null: hedef <input> değilse true */
  inline?: boolean | null;
  value?: DateLike | DateLike[] | null;
  /** Örn. 'dd.MM.yyyy' ya da 'gg.aa.yyyy' (null: dile göre) */
  format?: string | null;
  /** null: <html lang> ya da 'tr' */
  locale?: string | null;
  /** 0 = Pazar … 6 */
  weekStart?: number | null;
  /** Geniş ekranda yan yana ay sayısı */
  months?: 1 | 2;
  min?: DateLike | 'today' | null;
  max?: DateLike | 'today' | null;
  disabledDates?: Array<DateLike | [DateLike, DateLike]> | null;
  /** Haftanın günleri: [0, 6] (0 = Pazar) */
  disabledDays?: number[] | null;
  disable?: ((date: Date) => boolean) | null;
  minDays?: number;
  maxDays?: number;
  maxDates?: number;
  allowDisabledInRange?: boolean;
  weekNumbers?: boolean;
  showOutsideDays?: boolean;
  footer?: boolean;
  today?: boolean;
  clear?: boolean;
  closeOnSelect?: boolean | null;
  openOn?: 'click' | 'focus';
  sheet?: boolean | 'auto';
  sheetBreakpoint?: number;
  presets?: Array<{ label: string; value: Date | [Date, Date] | (() => Date | [Date, Date]) }> | null;
  /** ISO değerin yazılacağı gizli girdi */
  altInput?: string | HTMLInputElement | null;
  /** Açma/kapama düğmesi */
  toggle?: string | Element | null;
  separator?: string;
  placeholder?: string | null;
  className?: string;
  popupClass?: string;
  texts?: Record<string, string> | null;
  onChange?: ((value: Date | Date[] | null, instance: CustomDatePicker) => void) | null;
  onOpen?: ((instance: CustomDatePicker) => void) | null;
  onClose?: ((instance: CustomDatePicker) => void) | null;
  onViewChange?: ((view: unknown, instance: CustomDatePicker) => void) | null;
}

export declare class CustomDatePicker {
  constructor(target: string | HTMLElement, options?: CustomDatePickerOptions);
  static defaults: CustomDatePickerOptions;
  static getInstance(el: string | Element): CustomDatePicker | null;
  static init(target: Target, options?: CustomDatePickerOptions): CustomDatePicker[];
  static closeAll(): void;

  readonly el: HTMLElement;
  readonly pop: HTMLElement;
  readonly isOpen: boolean;

  open(): this;
  close(refocus?: boolean): this;
  toggle(): this;
  getValue(): Date | Date[] | [Date, Date] | null;
  setValue(value: DateLike | DateLike[] | null, emit?: boolean): this;
  clear(emit?: boolean): this;
  goTo(date: DateLike): this;
  setOptions(options: CustomDatePickerOptions): this;
  refresh(): this;
  enable(): this;
  disable(): this;
  destroy(): void;
}

/* ------------------------------------------------------------------ */
/* CustomScrollbar                                                     */
/* ------------------------------------------------------------------ */
export interface CustomScrollbarInfo {
  top: number;
  left: number;
  maxTop: number;
  maxLeft: number;
  progressY: number;
  progressX: number;
  atTop: boolean;
  atBottom: boolean;
  scrollable: boolean;
}

export interface CustomScrollbarOptions {
  /** null: elemanın CSS overflow değerinden */
  axis?: 'y' | 'x' | 'xy' | 'both' | null;
  /** true | 'scroll' | 'hover' | false (her zaman görünür) */
  autoHide?: boolean | 'scroll' | 'hover';
  autoHideDelay?: number;
  size?: 'sm' | 'lg' | null;
  shadows?: boolean;
  gutter?: boolean;
  focusable?: boolean;
  clickScroll?: boolean;
  smooth?: boolean;
  thumbMin?: number;
  className?: string;
  onScroll?: ((info: CustomScrollbarInfo, instance: CustomScrollbar) => void) | null;
  onUpdate?: ((info: CustomScrollbarInfo, instance: CustomScrollbar) => void) | null;
}

export declare class CustomScrollbar {
  constructor(target: string | Element | 'page', options?: CustomScrollbarOptions);
  static defaults: CustomScrollbarOptions;
  static getInstance(el: string | Element): CustomScrollbar | null;
  static init(target: Target, options?: CustomScrollbarOptions): CustomScrollbar[];
  static page(options?: CustomScrollbarOptions): CustomScrollbar | null;

  /** Kaydırılan iç görünüm alanı */
  readonly vp: HTMLElement;
  /** Dinamik içeriği buraya ekleyin */
  readonly content: HTMLElement | null;

  update(relayout?: boolean): this;
  getInfo(): CustomScrollbarInfo;
  scrollTo(opts: ScrollToOptions): this;
  scrollTo(x: number, y: number): this;
  scrollBy(opts: ScrollToOptions): this;
  scrollBy(x: number, y: number): this;
  scrollToTop(behavior?: ScrollBehavior): this;
  scrollToBottom(behavior?: ScrollBehavior): this;
  scrollToElement(target: string | Element, opts?: { block?: 'start' | 'center' | 'nearest'; offset?: number; behavior?: ScrollBehavior }): this;
  show(): this;
  hide(): this;
  setOptions(options: CustomScrollbarOptions): this;
  destroy(): void;
}

/* ------------------------------------------------------------------ */
/* Select + çubuk köprüsü                                              */
/* ------------------------------------------------------------------ */
export declare const SelectScrollbar: {
  version: string;
  defaults: CustomScrollbarOptions;
  attach(target: string | HTMLSelectElement | CustomSelect, options?: CustomScrollbarOptions): CustomScrollbar;
  detach(target: string | HTMLSelectElement | CustomSelect): CustomSelect;
  init(target: Target, selectOptions?: CustomSelectOptions | null, scrollbarOptions?: CustomScrollbarOptions): CustomSelect[];
  use(deps: { CustomSelect?: typeof CustomSelect; CustomScrollbar?: typeof CustomScrollbar }): void;
};

/* ------------------------------------------------------------------ */
/* Birleşik API                                                        */
/* ------------------------------------------------------------------ */
/** <select> başlatır; menüde özel çubuk varsayılan olarak açıktır (scrollbarOptions=false: yerel çubuk). */
export function select(target: Target, options?: CustomSelectOptions | null, scrollbarOptions?: CustomScrollbarOptions | false): CustomSelect[];
/** <input> (açılır takvim) ya da <div> (satır içi takvim) başlatır. */
export function datepicker(target: Target, options?: CustomDatePickerOptions): CustomDatePicker[];
/** Kaydırılabilir bir elemana özel çubuk ekler. */
export function scrollbar(target: Target, options?: CustomScrollbarOptions): CustomScrollbar[];
/** Elemandaki bileşen örneği; yoksa null. */
export function getInstance(target: Target): CustomSelect | CustomDatePicker | CustomScrollbar | null;
/** Bileşeni kaldırır, DOM'u eski haline getirir. Argümansız: sayfadaki tümü. */
export function destroy(target?: Target): void;
/** [data-bs-ui] elemanlarını başlatır (varsayılan: tüm belge). */
export function init(root?: Element | Document): Array<CustomSelect | CustomDatePicker | CustomScrollbar>;
/** Sonradan eklenen [data-bs-ui] elemanlarını otomatik başlatmayı açar / kapatır. */
export function observe(on?: boolean): void;
/** Genel ayarlar. */
export function config(options?: { auto?: boolean; observe?: boolean }): { auto: boolean; observe: boolean };

declare global {
  interface Window {
    /** Paket yüklenmeden önce verilirse başlangıç ayarlarını belirler */
    BS6UI_CONFIG?: { auto?: boolean; observe?: boolean };
  }
}
