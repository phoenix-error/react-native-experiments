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
import { ORB_META, SHEET_BODY, OrbState } from './orbStates';

// A finger-driven spring (velocity-carrying settle, gentle overshoot).
const SPRING = { damping: 18, stiffness: 190, mass: 0.9 };

// Compact pill (bottom-anchored) <-> expanded bottom sheet.
const COMPACT = { width: 190, height: 46, radius: 23 };
const SHEET = { width: 320, height: 300, radius: 40 };

export type DynamicIslandProps = {
  state: OrbState;
  expanded: boolean;
  speed?: number;
  onPress?: () => void;
};

/**
 * Bottom-anchored "Dynamic Island" pill that springs UP into a bottom
 * sheet — matching Jakub Antalik's demo: a compact pill at the bottom of
 * the screen taps open into a rounded card with a big orb, a title, and a
 * line of body copy.
 */
export function DynamicIsland({
  state,
  expanded,
  speed = 1,
  onPress,
}: DynamicIslandProps) {
  const meta = ORB_META[state];
  const progress = useDerivedValue(() => withSpring(expanded ? 1 : 0, SPRING));

  // Grows upward: bottom edge stays put, top edge rises. We animate width /
  // height / radius; the container is bottom-aligned in its slot.
  const containerStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: COMPACT.width + (SHEET.width - COMPACT.width) * p,
      height: COMPACT.height + (SHEET.height - COMPACT.height) * p,
      borderRadius: COMPACT.radius + (SHEET.radius - COMPACT.radius) * p,
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.island, containerStyle]}>
        {expanded ? (
          <Animated.View
            style={styles.sheet}
            entering={FadeIn.duration(220).delay(70)}
            exiting={FadeOut.duration(110)}
          >
            <View style={styles.grabber} />
            <View style={styles.sheetBody}>
              {/* Render at the engine's tuned 64pt preset and scale the whole
                  orb up — the presets are hand-tuned per size, so building at
                  an untuned 104pt yields a sparse, near-invisible cloud. */}
              <View style={styles.heroOrb}>
                <ParticleOrb state={state} size={64} speed={speed} />
              </View>
              <Text style={styles.sheetTitle}>{meta.label}</Text>
              <Text style={styles.sheetSub}>{SHEET_BODY}</Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            style={styles.compact}
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(70)}
          >
            <ParticleOrb state={state} size={30} speed={speed} />
            <Text style={styles.compactLabel} numberOfLines={1}>
              {meta.label}
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
    // hairline edge so the black surface still reads on a dark backdrop
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A31',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
    gap: 10,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  compactLabel: {
    color: '#F2F2F2',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  sheet: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
    marginBottom: 10,
  },
  sheetBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  heroOrb: {
    width: 64,
    height: 64,
    transform: [{ scale: 1.55 }],
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  } as any,
  sheetSub: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 6,
  },
});
