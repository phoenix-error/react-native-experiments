import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useFrameCallback,
  useSharedValue,
  withTiming,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ORB_STATES, OrbState, OrbStructure } from './orbStates';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// A particle's fixed home position on the unit sphere/pattern (bx,by,bz),
// plus per-particle character. Rotation + projection happen per frame.
type Particle = {
  bx: number;
  by: number;
  bz: number;
  sizeMul: number;
  phase: number;
  // rotate around Y (globe/bands/orbital) or Z, in-plane (square)
  axis: 0 | 1;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGlobe(rnd: () => number, scale: number): Particle[] {
  // Dotted sphere from latitude rings — the signature look.
  const rings = Math.max(5, Math.round(7 * scale));
  const perEquator = Math.max(10, Math.round(16 * scale));
  const out: Particle[] = [];
  for (let i = 0; i < rings; i++) {
    const lat = (-Math.PI / 2) * 0.82 + (i / (rings - 1)) * Math.PI * 0.82;
    const cosLat = Math.cos(lat);
    const n = Math.max(3, Math.round(perEquator * cosLat));
    for (let j = 0; j < n; j++) {
      const theta = (j / n) * Math.PI * 2 + (i % 2) * 0.25;
      out.push({
        bx: cosLat * Math.cos(theta),
        by: Math.sin(lat),
        bz: cosLat * Math.sin(theta),
        sizeMul: 0.85 + rnd() * 0.4,
        phase: rnd() * Math.PI * 2,
        axis: 1,
      });
    }
  }
  return out;
}

function makeBands(rnd: () => number, scale: number): Particle[] {
  // Vertical meridian lines; rotating around Y makes them sweep.
  const meridians = Math.max(5, Math.round(8 * scale));
  const perMeridian = Math.max(7, Math.round(11 * scale));
  const out: Particle[] = [];
  for (let m = 0; m < meridians; m++) {
    const theta = (m / meridians) * Math.PI * 2;
    for (let k = 0; k < perMeridian; k++) {
      const phi =
        (-Math.PI / 2) * 0.85 + (k / (perMeridian - 1)) * Math.PI * 0.85;
      const cosPhi = Math.cos(phi);
      out.push({
        bx: cosPhi * Math.cos(theta),
        by: Math.sin(phi),
        bz: cosPhi * Math.sin(theta),
        sizeMul: 0.8 + rnd() * 0.4,
        phase: rnd() * Math.PI * 2,
        axis: 1,
      });
    }
  }
  return out;
}

function makeConstellation(rnd: () => number, scale: number): Particle[] {
  // A loose swirl: points on a couple of drifting spiral arms through the
  // volume, so it reads as an organic cluster rather than random noise.
  const n = Math.max(16, Math.round(30 * scale));
  const arms = 2;
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const arm = i % arms;
    const f = i / n;
    const r = 0.35 + f * 0.6; // spiral outward
    const swirl = f * Math.PI * 2.4 + (arm * Math.PI * 2) / arms;
    const yTilt = (f - 0.5) * 1.3 + (rnd() - 0.5) * 0.35;
    const jx = (rnd() - 0.5) * 0.22;
    const jz = (rnd() - 0.5) * 0.22;
    out.push({
      bx: r * Math.cos(swirl) + jx,
      by: yTilt,
      bz: r * Math.sin(swirl) + jz,
      sizeMul: 0.7 + rnd() * 0.9,
      phase: rnd() * Math.PI * 2,
      axis: 1,
    });
  }
  return out;
}

function makeOrbital(rnd: () => number, scale: number): Particle[] {
  // A few tilted great-circle rings with gaps -> dashed orbit look.
  const rings = 3;
  const perRing = Math.max(9, Math.round(16 * scale));
  const tilts = [0.0, 1.05, -0.75];
  const out: Particle[] = [];
  for (let r = 0; r < rings; r++) {
    const tilt = tilts[r];
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    for (let j = 0; j < perRing; j++) {
      const a = (j / perRing) * Math.PI * 2;
      // circle in XZ, then tilt around X axis
      const x = Math.cos(a);
      const z0 = Math.sin(a);
      const y = -z0 * sinT;
      const z = z0 * cosT;
      out.push({
        bx: x,
        by: y,
        bz: z,
        sizeMul: 0.85 + rnd() * 0.35,
        phase: rnd() * Math.PI * 2,
        axis: 1,
      });
    }
  }
  return out;
}

function makeSquare(rnd: () => number, scale: number): Particle[] {
  // Flat square outline in the XY plane, slowly rotating in-plane.
  const perSide = Math.max(6, Math.round(9 * scale));
  const out: Particle[] = [];
  const push = (x: number, y: number) =>
    out.push({
      bx: x,
      by: y,
      bz: 0,
      sizeMul: 0.9 + rnd() * 0.3,
      phase: rnd() * Math.PI * 2,
      axis: 0,
    });
  const L = 0.82;
  for (let i = 0; i < perSide; i++) {
    const f = -L + (i / (perSide - 1)) * 2 * L;
    push(f, -L); // bottom
    push(f, L); // top
    if (i > 0 && i < perSide - 1) {
      push(-L, f); // left
      push(L, f); // right
    }
  }
  return out;
}

function makeParticles(structure: OrbStructure, density: number, seed: number) {
  const rnd = mulberry32(seed);
  switch (structure) {
    case 'globe':
      return makeGlobe(rnd, density);
    case 'bands':
      return makeBands(rnd, density);
    case 'constellation':
      return makeConstellation(rnd, density);
    case 'orbital':
      return makeOrbital(rnd, density);
    case 'square':
      return makeSquare(rnd, density);
  }
}

type OrbParticleProps = {
  p: Particle;
  clock: SharedValue<number>;
  cx: number;
  cy: number;
  radius: number;
  spin: number;
  wobble: number;
  jitter: number;
};

function OrbParticle({
  p,
  clock,
  cx,
  cy,
  radius,
  spin,
  wobble,
  jitter,
}: OrbParticleProps) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const t = clock.value;
    const breathe = 1 + Math.sin(t * 1.2 + p.phase) * wobble;
    const chaos = 1 + Math.sin(t * 2.6 * (0.5 + p.sizeMul) + p.phase) * jitter;
    const R = radius * breathe * chaos;

    const a = t * spin;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);

    let x: number;
    let y: number;
    let z: number;
    if (p.axis === 1) {
      // rotate around the vertical Y axis
      x = p.bx * cosA + p.bz * sinA;
      z = -p.bx * sinA + p.bz * cosA;
      y = p.by;
    } else {
      // rotate in the screen plane (square)
      x = p.bx * cosA - p.by * sinA;
      y = p.bx * sinA + p.by * cosA;
      z = 0.4; // fixed mild depth so it reads flat but lit
    }

    const sx = cx + x * R;
    const sy = cy + y * R;
    const depthNorm = (z + 1) / 2; // 0 (back) .. 1 (front)
    const pr = (0.9 + depthNorm * 1.9) * p.sizeMul;
    const opacity = 0.18 + depthNorm * 0.82;

    return { cx: sx, cy: sy, r: pr, opacity };
  });

  return <AnimatedCircle animatedProps={animatedProps} fill="#FFFFFF" />;
}

export type ParticleOrbProps = {
  state: OrbState;
  size?: number;
  speed?: number;
};

export function ParticleOrb({ state, size = 64, speed = 1 }: ParticleOrbProps) {
  const cfg = ORB_STATES[state];
  const clock = useSharedValue(0);
  const speedSv = useSharedValue(speed);

  useDerivedValue(() => {
    speedSv.value = withTiming(speed, { duration: 300 });
  }, [speed]);

  useFrameCallback((frame) => {
    'worklet';
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    clock.value = clock.value + dt * speedSv.value;
  }, true);

  // Scale particle density with the render size so a 20px pill orb
  // isn't as busy as a 180px hero orb.
  const densityScale = cfg.density * Math.min(1.15, 0.45 + size / 140);
  const particles = useMemo(
    () => makeParticles(cfg.structure, densityScale, state.length * 97 + 7),
    [cfg.structure, densityScale, state],
  );

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const haloId = `orb-halo-${state}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={haloId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.16} />
            <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.04} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* Soft bloom so the particle cloud reads as a lit orb */}
        <Circle cx={cx} cy={cy} r={size * 0.48} fill={`url(#${haloId})`} />
        {particles.map((p, i) => (
          <OrbParticle
            key={i}
            p={p}
            clock={clock}
            cx={cx}
            cy={cy}
            radius={radius}
            spin={cfg.spin}
            wobble={cfg.wobble}
            jitter={cfg.jitter}
          />
        ))}
      </Svg>
    </View>
  );
}
