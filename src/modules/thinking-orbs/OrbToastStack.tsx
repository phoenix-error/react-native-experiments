import { StyleSheet, Pressable, Text, View } from 'react-native';
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
 * A bottom-docked toast stack that MORPHS into a bottom sheet.
 *
 * - It is an OVERLAY: absolutely filling its parent with pointerEvents
 *   "box-none", so it floats above the page instead of taking part in its
 *   layout.
 * - Toast and sheet are the SAME surface: one spring `progress` interpolates
 *   width / height / radius, so the pill visibly grows into the sheet.
 * - Toasts behind the front one are REAL toasts (orb + label), scaled down and
 *   nudged up — the sonner stacking pattern. They are only referenced for the
 *   interaction model; no dependency is used.
 * - The orb is drawn once at the engine's tuned 64pt preset and only scaled.
 *   Re-resolving its preset mid-morph rebuilds the whole Skia pipeline, which
 *   is what made the transition drop frames.
 */

// Finger-driven settle: quick, with a touch of overshoot.
const SPRING = { damping: 20, stiffness: 260, mass: 0.8 } as const;
const FADE = { duration: 110, easing: Easing.out(Easing.quad) } as const;

// Original pill / sheet geometry.
const PILL = { width: 190, height: 46, radius: 23 };
const SHEET = { width: 320, height: 300, radius: 40 };

const ORB_BASE = 64; // the engine's tuned preset — never changed at runtime
const ORB_PILL = 30;
const ORB_SHEET = 99; // 64 * 1.55, matching the original hero orb

/** Vertical peek and shrink per row behind the front toast. */
const PEEK_Y = 10;
const PEEK_SCALE = 0.06;

export type OrbToast = { id: string; state: OrbState };

export type OrbToastStackProps = {
  toasts: OrbToast[];
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

  const front = toasts[0];
  if (!front) return null;

  const isOpen = expandedId === front.id;
  const behind = toasts.slice(1, 3); // at most two peek out behind

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {isOpen ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(140)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.backdrop} onPress={onCollapse} />
        </Animated.View>
      ) : null}

      <View
        style={[styles.dock, { paddingBottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        {/* Behind: real toasts, shrunk and nudged up. Reversed so the
            furthest row paints first. */}
        {!isOpen &&
          behind
            .map((t, i) => ({ t, i }))
            .reverse()
            .map(({ t, i }) => (
              <Animated.View
                key={t.id}
                entering={FadeIn.duration(160)}
                exiting={FadeOut.duration(110)}
                pointerEvents="none"
                style={[
                  styles.stacked,
                  {
                    bottom: insets.bottom + 20,
                    transform: [
                      { translateY: -(i + 1) * PEEK_Y },
                      { scale: 1 - (i + 1) * PEEK_SCALE },
                    ],
                    opacity: 1 - (i + 1) * 0.25,
                  },
                ]}
              >
                <Pill state={t.state} />
              </Animated.View>
            ))}

        <MorphingSurface
          toast={front}
          open={isOpen}
          onPress={() => (isOpen ? onCollapse() : onExpand(front.id))}
        />
      </View>
    </View>
  );
}

/** A plain, non-animated pill — used for the rows sitting behind the front. */
function Pill({ state }: { state: OrbState }) {
  return (
    <View style={[styles.surface, styles.pillBox]}>
      <View style={styles.pillRow}>
        <ParticleOrb state={state} size={ORB_PILL} />
        <Text style={styles.pillLabel} numberOfLines={1}>
          {ORB_META[state].label}
        </Text>
      </View>
    </View>
  );
}

function MorphingSurface({
  toast,
  open,
  onPress,
}: {
  toast: OrbToast;
  open: boolean;
  onPress: () => void;
}) {
  const meta = ORB_META[toast.state];
  const progress = useDerivedValue(() => withSpring(open ? 1 : 0, SPRING));

  const surface = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: interpolate(p, [0, 1], [PILL.width, SHEET.width]),
      height: interpolate(p, [0, 1], [PILL.height, SHEET.height]),
      borderRadius: interpolate(p, [0, 1], [PILL.radius, SHEET.radius]),
    };
  });

  // `transform: scale` scales around the view's CENTRE, so the wrapper is sized
  // to the DRAWN diameter and the oversized canvas is centred inside it —
  // anchoring by the unscaled 64pt box leaves the orb visually offset.
  const orbWrap = useAnimatedStyle(() => {
    const p = progress.value;
    const drawn = interpolate(p, [0, 1], [ORB_PILL, ORB_SHEET]);
    const w = interpolate(p, [0, 1], [PILL.width, SHEET.width]);
    const h = interpolate(p, [0, 1], [PILL.height, SHEET.height]);
    // pill: left-aligned, vertically centred. sheet: horizontally centred, high.
    const cx = interpolate(p, [0, 1], [12 + drawn / 2, w / 2]);
    const cy = interpolate(p, [0, 1], [h / 2, 108]);
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
    const drawn = interpolate(p, [0, 1], [ORB_PILL, ORB_SHEET]);
    const inset = -(ORB_BASE - drawn) / 2;
    return {
      position: 'absolute',
      left: inset,
      top: inset,
      transform: [{ scale: drawn / ORB_BASE }],
    };
  });

  const pillText = useAnimatedStyle(() => ({
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

        {/* pill label, to the right of the small orb */}
        <Animated.View style={[styles.pillTextWrap, pillText]} pointerEvents="none">
          <Text style={styles.pillLabel} numberOfLines={1}>
            {meta.label}
          </Text>
        </Animated.View>

        {/* sheet copy, below the hero orb */}
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
    backgroundColor: '#000',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A31',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  front: { zIndex: 3 },
  stacked: { position: 'absolute', zIndex: 1 },
  pillBox: {
    width: PILL.width,
    height: PILL.height,
    borderRadius: PILL.radius,
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
    gap: 10,
  },
  pillLabel: {
    color: '#F2F2F2',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  pillTextWrap: {
    position: 'absolute',
    left: 12 + ORB_PILL + 10,
    right: 14,
    top: 0,
    height: PILL.height,
    justifyContent: 'center',
  },
  grabber: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
  },
  sheetTextWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 178,
    alignItems: 'center',
  },
  sheetTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  sheetBody: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 6,
  },
});
