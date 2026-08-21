import { useLocalSearchParams, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getModule } from '@/modules/registry';

export default function ModuleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mod = getModule(id);

  if (!mod) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Unknown module “{id}”.</Text>
      </View>
    );
  }

  // The detail view owns the whole screen: it scrolls its own content and
  // renders overlays (toasts, sheets) on top, so it must NOT be wrapped in
  // another ScrollView here.
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: mod.brand }} />
      {mod.detail ?? mod.preview}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0D' },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0D',
  },
  missingText: { color: '#8E8E98' },
});
