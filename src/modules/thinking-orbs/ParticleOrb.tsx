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
 * Mirrors the threading model of the upstream React Native port: the frame is
 * built and recorded into an SkPicture on the JS thread, then handed to the UI
 * thread where Skia rasterises it. The engine geometry is deliberately NOT
 * worklet-ized (that would require 'worklet' directives throughout the shared
 * engine); rasterisation — the part that must not jank — is on the UI thread
 * either way.
 *
 * This replaces an earlier react-native-svg implementation that allocated one
 * animated <Circle> per dot (up to ~570) and pushed a fresh flat buffer into a
 * shared value every frame. Mounting/unmounting hundreds of SVG nodes during a
 * layout transition was the visible frame drop.
 */

// The engine ships tuned presets at 64 and 20 only. Anything below ~52px reads
// better — and far cheaper — on the sparse 20 preset.
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

    const start = Date.now();
    // draw once even when paused, so the orb is never blank
    record(0);
    if (paused) return;

    let raf = 0;
    let running = true;
    const loop = () => {
      record(((Date.now() - start) / 1000) * speedRef.current);
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [mode, opts, size, dark, paused, paints, rgba]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        {picture ? <Picture picture={picture} /> : null}
      </Canvas>
    </View>
  );
}
