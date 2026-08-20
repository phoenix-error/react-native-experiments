import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { ParticleOrb } from './ParticleOrb';
import { ORB_STATES, OrbState } from './orbStates';

const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

const COMPACT = { width: 172, height: 44, radius: 22 };
const EXPANDED = { width: 340, height: 190, radius: 40 };

export type DynamicIslandProps = {
  state: OrbState;
  expanded: boolean;
  speed?: number;
  onPress?: () => void;
};

export function DynamicIsland({
  state,
  expanded,
  speed = 1,
  onPress,
}: DynamicIslandProps) {
  const cfg = ORB_STATES[state];
  const progress = useDerivedValue(() =>
    withSpring(expanded ? 1 : 0, SPRING),
  );

  const containerStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: COMPACT.width + (EXPANDED.width - COMPACT.width) * p,
      height: COMPACT.height + (EXPANDED.height - COMPACT.height) * p,
      borderRadius: COMPACT.radius + (EXPANDED.radius - COMPACT.radius) * p,
    };
  });

  const orbSize = expanded ? 96 : 28;

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.island, containerStyle]}>
        {expanded ? (
          <Animated.View
            style={styles.expanded}
            entering={FadeIn.duration(220).delay(60)}
            exiting={FadeOut.duration(120)}
          >
            <ParticleOrb state={state} size={orbSize} speed={speed} />
            <Text style={styles.expandedLabel}>{cfg.label}</Text>
          </Animated.View>
        ) : (
          <Animated.View
            style={styles.compact}
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(80)}
          >
            <ParticleOrb state={state} size={orbSize} speed={speed} />
            <Text style={styles.compactLabel} numberOfLines={1}>
              {cfg.label}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  island: {
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle floating shadow so the pill reads off the wallpaper.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  compactLabel: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  expanded: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  expandedLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
