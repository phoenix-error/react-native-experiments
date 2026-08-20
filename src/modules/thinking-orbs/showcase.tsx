import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ParticleOrb } from './ParticleOrb';
import { DynamicIsland } from './DynamicIsland';
import { ORB_META, ORB_ORDER } from './orbStates';
import type { OrbState } from './engine';
import type { ShowcaseModule } from '../types';

/** Cycles the orb states so a feed preview is never static. */
function useCycledState(intervalMs = 2800): OrbState {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return ORB_ORDER[i % ORB_ORDER.length];
}

/** Feed preview: the bottom pill breathing open into its sheet. */
function BottomSheetPreview() {
  const state = useCycledState(5200);
  const [expanded, setExpanded] = useState(true);

  // Hold the sheet open longer than the pill, and stagger against the state
  // cycle so the card isn't caught mid-transition every time it's sampled.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = (open: boolean) => {
      if (cancelled) return;
      setExpanded(open);
      timer = setTimeout(() => step(!open), open ? 3600 : 1900);
    };
    timer = setTimeout(() => step(false), 3600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.previewRoot}>
      {/* A faint app-like backdrop so the black pill/sheet reads as a
          floating surface instead of vanishing into a black screen. */}
      <View style={styles.backdrop}>
        <View style={[styles.skelLine, { width: '52%' }]} />
        <View style={[styles.skelLine, { width: '78%' }]} />
        <View style={[styles.skelCard]} />
        <View style={[styles.skelLine, { width: '64%' }]} />
        <View style={[styles.skelLine, { width: '40%' }]} />
      </View>
      <View style={styles.sheetSlot}>
        <DynamicIsland
          state={state}
          expanded={expanded}
          onPress={() => setExpanded((e) => !e)}
        />
      </View>
    </View>
  );
}

/** Detail screen: full interactive playground. */
function OrbPlayground() {
  const [state, setState] = useState<OrbState>('composing');
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.playRoot}>
      <View style={styles.playStage}>
        <DynamicIsland
          state={state}
          expanded={expanded}
          onPress={() => setExpanded((e) => !e)}
        />
      </View>
      <View style={styles.playGrid}>
        {ORB_ORDER.map((s) => (
          <View
            key={s}
            style={[styles.playCell, state === s && styles.playCellActive]}
            onTouchEnd={() => setState(s)}
          >
            <ParticleOrb state={s} size={40} />
            <Text style={styles.playLabel} numberOfLines={1}>
              {ORB_META[s].label.replace('…', '').replace('Agent ', '')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const thinkingOrbsModule: ShowcaseModule = {
  id: 'thinking-orbs',
  brand: 'Thinking orbs',
  badge: 'new drop',
  title: 'Dynamic Island bottom sheet',
  description:
    'A bottom status pill that springs up into a sheet, with nine dotted particle-orb states.',
  icon: <ParticleOrb state="composing" size={38} />,
  preview: <BottomSheetPreview />,
  detail: <OrbPlayground />,
};

const styles = StyleSheet.create({
  previewRoot: { flex: 1, backgroundColor: '#0B0B0D', alignItems: 'center' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 26,
    paddingHorizontal: 18,
    gap: 10,
  },
  skelLine: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#17171C',
  },
  skelCard: {
    height: 74,
    borderRadius: 14,
    backgroundColor: '#131318',
    marginVertical: 4,
  },
  // The phone is cropped by the panel, so keep the pill/sheet in the upper
  // area that stays visible rather than pinning it to the device bottom.
  sheetSlot: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    transform: [{ scale: 0.72 }],
  },
  playRoot: { flex: 1, backgroundColor: '#000' },
  playStage: {
    height: 340,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  playGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  playCell: {
    width: 82,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E1E24',
  },
  playCellActive: { borderColor: '#4C6BFF', backgroundColor: '#12121A' },
  playLabel: { color: '#8E8E98', fontSize: 9, fontWeight: '600', marginTop: 2 },
});
