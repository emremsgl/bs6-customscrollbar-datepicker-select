// Testler için ortak jsdom ortamı: DOM global'lerini kurar ve derlenmiş paketi (dist ESM) içe aktarır.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function createEnv() {
  const dom = new JSDOM('<!doctype html><html lang="tr"><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });
  const win = dom.window;
  const doc = win.document;
  await new Promise((r) => (doc.readyState === 'complete' ? r() : win.addEventListener('load', r)));
  const keys = ['window', 'document', 'Node', 'Element', 'HTMLElement', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent',
    'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'DocumentFragment', 'navigator'];
  for (const k of keys) {
    Object.defineProperty(globalThis, k, {
      value: k === 'window' ? win : (typeof win[k] === 'function' && !/^[A-Z]/.test(k) ? win[k].bind(win) : win[k]),
      configurable: true,
      writable: true,
    });
  }
  const UI = await import(pathToFileURL(join(root, 'dist', 'bs6-custom-ui.esm.js')).href);
  return { UI, win, doc, root };
}
