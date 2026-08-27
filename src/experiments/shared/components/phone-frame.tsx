import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

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
    <View
      className="h-[420px] w-[232px] overflow-hidden rounded-[40px] border-[5px] border-neutral-900 bg-neutral-950 pt-3"
      style={[
        {
          boxShadow: '0px 14px 22px rgba(0,0,0,0.3)',
        },
        style,
      ]}
    >
      <View className="mb-1.5 h-[21px] w-[74px] self-center rounded-[11px] bg-black" />
      <View className="flex-1 overflow-hidden">{children}</View>
    </View>
  );
}
