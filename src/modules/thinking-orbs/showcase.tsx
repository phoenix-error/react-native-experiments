import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ParticleOrb } from './ParticleOrb';
import { OrbToastStack, type OrbToast } from './OrbToastStack';
import { ORB_META, ORB_ORDER } from './orbStates';
import type { OrbState } from './engine';
import type { ShowcaseModule } from '../types';

let seq = 0;
const nextId = () => `t${++seq}`;

/**
 * Detail screen: the real demo.
 *
 * Settings live at the top of the page; the toasts are an OVERLAY on top of
 * everything, docked to the bottom. Tapping a toast morphs it into a bottom
 * sheet; tapping outside morphs it back into the stack.
 */
function OrbPlayground() {
  const [toasts, setToasts] = useState<OrbToast[]>([
    { id: nextId(), state: 'composing' },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const push = useCallback((state: OrbState) => {
    setToasts((prev) => [{ id: nextId(), state }, ...prev].slice(0, 4));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
    setExpandedId(null);
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Push a toast</Text>
        <View style={styles.grid}>
          {ORB_ORDER.map((s) => (
            <Pressable
              key={s}
              onPress={() => push(s)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <ParticleOrb state={s} size={38} />
              <Text style={styles.cellLabel} numberOfLines={1}>
                {ORB_META[s].label.replace('…', '').replace('Agent ', '')}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Pressable onPress={clear} style={styles.btn}>
            <Text style={styles.btnText}>Clear</Text>
          </Pressable>
          <Text style={styles.hint}>
            tap a toast to open · tap outside to close
          </Text>
        </View>
      </ScrollView>

      {/* Overlay — floats above the page, docked bottom */}
      <OrbToastStack
        toasts={toasts}
        expandedId={expandedId}
        onExpand={setExpandedId}
        onCollapse={() => setExpandedId(null)}
      />
    </View>
  );
}

/** Feed preview stays as-is for now. */
function FeedPreview() {
  return (
    <View style={styles.previewRoot}>
      <View style={styles.previewOrb}>
        <ParticleOrb state="composing" size={64} />
      </View>
    </View>
  );
}

export const thinkingOrbsModule: ShowcaseModule = {
  id: 'thinking-orbs',
  brand: 'Thinking orbs',
  badge: 'new drop',
  title: 'Toast stack that morphs into a sheet',
  description:
    'Bottom-docked toasts that grow into a bottom sheet when tapped, with nine dotted particle-orb states.',
  icon: <ParticleOrb state="composing" size={38} />,
  preview: <FeedPreview />,
  detail: <OrbPlayground />,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0D' },
  content: { padding: 18, paddingBottom: 200 },
  section: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: 96,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#22222A',
  },
  pressed: { opacity: 0.7 },
  cellLabel: {
    color: '#9A9AA6',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  row: { marginTop: 22, gap: 12 },
  btn: {
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#17171F',
    borderWidth: 1,
    borderColor: '#26262F',
  },
  btnText: { color: '#D8D8E0', fontSize: 13, fontWeight: '600' },
  hint: { color: '#55555F', fontSize: 12 },
  previewRoot: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOrb: { transform: [{ scale: 1.2 }] },
});
