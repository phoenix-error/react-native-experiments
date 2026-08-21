import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  createPicture,
} from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import { MODE_FRAMES, resolvePreset, type OrbState, type OrbSize } from './engine';

/**
 * Renders Jakub Antalik's thinking-orb engine with Skia.
 *
 * Frames are built and recorded into an SkPicture on the JS thread, then handed
 * to the UI thread where Skia rasterises them — the same threading model as the
 * upstream React Native port.
 *
 * One difference from upstream, and the reason it exists: upstream assumes ONE
 * orb on screen and gives it its own requestAnimationFrame loop. This app shows
 * a dozen at once (a 9-cell grid plus the toast stack), and a dozen independent
 * rAF loops each doing a setState per frame starve each other — every orb ends
 * up animating at a fraction of the frame rate, which reads as "the animation
 * is gone". So all orbs share ONE clock and one subscriber list.
 */

// ---------------------------------------------------------------------------
// Shared clock: a single rAF loop that ticks every mounted orb.
// ---------------------------------------------------------------------------

type Tick = (t: number) => void;

const subscribers = new Set<Tick>();
let rafId = 0;
let startedAt = 0;

function pump() {
  const t = (Date.now() - startedAt) / 1000;
  // copy: a subscriber may unmount mid-iteration
  for (const fn of Array.from(subscribers)) fn(t);
  rafId = requestAnimationFrame(pump);
}

function subscribe(fn: Tick): () => void {
  if (subscribers.size === 0) {
    startedAt = Date.now();
    rafId = requestAnimationFrame(pump);
  }
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}

// The engine ships tuned presets at 64 and 20 only. Below ~52px the sparse
// 20-preset reads better — and costs far less — than a downscaled 64.
function nearestPreset(size: number): OrbSize {
  return size < 52 ? 20 : 64;
}

export type ParticleOrbProps = {
  state: OrbState;
  size?: number;
  speed?: number;
  /** true = light dots on dark. Default true. */
  dark?: boolean;
  paused?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ParticleOrb({
  state,
  size = 64,
  speed = 1,
  dark = true,
  paused = false,
  style,
}: ParticleOrbProps) {
  const [picture, setPicture] = useState<SkPicture | null>(null);

  // One paint per pass, mutated in place: a fresh SkPaint per dot would
  // allocate hundreds of native objects a frame.
  const paints = useMemo(
    () => ({ fill: Skia.Paint(), stroke: Skia.Paint() }),
    [],
  );
  const rgba = useRef(new Float32Array(4)).current;

  const preset = nearestPreset(size);
  const { mode, speed: baseSpeed, opts } = useMemo(
    () => resolvePreset(state, preset),
    [state, preset],
  );

  const effSpeed = baseSpeed * speed;
  const speedRef = useRef(effSpeed);
  speedRef.current = effSpeed;

  useEffect(() => {
    const { fill, stroke } = paints;
    fill.setAntiAlias(true);
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);

    const build = MODE_FRAMES[mode];

    // Ink value (0 = darkest ink on paper). On a dark substrate it's mirrored
    // so near dots read bright — quantised to 8-bit exactly like the canvas
    // painter, so both platforms land on identical greys.
    const setInk = (paint: typeof fill, white: number, alpha: number) => {
      const w = Math.min(1, Math.max(0, white));
      const g = Math.round((dark ? 1 - w : w) * 255) / 255;
      rgba[0] = g;
      rgba[1] = g;
      rgba[2] = g;
      rgba[3] = alpha;
      paint.setColor(rgba);
    };

    const record = (t: number) => {
      const frame = build(size, t, opts);
      const pic = createPicture(
        (canvas) => {
          // lines first, so nodes sit on top of their edges
          for (const l of frame.lines) {
            setInk(stroke, l.white, l.a ?? 1);
            stroke.setStrokeWidth(l.w);
            canvas.drawLine(l.x1, l.y1, l.x2, l.y2, stroke);
          }
          // dots are already z-sorted into draw order by the engine
          for (const d of frame.dots) {
            setInk(fill, d.white, d.a ?? 1);
            canvas.drawCircle(d.x, d.y, d.r, fill);
          }
        },
        Skia.XYWHRect(0, 0, size, size),
      );
      setPicture(pic);
    };

    // draw once even when paused, so the orb is never blank
    record(0);
    if (paused) return;

    return subscribe((t) => record(t * speedRef.current));
  }, [mode, opts, size, dark, paused, paints, rgba]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        {picture ? <Picture picture={picture} /> : null}
      </Canvas>
    </View>
  );
}
