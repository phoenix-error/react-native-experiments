import { Lucide } from '@react-native-vector-icons/lucide';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { Platform, Pressable } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import { THEME } from '@/lib/theme';

const ICON_SIZE = 20;

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isLight = colorScheme !== 'dark';
  const iconColor = isLight ? THEME.light.foreground : THEME.dark.foreground;

  return (
    <Pressable
      accessibilityLabel={
        isLight ? 'Switch to dark mode' : 'Switch to light mode'
      }
      accessibilityRole="button"
      className="px-2.5"
      hitSlop={12}
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        toggleColorScheme();
      }}
    >
      {isLight ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <Lucide
            accessible={false}
            color={iconColor}
            name="moon"
            size={ICON_SIZE}
          />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <Lucide
            accessible={false}
            color={iconColor}
            name="sun"
            size={ICON_SIZE}
          />
        </Animated.View>
      )}
    </Pressable>
  );
}
