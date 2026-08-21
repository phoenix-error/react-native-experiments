import {
  StyleSheet,
  Pressable,
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

// Geometry measured off the reference video (frame-by-frame, see README):
//
// PILL  — compact, only as wide as its content (~45% of the screen), floating
//         above the bottom edge. The orb nearly fills it vertically.
// SHEET — a FLOATING CARD, not an edge-to-edge bottom sheet: a visible margin
//         on both sides, a clear gap below it, and all four corners rounded.
//         It fills most of the screen. No grabber.
const PILL = { width: 168, height: 44, radius: 22 };
const SHEET = { radius: 34, sideMargin: 22, bottomGap: 26 };
/** Gap between the docked pill and the bottom edge. */
const DOCK_GAP = 46;

const ORB_BASE = 64; // the engine's tuned preset — never changed at runtime
const ORB_PILL = 34;
const ORB_SHEET = 128; // hero orb in the sheet, per the reference

/**
 * Stacking, following sonner: the newest pill sits in front, older ones peek
 * out BELOW it, each shifted down and scaled slightly smaller.
 *
 * PEEK_Y must clearly exceed the pill's corner radius — a smaller offset
 * leaves the rows behind hidden and the stack reads as one smudged blob.
 */
const PEEK_Y = 14;
const PEEK_SCALE = 0.07;

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
  const { width: screenW, height: screenH } = useWindowDimensions();

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
        style={[styles.dock, { paddingBottom: insets.bottom + DOCK_GAP }]}
        pointerEvents="box-none"
      >
        {/* The stack is anchored to the FRONT pill, not to the dock: absolute
            children lay out against their parent's PADDING box, so mixing the
            dock's paddingBottom with a `bottom` offset counted the dock gap
            twice and threw the older rows above the front pill.
            This wrapper auto-sizes to the front pill; older rows hang BELOW it
            with a negative offset, so no fixed height is needed and the sheet
            can still grow freely. */}
        <View style={styles.stackAnchor} pointerEvents="box-none">
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
                        // hang BELOW the front pill, each row a little lower
                        bottom: -(i + 1) * PEEK_Y,
                        transform: [{ scale: 1 - (i + 1) * PEEK_SCALE }],
                        zIndex: -(i + 1),
                      },
                    ]}
                >
                  <Pill state={t.state} depth={i + 1} />
                </Animated.View>
              ))}

          <MorphingSurface
            toast={front}
            open={isOpen}
            screenW={screenW}
            screenH={screenH}
            bottomInset={insets.bottom}
            onPress={() => (isOpen ? onCollapse() : onExpand(front.id))}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * A plain, non-animated pill — used for the rows sitting behind the front one.
 * Deeper rows get a slightly lighter surface and a brighter border so they
 * separate from the page instead of melting into it.
 */
function Pill({ state, depth = 0 }: { state: OrbState; depth?: number }) {
  return (
    <View
      style={[
        styles.surface,
        styles.pillBox,
        {
          backgroundColor: depth === 0 ? '#000' : depth === 1 ? '#131317' : '#1A1A20',
          borderColor: depth === 0 ? '#2A2A31' : '#33333C',
        },
      ]}
    >
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
  screenW,
  screenH,
  bottomInset,
}: {
  toast: OrbToast;
  open: boolean;
  onPress: () => void;
  screenW: number;
  screenH: number;
  bottomInset: number;
}) {
  const meta = ORB_META[toast.state];
  const progress = useDerivedValue(() => withSpring(open ? 1 : 0, SPRING));

  // The sheet is a floating card: inset from both sides, lifted off the bottom
  // edge, and tall enough to fill most of the screen — matching the reference.
  const sheetW = screenW - SHEET.sideMargin * 2;
  const sheetH = Math.min(screenH * 0.62, 520);

  const surface = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: interpolate(p, [0, 1], [PILL.width, sheetW]),
      height: interpolate(p, [0, 1], [PILL.height, sheetH]),
      // all four corners stay rounded — it never docks against an edge
      borderRadius: interpolate(p, [0, 1], [PILL.radius, SHEET.radius]),
      // keep a gap below the card as it grows
      marginBottom: interpolate(
        p,
        [0, 1],
        [0, Math.max(0, SHEET.bottomGap - DOCK_GAP + bottomInset * 0.2)],
      ),
    };
  });

  // `transform: scale` scales around the view's CENTRE, so the wrapper is sized
  // to the DRAWN diameter and the oversized canvas is centred inside it —
  // anchoring by the unscaled 64pt box leaves the orb visually offset.
  const orbWrap = useAnimatedStyle(() => {
    const p = progress.value;
    const drawn = interpolate(p, [0, 1], [ORB_PILL, ORB_SHEET]);
    const w = interpolate(p, [0, 1], [PILL.width, sheetW]);
    const h = interpolate(p, [0, 1], [PILL.height, sheetH]);
    // pill: left-aligned, vertically centred. sheet: horizontally centred, high.
    const cx = interpolate(p, [0, 1], [12 + drawn / 2, w / 2]);
    const cy = interpolate(p, [0, 1], [h / 2, h * 0.32]);
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

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.surface, styles.front, surface]}>
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
  /** Base: sizing is applied inline, and only while collapsed. */
  stackAnchor: { alignItems: 'center' },
  stacked: { position: 'absolute' },
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
    left: 10 + ORB_PILL + 9,
    right: 14,
    top: 0,
    height: PILL.height,
    justifyContent: 'center',
  },
  sheetTextWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '52%',
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
