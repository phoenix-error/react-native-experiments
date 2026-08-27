/**
 * Shared non-color constants. Colors come from Tailwind via NativeWind
 * (`bg-white dark:bg-black`, `text-neutral-500`, …).
 */

import { Platform } from 'react-native';

export const Fonts = Platform.select({
  default: {
    mono: 'monospace',
    rounded: 'normal',
    sans: 'normal',
    serif: 'serif',
  },
  ios: {
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
  },
  web: {
    mono: 'var(--font-mono)',
    rounded: 'var(--font-rounded)',
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
  },
});

export const Spacing = {
  five: 32,
  four: 24,
  half: 2,
  one: 4,
  six: 64,
  three: 16,
  two: 8,
} as const;

export const BottomTabInset = Platform.select({ android: 80, ios: 50 }) ?? 0;
export const MaxContentWidth = 800;
