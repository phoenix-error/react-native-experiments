import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DynamicIsland } from './DynamicIsland';
import { ParticleOrb } from './ParticleOrb';
import { ORB_META, ORB_ORDER, OrbState } from './orbStates';

const SPEEDS = [0.5, 1, 2];

export function OrbIslandDemo() {
  const [state, setState] = useState<OrbState>('composing');
  const [expanded, setExpanded] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setState((s) => {
        const i = ORB_ORDER.indexOf(s);
        return ORB_ORDER[(i + 1) % ORB_ORDER.length];
      });
    }, 2400);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* Faux phone: the pill lives at the BOTTOM and springs UP into a
          bottom sheet, exactly like Jakub's demo. */}
      <View style={styles.stage}>
        <Text style={styles.hint}>tap the pill to open the sheet</Text>
        <View style={styles.islandSlot}>
          <DynamicIsland
            state={state}
            expanded={expanded}
            speed={speed}
            onPress={() => setExpanded((e) => !e)}
          />
        </View>
      </View>

      <ScrollView
        style={styles.controls}
        contentContainerStyle={styles.controlsContent}
      >
        <Text style={styles.section}>State</Text>
        <View style={styles.chipRow}>
          {ORB_ORDER.map((s) => (
            <Pressable
              key={s}
              onPress={() => setState(s)}
              style={[styles.chip, state === s && styles.chipActive]}
            >
              <ParticleOrb state={s} size={24} speed={speed} />
              <Text
                style={[styles.chipText, state === s && styles.chipTextActive]}
              >
                {ORB_META[s].label.replace('…', '')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Speed</Text>
        <View style={styles.chipRow}>
          {SPEEDS.map((sp) => (
            <Pressable
              key={sp}
              onPress={() => setSpeed(sp)}
              style={[styles.pill, speed === sp && styles.pillActive]}
            >
              <Text
                style={[styles.pillText, speed === sp && styles.pillTextActive]}
              >
                {sp}×
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Options</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            style={[styles.pill, expanded && styles.pillActive]}
          >
            <Text style={[styles.pillText, expanded && styles.pillTextActive]}>
              {expanded ? 'Sheet open' : 'Pill'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAuto((a) => !a)}
            style={[styles.pill, auto && styles.pillActive]}
          >
            <Text style={[styles.pillText, auto && styles.pillTextActive]}>
              {auto ? 'Auto-cycle: on' : 'Auto-cycle: off'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Standalone</Text>
        <View style={styles.bigOrbWrap}>
          <ParticleOrb state={state} size={180} speed={speed} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  stage: {
    paddingTop: 16,
    paddingBottom: 14,
    alignItems: 'center',
  },
  // Fixed-height slot; the pill is pinned to its BOTTOM so the sheet grows up.
  islandSlot: {
    height: 320,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  hint: {
    color: '#5A5A66',
    fontSize: 12,
  },
  controls: { flex: 1 },
  controlsContent: { padding: 20, paddingBottom: 60 },
  section: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#17171F',
    borderWidth: 1,
    borderColor: '#22222C',
  },
  chipActive: { backgroundColor: '#1F1F2E', borderColor: '#4C6BFF' },
  chipText: { color: '#B8B8C4', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#17171F',
    borderWidth: 1,
    borderColor: '#22222C',
  },
  pillActive: { backgroundColor: '#1F1F2E', borderColor: '#4C6BFF' },
  pillText: { color: '#B8B8C4', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
  bigOrbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
