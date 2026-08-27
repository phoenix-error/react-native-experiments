import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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

import {
  ORB_META,
  SHEET_BODY,
  type OrbState,
  type OrbToast,
} from '../lib/orb-states';
import { ParticleOrb } from './particle-orb';

/**
 * A bottom-docked toast stack that morphs into a bottom sheet.
 *
 * Toast and sheet are the same surface: one spring `progress` interpolates
 * width / height / radius, so the pill visibly grows into the sheet. The orb
 * is drawn once at the engine's tuned 64pt preset and only scaled.
 */

const SPRING = { damping: 20, stiffness: 260, mass: 0.8 } as const;
const FADE = { duration: 110, easing: Easing.out(Easing.quad) } as const;

const PILL = { width: 168, height: 44, radius: 22 };
const SHEET = { radius: 34, sideMargin: 22, bottomGap: 26 };
const DOCK_GAP = 46;

const ORB_BASE = 64;
const ORB_PILL = 34;
const ORB_SHEET = 128;

const PEEK_Y = 30;
const PEEK_SCALE = 0.07;

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
  if (!front) {
    return null;
  }

  const isOpen = expandedId === front.id;
  const behind = toasts.slice(1, 3);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {isOpen ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(140)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            accessibilityLabel="Dismiss sheet"
            accessibilityRole="button"
            onPress={onCollapse}
            style={styles.backdrop}
          />
        </Animated.View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[styles.dock, { paddingBottom: insets.bottom + DOCK_GAP }]}
      >
        <View pointerEvents="box-none" style={styles.stackAnchor}>
          {!isOpen &&
            behind
              .map((t, i) => ({ t, i }))
              .toReversed()
              .map(({ t, i }) => (
                <Animated.View
                  entering={FadeIn.duration(160)}
                  exiting={FadeOut.duration(110)}
                  key={t.id}
                  pointerEvents="none"
                  style={[
                    styles.stacked,
                    {
                      bottom: -(i + 1) * PEEK_Y,
                      transform: [{ scale: 1 - (i + 1) * PEEK_SCALE }],
                      zIndex: 2 - i,
                    },
                  ]}
                >
                  <Pill depth={i + 1} state={t.state} />
                </Animated.View>
              ))}

          <MorphingSurface
            bottomInset={insets.bottom}
            onPress={() => (isOpen ? onCollapse() : onExpand(front.id))}
            open={isOpen}
            screenH={screenH}
            screenW={screenW}
            toast={front}
          />
        </View>
      </View>
    </View>
  );
}

function Pill({ state, depth = 0 }: { state: OrbState; depth?: number }) {
  return (
    <View
      style={[
        styles.surface,
        styles.pillBox,
        {
          backgroundColor:
            depth === 0 ? '#000' : depth === 1 ? '#131317' : '#1A1A20',
          borderColor: depth === 0 ? '#2A2A31' : '#33333C',
        },
      ]}
    >
      <View style={styles.pillRow}>
        <ParticleOrb size={ORB_PILL} state={state} />
        <Text numberOfLines={1} style={styles.pillLabel}>
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

  const sheetW = screenW - SHEET.sideMargin * 2;
  const sheetH = Math.min(screenH * 0.62, 520);

  const surface = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: interpolate(p, [0, 1], [PILL.width, sheetW]),
      height: interpolate(p, [0, 1], [PILL.height, sheetH]),
      borderRadius: interpolate(p, [0, 1], [PILL.radius, SHEET.radius]),
      marginBottom: interpolate(
        p,
        [0, 1],
        [0, Math.max(0, SHEET.bottomGap - DOCK_GAP + bottomInset * 0.2)],
      ),
    };
  });

  const orbWrap = useAnimatedStyle(() => {
    const p = progress.value;
    const drawn = interpolate(p, [0, 1], [ORB_PILL, ORB_SHEET]);
    const w = interpolate(p, [0, 1], [PILL.width, sheetW]);
    const h = interpolate(p, [0, 1], [PILL.height, sheetH]);
    const cx = interpolate(p, [0, 1], [12 + drawn / 2, w / 2]);
    const cy = interpolate(p, [0, 1], [h / 2, h * 0.32]);
    return {
      position: 'absolute' as const,
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
      position: 'absolute' as const,
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
    <Pressable
      accessibilityLabel={open ? 'Collapse toast' : `${meta.label} toast`}
      accessibilityRole="button"
      onPress={onPress}
    >
      <Animated.View style={[styles.surface, styles.front, surface]}>
        <Animated.View pointerEvents="none" style={orbWrap}>
          <Animated.View style={orbInner}>
            <ParticleOrb size={ORB_BASE} state={toast.state} />
          </Animated.View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.pillTextWrap, pillText]}
        >
          <Text numberOfLines={1} style={styles.pillLabel}>
            {meta.label}
          </Text>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.sheetTextWrap, sheetText]}
        >
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
