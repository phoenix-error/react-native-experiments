import { Pressable, Text, View } from 'react-native';

import { PhoneFrame } from './phone-frame';

export interface ShowcaseCardProps {
  icon: React.ReactNode;
  brand: string;
  badge?: string;
  title: string;
  /** Live component preview, mounted inside the phone mockup. */
  children: React.ReactNode;
  onPress?: () => void;
}

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
    <View className="mb-[34px]">
      <Pressable
        onPress={onPress}
        className="mb-4 flex-row items-center gap-3.5 px-[18px] active:opacity-[0.85]"
      >
        <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-[14px] border border-border bg-muted">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="mb-0.5" numberOfLines={1}>
            <Text className="text-base font-semibold text-foreground">
              {brand}
            </Text>
            {badge ? (
              <Text className="text-base font-semibold text-destructive">{`  ${badge}`}</Text>
            ) : null}
          </Text>
          <Text
            className="text-[23px] font-bold tracking-tight text-foreground"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onPress}
        className="mx-3.5 h-[360px] items-center overflow-hidden rounded-[30px] bg-muted pt-[22px] active:opacity-[0.85]"
      >
        <PhoneFrame>{children}</PhoneFrame>
      </Pressable>
    </View>
  );
}
