/**
 * Renders the app icon straight from the vendored thinking-orbs engine, so the
 * launcher icon is literally the same geometry the app animates.
 *
 *   bun run scripts/make-icon.ts
 *
 * Writes:
 *   assets/images/icon.png                     1024  (iOS / app icon)
 *   assets/images/splash-icon.png               512  (splash)
 *   assets/images/favicon.png                    48
 *   assets/images/android-icon-foreground.png  1024  (safe-zone inset)
 *   assets/images/android-icon-background.png  1024  (flat)
 *   assets/images/android-icon-monochrome.png  1024  (white on transparent)
 */
import { MODE_FRAMES, resolvePreset } from '../src/modules/thinking-orbs/engine';

const STATE = 'searching' as const; // dotted globe — reads best as a mark
const T = 1.15; // a frozen instant that shows the scan meridian nicely
const BG = '#0B0B0D';

type Dot = { x: number; y: number; r: number; white: number; a?: number };

function buildDots(size: number): Dot[] {
  const { mode, opts } = resolvePreset(STATE, 64);
  return MODE_FRAMES[mode](size, T, opts).dots as Dot[];
}

/** Minimal SVG so we can rasterise with ImageMagick without extra deps. */
function svg(
  size: number,
  {
    bg,
    inset = 1,
    ink = '#FFFFFF',
  }: { bg: string | null; inset?: number; ink?: string },
): string {
  const inner = size * inset;
  const off = (size - inner) / 2;
  const dots = buildDots(inner);
  const circles = dots
    .map((d) => {
      const w = Math.min(1, Math.max(0, d.white));
      // dark substrate: mirror the ink so near dots read bright
      const alpha = (d.a ?? 1) * (1 - w);
      if (alpha < 0.02 || d.r <= 0) return '';
      return `<circle cx="${(off + d.x).toFixed(2)}" cy="${(off + d.y).toFixed(
        2,
      )}" r="${Math.max(0.3, d.r).toFixed(2)}" fill="${ink}" opacity="${alpha.toFixed(3)}"/>`;
    })
    .join('');
  const bgRect = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgRect}${circles}</svg>`;
}

async function write(path: string, content: string) {
  await Bun.write(path, content);
}

const out = 'assets/images';
const tmp = '/tmp/icon-svg';

const jobs: { file: string; size: number; opts: Parameters<typeof svg>[1] }[] = [
  { file: `${out}/icon.png`, size: 1024, opts: { bg: BG, inset: 0.78 } },
  { file: `${out}/splash-icon.png`, size: 512, opts: { bg: null, inset: 0.9 } },
  { file: `${out}/favicon.png`, size: 48, opts: { bg: BG, inset: 0.82 } },
  {
    // Android foreground must sit inside the ~66% safe zone
    file: `${out}/android-icon-foreground.png`,
    size: 1024,
    opts: { bg: null, inset: 0.58 },
  },
  {
    file: `${out}/android-icon-monochrome.png`,
    size: 1024,
    opts: { bg: null, inset: 0.58 },
  },
];

await Bun.$`mkdir -p ${tmp}`.quiet();

for (const j of jobs) {
  const svgPath = `${tmp}/${j.file.split('/').pop()!.replace('.png', '.svg')}`;
  await write(svgPath, svg(j.size, j.opts));
  await Bun.$`convert -background none ${svgPath} -resize ${j.size}x${j.size} ${j.file}`.quiet();
  console.log('wrote', j.file);
}

// Flat background layer for the Android adaptive icon
await Bun.$`convert -size 1024x1024 xc:${BG} ${out}/android-icon-background.png`.quiet();
console.log('wrote', `${out}/android-icon-background.png`);
