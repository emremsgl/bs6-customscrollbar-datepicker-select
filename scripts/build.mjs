// Derleme: src/ → dist/
//   JS : bs6-custom-ui.js / .min.js   (IIFE, global `BS6UI`, <script src> ile)
//        bs6-custom-ui.esm.js / .esm.min.js  (ES modülü)
//        bs6-custom-ui.cjs            (require / SSR güvenli içe aktarma)
//   CSS: bs6-custom-ui.css / .min.css  (tüm bileşenler + Bootstrap 6 uyumu, tek dosya)
import { build, transform } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dist = join(root, 'dist');
const src = (f) => join(root, 'src', f);

// Bootstrap 6'nın alt sınırı (Chrome/Edge 130, Firefox 132, Safari 18): kaynak dönüştürülmez, :has / color-mix korunur
const target = ['chrome130', 'firefox132', 'safari18'];

const repoUrl = (pkg.repository?.url ?? '').replace(/^git\+/, '').replace(/\.git$/, '');
const banner = `/*! ${pkg.name} v${pkg.version} | MIT License | ${repoUrl} */`;

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const common = {
  entryPoints: [src('index.js')],
  bundle: true,
  target,
  banner: { js: banner },
  legalComments: 'none',
  define: { __VERSION__: JSON.stringify(pkg.version) },
  logLevel: 'warning',
};

const jsBuilds = [
  { outfile: 'bs6-custom-ui.js', format: 'iife', globalName: 'BS6UI', minify: false },
  { outfile: 'bs6-custom-ui.min.js', format: 'iife', globalName: 'BS6UI', minify: true, sourcemap: true },
  { outfile: 'bs6-custom-ui.esm.js', format: 'esm', minify: false },
  { outfile: 'bs6-custom-ui.esm.min.js', format: 'esm', minify: true, sourcemap: true },
  { outfile: 'bs6-custom-ui.cjs', format: 'cjs', minify: false, platform: 'node' },
];

for (const b of jsBuilds) {
  const { outfile, ...opts } = b;
  await build({ ...common, ...opts, outfile: join(dist, outfile) });
}

// CSS: sıra önemlidir (sonraki dosya öncekini geçersiz kılar)
const cssOrder = ['scrollbar.css', 'select.css', 'datepicker.css', 'select-scrollbar.css', 'bs6.css'];
const css = cssOrder.map((f) => readFileSync(src(f), 'utf8').trim()).join('\n\n');
writeFileSync(join(dist, 'bs6-custom-ui.css'), `${banner}\n${css}\n`);
const min = await transform(css, { loader: 'css', minify: true, target, legalComments: 'none' });
writeFileSync(join(dist, 'bs6-custom-ui.min.css'), `${banner}\n${min.code}`);

// Boyut raporu
const rows = ['bs6-custom-ui.min.js', 'bs6-custom-ui.esm.min.js', 'bs6-custom-ui.min.css'].map((f) => {
  const buf = readFileSync(join(dist, f));
  return `${f.padEnd(28)} ${(statSync(join(dist, f)).size / 1024).toFixed(1).padStart(7)} KB   gzip ${(gzipSync(buf).length / 1024).toFixed(1).padStart(6)} KB`;
});
console.log(`\n${pkg.name} v${pkg.version}\n${rows.join('\n')}\n`);
