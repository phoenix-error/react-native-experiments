import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ShowcaseCard } from '@/components/showcase-card';
import { MODULES } from '@/modules/registry';

export function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const count = MODULES.length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>
          <Text style={styles.headerCount}>{count}</Text>
          {count === 1 ? ' awesome animation' : ' awesome animations'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.feed,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {MODULES.map((m) => (
          <ShowcaseCard
            key={m.id}
            icon={m.icon}
            brand={m.brand}
            badge={m.badge}
            title={m.title}
            onPress={() => router.push(`/module/${m.id}`)}
          >
            {m.preview}
          </ShowcaseCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1C1C20',
  },
  headerTitle: { color: '#8E8E98', fontSize: 17, fontWeight: '500' },
  headerCount: { color: '#FFFFFF', fontWeight: '700' },
  feed: { paddingTop: 24 },
});
