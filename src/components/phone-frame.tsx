import { StyleSheet, View, type ViewStyle } from 'react-native';

export const PHONE_W = 232;
export const PHONE_H = 420;

/**
 * A cropped iPhone mockup. The device is taller than the panel that holds it,
 * so it bleeds off the bottom edge — same framing as the reference feed.
 */
export function PhoneFrame({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.phone, style]}>
      <View style={styles.notch} />
      <View style={styles.screen}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 40,
    backgroundColor: '#0A0A0C',
    borderWidth: 5,
    borderColor: '#161619',
    overflow: 'hidden',
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 10,
  },
  notch: {
    alignSelf: 'center',
    width: 74,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#000',
    marginBottom: 6,
  },
  screen: { flex: 1, overflow: 'hidden' },
});
