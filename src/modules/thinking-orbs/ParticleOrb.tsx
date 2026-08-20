import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line as SvgLine } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  MODE_FRAMES,
  resolvePreset,
  type OrbState,
  type OrbSize,
} from './engine';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(SvgLine);

// Stride of the flat dot buffer: [cx, cy, r, opacity, grey].
const DOT_STRIDE = 5;
// Stride of the flat line buffer: [x1, y1, x2, y2, w, opacity, grey].
const LINE_STRIDE = 7;

// The engine ships tuned presets only at size 64 and 20. Resolve at the
// nearest tuned preset, then uniformly scale to the actual render size.
// The 20-preset is far sparser (tuned for inline text), so anything up to
// roughly half the 64-preset's size reads better — and much cheaper — with
// it: a 38px icon on the 64-preset would allocate ~570 dots.
function nearestPreset(size: number): OrbSize {
  return size < 52 ? 20 : 64;
}

export type ParticleOrbProps = {
  state: OrbState;
  size?: number;
  speed?: number;
  /** true = light dots on dark (Dynamic Island). Default true. */
  dark?: boolean;
  /** Hard cap on animated dot nodes. */
  maxDots?: number;
};

/**
 * Renders Jakub Antalik's thinking-orb engine with react-native-svg.
 *
 * Architecture mirrors the upstream RN port: a single requestAnimationFrame
 * loop on the JS thread builds ONE frame per tick (the engine geometry is
 * intentionally not worklet-ized), flattens it into shared Float32-style
 * buffers, and each SVG node reads only its own slot in a worklet. That's
 * O(N) build + O(N) reads per frame instead of the O(N²) you'd get from
 * rebuilding the whole frame inside every node.
 */
export function ParticleOrb({
  state,
  size = 64,
  speed = 1,
  dark = true,
  maxDots = 700,
}: ParticleOrbProps) {
  const preset = nearestPreset(size);
  const { mode, speed: baseSpeed, opts } = useMemo(
    () => resolvePreset(state, preset),
    [state, preset],
  );
  const build = MODE_FRAMES[mode];
  // Build the frame AT the real render size. The engine already lays a mode
  // out for whatever size it's given (radii use a sub-linear `radiusScale`),
  // so the preset only picks the tuned dot-count/speed — geometry must not be
  // rescaled afterwards or the dots land outside the SVG viewport.
  const buildSize = size;

  // Shared flat buffers the worklets read. Number[] is deep-copied into the
  // UI runtime on each assignment — cheap enough for a few hundred dots.
  const dotBuf = useSharedValue<number[]>([]);
  const lineBuf = useSharedValue<number[]>([]);

  // Probe a few instants to size the (stable) node pools.
  const { dotPool, linePool } = useMemo(() => {
    let maxD = 0;
    let maxL = 0;
    for (let i = 0; i < 6; i++) {
      const f = build(buildSize, i * 0.37, opts);
      maxD = Math.max(maxD, f.dots.length);
      maxL = Math.max(maxL, f.lines.length);
    }
    return { dotPool: Math.min(maxDots, maxD + 4), linePool: maxL + 2 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, buildSize, opts, maxDots]);

  // Keep the animated bits in a ref so the rAF effect doesn't restart when
  // only `speed` changes.
  const effSpeed = speed * baseSpeed;
  const speedRef = useRef(effSpeed);
  speedRef.current = effSpeed;

  useEffect(() => {
    let raf = 0;
    let running = true;
    const start = Date.now();

    const tick = () => {
      const t = ((Date.now() - start) / 1000) * speedRef.current;
      const frame = build(buildSize, t, opts);

      const dots = frame.dots;
      const nd = Math.min(dots.length, dotPool);
      const db = new Array(nd * DOT_STRIDE);
      for (let i = 0; i < nd; i++) {
        const d = dots[i];
        const w = Math.min(1, Math.max(0, d.white));
        const g = Math.round((dark ? 1 - w : w) * 255);
        const o = i * DOT_STRIDE;
        db[o] = d.x;
        db[o + 1] = d.y;
        db[o + 2] = Math.max(0, d.r);
        // Fold the dot's grey level into alpha: the nodes are painted a flat
        // white and only numeric props are animated, because react-native-svg
        // on web does NOT apply animated *string* props (an animated `fill`
        // silently keeps its initial value, rendering every dot black).
        db[o + 3] = (d.a ?? 1) * (g / 255);
        db[o + 4] = g;
      }
      dotBuf.value = db;

      const lines = frame.lines;
      const nl = Math.min(lines.length, linePool);
      if (nl || lineBuf.value.length) {
        const lb = new Array(nl * LINE_STRIDE);
        for (let i = 0; i < nl; i++) {
          const l = lines[i];
          const w = Math.min(1, Math.max(0, l.white));
          const g = Math.round((dark ? 1 - w : w) * 255);
          const o = i * LINE_STRIDE;
          lb[o] = l.x1;
          lb[o + 1] = l.y1;
          lb[o + 2] = l.x2;
          lb[o + 3] = l.y2;
          lb[o + 4] = l.w;
          lb[o + 5] = (l.a ?? 1) * (g / 255);
          lb[o + 6] = g;
        }
        lineBuf.value = lb;
      }

      if (running) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [build, buildSize, opts, dark, dotPool, linePool, dotBuf, lineBuf]);

  const dotIdx = useMemo(
    () => Array.from({ length: dotPool }, (_, i) => i),
    [dotPool],
  );
  const lineIdx = useMemo(
    () => Array.from({ length: linePool }, (_, i) => i),
    [linePool],
  );

  // Monochrome ink: dots are painted flat, their grey level carried in alpha.
  const inkColor = dark ? '#FFFFFF' : '#000000';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {lineIdx.map((i) => (
          <OrbLine key={`l${i}`} i={i} buf={lineBuf} color={inkColor} />
        ))}
        {dotIdx.map((i) => (
          <OrbDot key={`d${i}`} i={i} buf={dotBuf} color={inkColor} />
        ))}
      </Svg>
    </View>
  );
}

function OrbDot({
  i,
  buf,
  color,
}: {
  i: number;
  buf: SharedValue<number[]>;
  color: string;
}) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const b = buf.value;
    const o = i * DOT_STRIDE;
    if (o + DOT_STRIDE > b.length) {
      return { cx: 0, cy: 0, r: 0, opacity: 0 };
    }
    return {
      cx: b[o],
      cy: b[o + 1],
      r: b[o + 2],
      opacity: b[o + 3],
    };
  });
  // `fill` is a STATIC prop — animated string props don't apply on web.
  return <AnimatedCircle fill={color} animatedProps={animatedProps} />;
}

function OrbLine({
  i,
  buf,
  color,
}: {
  i: number;
  buf: SharedValue<number[]>;
  color: string;
}) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const b = buf.value;
    const o = i * LINE_STRIDE;
    if (o + LINE_STRIDE > b.length) {
      return { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0, strokeWidth: 0 };
    }
    return {
      x1: b[o],
      y1: b[o + 1],
      x2: b[o + 2],
      y2: b[o + 3],
      strokeWidth: b[o + 4],
      opacity: b[o + 5],
    };
  });
  return <AnimatedLine stroke={color} animatedProps={animatedProps} />;
}
