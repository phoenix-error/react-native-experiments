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
function nearestPreset(size: number): OrbSize {
  return size <= 34 ? 20 : 64;
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
  const buildSize = preset;
  const k = size / buildSize;

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
        db[o] = d.x * k;
        db[o + 1] = d.y * k;
        db[o + 2] = Math.max(0, d.r * k);
        db[o + 3] = d.a ?? 1;
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
          lb[o] = l.x1 * k;
          lb[o + 1] = l.y1 * k;
          lb[o + 2] = l.x2 * k;
          lb[o + 3] = l.y2 * k;
          lb[o + 4] = l.w * k;
          lb[o + 5] = l.a ?? 1;
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
  }, [build, buildSize, opts, k, dark, dotPool, linePool, dotBuf, lineBuf]);

  const dotIdx = useMemo(
    () => Array.from({ length: dotPool }, (_, i) => i),
    [dotPool],
  );
  const lineIdx = useMemo(
    () => Array.from({ length: linePool }, (_, i) => i),
    [linePool],
  );

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {lineIdx.map((i) => (
          <OrbLine key={`l${i}`} i={i} buf={lineBuf} />
        ))}
        {dotIdx.map((i) => (
          <OrbDot key={`d${i}`} i={i} buf={dotBuf} />
        ))}
      </Svg>
    </View>
  );
}

function OrbDot({ i, buf }: { i: number; buf: SharedValue<number[]> }) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const b = buf.value;
    const o = i * DOT_STRIDE;
    if (o + DOT_STRIDE > b.length) {
      return { cx: 0, cy: 0, r: 0, opacity: 0, fill: 'rgb(0,0,0)' };
    }
    const g = b[o + 4];
    return {
      cx: b[o],
      cy: b[o + 1],
      r: b[o + 2],
      opacity: b[o + 3],
      fill: `rgb(${g},${g},${g})`,
    };
  });
  return <AnimatedCircle animatedProps={animatedProps} />;
}

function OrbLine({ i, buf }: { i: number; buf: SharedValue<number[]> }) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const b = buf.value;
    const o = i * LINE_STRIDE;
    if (o + LINE_STRIDE > b.length) {
      return {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        opacity: 0,
        strokeWidth: 0,
        stroke: 'rgb(0,0,0)',
      };
    }
    const g = b[o + 6];
    return {
      x1: b[o],
      y1: b[o + 1],
      x2: b[o + 2],
      y2: b[o + 3],
      strokeWidth: b[o + 4],
      opacity: b[o + 5],
      stroke: `rgb(${g},${g},${g})`,
    };
  });
  return <AnimatedLine animatedProps={animatedProps} />;
}
