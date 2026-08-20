import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PhoneFrame } from './phone-frame';

export type ShowcaseCardProps = {
  icon: React.ReactNode;
  brand: string;
  badge?: string;
  title: string;
  /** Live component preview, mounted inside the phone mockup. */
  children: React.ReactNode;
  onPress?: () => void;
};

/**
 * One entry in the home feed: an app-icon + label header, then a cream panel
 * holding a phone mockup that runs the component live.
 */
export function ShowcaseCard({
  icon,
  brand,
  badge,
  title,
  children,
  onPress,
}: ShowcaseCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.headerText}>
          <Text style={styles.brandRow} numberOfLines={1}>
            <Text style={styles.brand}>{brand}</Text>
            {badge ? <Text style={styles.badge}>{`  ${badge}`}</Text> : null}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.panel, pressed && styles.pressed]}
      >
        <PhoneFrame>{children}</PhoneFrame>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 34 },
  pressed: { opacity: 0.85 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#101014',
    borderWidth: 1,
    borderColor: '#232329',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerText: { flex: 1 },
  brandRow: { marginBottom: 2 },
  brand: { color: '#F2F2F5', fontSize: 16, fontWeight: '600' },
  badge: { color: '#FF4D4D', fontSize: 16, fontWeight: '600' },
  title: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  panel: {
    marginHorizontal: 14,
    height: 360,
    borderRadius: 30,
    backgroundColor: '#F4F1E8',
    alignItems: 'center',
    paddingTop: 22,
    overflow: 'hidden',
  },
});
