import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useFrameCallback,
  useSharedValue,
  withTiming,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { ORB_STATES, OrbState } from './orbStates';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Particle = {
  theta: number; // azimuth around the vertical axis (0..2π)
  phi: number; // polar angle from the top (0..π)
  radiusFactor: number; // 0..1 distance from centre (some sit inside)
  speedMul: number; // relative angular speed
  phase: number; // jitter phase offset
  sizeMul: number; // relative particle size
};

function makeParticles(count: number, seed: number): Particle[] {
  // Deterministic pseudo-random so the orb looks stable across renders.
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    theta: rnd() * Math.PI * 2,
    // acos(1-2u) distributes phi uniformly over the sphere surface
    // (no clumping at the poles). Bias slightly toward a shell.
    phi: Math.acos(1 - 2 * rnd()),
    radiusFactor: 0.55 + rnd() * 0.45,
    speedMul: 0.75 + rnd() * 0.7,
    phase: rnd() * Math.PI * 2,
    sizeMul: 0.6 + rnd() * 0.8,
  }));
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
  fill: string;
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
  fill,
}: OrbParticleProps) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const t = clock.value;
    // Breathing radius + a little per-particle chaos.
    const breathe = 1 + Math.sin(t * 1.3 + p.phase) * wobble;
    const chaos = 1 + Math.sin(t * 2.7 * p.speedMul + p.phase) * jitter;
    const R = radius * p.radiusFactor * breathe * chaos;

    // Point on a sphere, rotating around the vertical (Y) axis over time.
    const a = p.theta + t * spin * p.speedMul; // azimuth spins
    const sinPhi = Math.sin(p.phi);
    const cosPhi = Math.cos(p.phi);

    const x = cx + R * sinPhi * Math.cos(a);
    const y = cy + R * cosPhi; // full vertical spread -> round sphere
    const z = sinPhi * Math.sin(a); // -1 (back) .. 1 (front)

    const depthNorm = (z + 1) / 2; // 0..1
    const pr = (1.4 + depthNorm * 3.2) * p.sizeMul;
    const opacity = 0.25 + depthNorm * 0.75;

    return { cx: x, cy: y, r: pr, opacity };
  });

  return <AnimatedCircle animatedProps={animatedProps} fill={fill} />;
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
    // timeSincePreviousFrame is ms; advance our clock in seconds.
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    clock.value = clock.value + dt * speedSv.value;
  }, true);

  const particles = useMemo(
    () => makeParticles(cfg.particleCount, cfg.particleCount + state.length),
    [cfg.particleCount, state],
  );

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const gid = `orb-grad-${state}`;
  const haloId = `orb-halo-${state}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={cfg.colors[0]} />
            <Stop offset="100%" stopColor={cfg.colors[1]} />
          </RadialGradient>
          <RadialGradient id={haloId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={cfg.colors[0]} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={cfg.colors[1]} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Soft glow behind the particles */}
        <Circle cx={cx} cy={cy} r={size * 0.46} fill={`url(#${haloId})`} />

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
            fill={`url(#${gid})`}
          />
        ))}
      </Svg>
    </View>
  );
}
