import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParticleOrb } from './ParticleOrb';
import { ORB_META, SHEET_BODY } from './orbStates';
import type { OrbState } from './engine';

/**
 * A bottom-anchored toast stack that MORPHS into a bottom sheet.
 *
 * Design notes:
 * - It is an OVERLAY: absolutely filling its parent with `pointerEvents="box-none"`,
 *   so it floats above the page instead of taking part in its layout.
 * - Toast and sheet are the SAME surface. One shared `progress` value
 *   interpolates width / height / radius, so the pill visibly grows into the
 *   sheet rather than cross-fading between two components.
 * - The orb is rendered ONCE at the engine's tuned 64pt preset and scaled with
 *   a transform. Changing its `size` prop mid-morph would re-resolve the preset
 *   and rebuild the whole Skia pipeline — the old frame-drop.
 * - Stacked toasts sit behind the front one (scaled down, nudged up), the
 *   sonner pattern. They fade out while the sheet opens.
 */

// Snappy: reaches the target fast, settles without a wobble.
const SPRING = { damping: 26, stiffness: 420, mass: 0.7 } as const;
const FADE = { duration: 120, easing: Easing.out(Easing.quad) } as const;

const TOAST_H = 62;
const TOAST_R = 18;
const SHEET_H = 300;
const SHEET_R = 34;
const SIDE = 14;

/** Orb is drawn at this size and only ever scaled. */
const ORB_BASE = 64;

export type OrbToast = {
  id: string;
  state: OrbState;
};

export type OrbToastStackProps = {
  toasts: OrbToast[];
  /** Which toast is currently expanded into a sheet, if any. */
  expandedId: string | null;
  onExpand: (id: string) => void;
  onCollapse: () => void;
};

export function OrbToastStack({
  toasts,
  expandedId,
  onExpand,
  onCollapse,
}: OrbToastStackProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const front = toasts[0];
  const behind = toasts.slice(1, 3); // at most two peeking behind

  if (!front) return null;

  const isOpen = expandedId === front.id;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim + catch outside taps only while open */}
      {isOpen ? (
        <AnimatedBackdrop onPress={onCollapse} />
      ) : null}

      <View
        style={[styles.dock, { paddingBottom: insets.bottom + 22 }]}
        pointerEvents="box-none"
      >
        {/* Toasts peeking out behind the front one */}
        {!isOpen &&
          behind.map((t, i) => (
            <Animated.View
              key={t.id}
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(120)}
              pointerEvents="none"
              style={[
                styles.surface,
                styles.behind,
                {
                  width: screenW - SIDE * 2,
                  height: TOAST_H,
                  borderRadius: TOAST_R,
                  bottom: insets.bottom + 22,
                  transform: [
                    { translateY: -(i + 1) * 9 },
                    { scale: 1 - (i + 1) * 0.05 },
                  ],
                  opacity: 1 - (i + 1) * 0.35,
                },
              ]}
            />
          ))}

        <MorphingSurface
          toast={front}
          open={isOpen}
          screenW={screenW}
          onPress={() => (isOpen ? onCollapse() : onExpand(front.id))}
        />
      </View>
    </View>
  );
}

function AnimatedBackdrop({ onPress }: { onPress: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(140)}
      style={StyleSheet.absoluteFill}
    >
      <Pressable style={styles.backdrop} onPress={onPress} />
    </Animated.View>
  );
}

function MorphingSurface({
  toast,
  open,
  screenW,
  onPress,
}: {
  toast: OrbToast;
  open: boolean;
  screenW: number;
  onPress: () => void;
}) {
  const meta = ORB_META[toast.state];
  const progress = useDerivedValue(() => withSpring(open ? 1 : 0, SPRING));

  const surface = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: interpolate(p, [0, 1], [screenW - SIDE * 2, screenW - SIDE]),
      height: interpolate(p, [0, 1], [TOAST_H, SHEET_H]),
      borderRadius: interpolate(p, [0, 1], [TOAST_R, SHEET_R]),
    };
  });

  // Orb: ONE canvas at the engine's tuned preset, only moved and scaled.
  //
  // `transform: scale` scales around the view's CENTRE, not its origin, so the
  // wrapper is sized to the DRAWN diameter and the oversized canvas is centred
  // inside it with negative margins. That keeps the visual box equal to the
  // layout box — anchoring by the unscaled 64pt box is what pushed the orb into
  // the label before.
  const orbWrap = useAnimatedStyle(() => {
    const p = progress.value;
    const drawn = interpolate(p, [0, 1], [30, 104]);
    const cx = interpolate(p, [0, 1], [14 + drawn / 2, (screenW - SIDE) / 2]);
    const cy = interpolate(p, [0, 1], [TOAST_H / 2, 118]);
    return {
      position: 'absolute',
      left: cx - drawn / 2,
      top: cy - drawn / 2,
      width: drawn,
      height: drawn,
    };
  });

  const orbInner = useAnimatedStyle(() => {
    const p = progress.value;
    const drawn = interpolate(p, [0, 1], [30, 104]);
    const scale = drawn / ORB_BASE;
    const inset = -(ORB_BASE - drawn) / 2;
    return {
      position: 'absolute',
      left: inset,
      top: inset,
      transform: [{ scale }],
    };
  });

  const toastText = useAnimatedStyle(() => ({
    opacity: withTiming(open ? 0 : 1, FADE),
  }));
  const sheetText = useAnimatedStyle(() => ({
    opacity: withTiming(open ? 1 : 0, FADE),
  }));
  const grabber = useAnimatedStyle(() => ({
    opacity: withTiming(open ? 1 : 0, FADE),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.surface, styles.front, surface]}>
        <Animated.View style={[styles.grabber, grabber]} pointerEvents="none" />

        <Animated.View style={orbWrap} pointerEvents="none">
          <Animated.View style={orbInner}>
            <ParticleOrb state={toast.state} size={ORB_BASE} />
          </Animated.View>
        </Animated.View>

        {/* compact label, sits to the right of the small orb */}
        <Animated.View style={[styles.toastTextWrap, toastText]} pointerEvents="none">
          <Text style={styles.toastLabel} numberOfLines={1}>
            {meta.label}
          </Text>
        </Animated.View>

        {/* sheet copy, below the big orb */}
        <Animated.View style={[styles.sheetTextWrap, sheetText]} pointerEvents="none">
          <Text style={styles.sheetTitle}>{meta.label}</Text>
          <Text style={styles.sheetBody}>{SHEET_BODY}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  surface: {
    backgroundColor: '#0E0E11',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A31',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  front: { zIndex: 2 },
  behind: { position: 'absolute', zIndex: 1 },
  grabber: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A42',
  },
  toastTextWrap: {
    position: 'absolute',
    left: 60,
    right: 16,
    top: 0,
    height: TOAST_H,
    justifyContent: 'center',
  },
  toastLabel: { color: '#F2F2F5', fontSize: 15, fontWeight: '600' },
  sheetTextWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 186,
    alignItems: 'center',
  },
  sheetTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sheetBody: {
    color: '#8E8E98',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
});
