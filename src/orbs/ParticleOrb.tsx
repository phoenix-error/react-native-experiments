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
  baseAngle: number; // starting angle around the orb
  radiusFactor: number; // 0..1 distance from centre
  tilt: number; // orbital plane tilt -> fake 3D
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
    baseAngle: rnd() * Math.PI * 2,
    radiusFactor: 0.35 + rnd() * 0.65,
    tilt: (rnd() - 0.5) * 1.4,
    speedMul: 0.7 + rnd() * 0.9,
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
    const angle = p.baseAngle + t * spin * p.speedMul;
    // Breathing radius + a little per-particle chaos.
    const breathe = 1 + Math.sin(t * 1.3 + p.phase) * wobble;
    const chaos = 1 + Math.sin(t * 2.7 * p.speedMul + p.phase) * jitter;
    const r = radius * p.radiusFactor * breathe * chaos;

    // Project onto a tilted circle -> depth = z gives size/opacity.
    const x = cx + Math.cos(angle) * r;
    const depth = Math.sin(angle) * Math.cos(p.tilt); // -1 (back) .. 1 (front)
    const y = cy + Math.sin(angle) * r * Math.sin(p.tilt) * 0.6;

    const depthNorm = (depth + 1) / 2; // 0..1
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
