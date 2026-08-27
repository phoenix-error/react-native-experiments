import {
  Canvas,
  createPicture,
  PaintStyle,
  Picture,
  Skia,
} from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppActive } from '@/experiments/shared/hooks/use-app-active';

import {
  MODE_FRAMES,
  resolvePreset,
  type OrbSize,
  type OrbState,
} from '../lib/engine';

/**
 * Renders Jakub Antalik's thinking-orb engine with Skia.
 *
 * Frames are built and recorded into an SkPicture on the JS thread, then handed
 * to the UI thread where Skia rasterises them — the same threading model as the
 * upstream React Native port.
 *
 * All orbs share one clock. Independent rAF loops starve each other when a
 * dozen orbs (grid + toast stack) are on screen at once.
 */

type Tick = (t: number) => void;

const subscribers = new Set<Tick>();
let rafId = 0;
let startedAt = 0;

function pump() {
  const t = (Date.now() - startedAt) / 1000;
  for (const fn of Array.from(subscribers)) {
    fn(t);
  }
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
  const appActive = useAppActive();
  const isPaused = paused || !appActive;
  const [picture, setPicture] = useState<SkPicture | null>(null);

  const paints = useMemo(
    () => ({ fill: Skia.Paint(), stroke: Skia.Paint() }),
    [],
  );
  const rgba = useRef(new Float32Array(4)).current;

  const preset = nearestPreset(size);
  const {
    mode,
    speed: baseSpeed,
    opts,
  } = useMemo(() => resolvePreset(state, preset), [state, preset]);

  const effSpeed = baseSpeed * speed;
  const speedRef = useRef(effSpeed);
  speedRef.current = effSpeed;

  useEffect(() => {
    const { fill, stroke } = paints;
    fill.setAntiAlias(true);
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);

    const build = MODE_FRAMES[mode];

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
        canvas => {
          for (const l of frame.lines) {
            setInk(stroke, l.white, l.a ?? 1);
            stroke.setStrokeWidth(l.w);
            canvas.drawLine(l.x1, l.y1, l.x2, l.y2, stroke);
          }
          for (const d of frame.dots) {
            setInk(fill, d.white, d.a ?? 1);
            canvas.drawCircle(d.x, d.y, d.r, fill);
          }
        },
        Skia.XYWHRect(0, 0, size, size),
      );
      setPicture(pic);
    };

    record(0);
    if (isPaused) {
      return;
    }

    return subscribe(t => record(t * speedRef.current));
  }, [mode, opts, size, dark, isPaused, paints, rgba]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        {picture ? <Picture picture={picture} /> : null}
      </Canvas>
    </View>
  );
}
