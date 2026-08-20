import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: mod.brand }} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{mod.title}</Text>
        {mod.description ? (
          <Text style={styles.desc}>{mod.description}</Text>
        ) : null}
        <View style={styles.stage}>{mod.detail ?? mod.preview}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  body: { paddingBottom: 48 },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  desc: {
    color: '#8E8E98',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  stage: { marginTop: 12, minHeight: 560 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  missingText: { color: '#8E8E98' },
});
