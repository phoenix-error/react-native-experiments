import { Text, View } from 'react-native';

type StubMarkSize = 'icon' | 'preview' | 'screen';

const SIZE_CLASS = {
  icon: 'h-8 w-8 rounded-lg',
  preview: 'h-24 w-24 rounded-[28px]',
  screen: 'h-32 w-32 rounded-[36px]',
} as const;

/**
 * Simple geometric mark used as the card icon, live preview, and screen hero.
 */
export function StubMark({ size }: { size: StubMarkSize }) {
  return (
    <View
      className={`items-center justify-center bg-blue-500 ${SIZE_CLASS[size]}`}
    >
      <Text
        className={
          size === 'icon'
            ? 'text-sm font-bold text-white'
            : 'text-2xl font-bold text-white'
        }
      >
        S
      </Text>
    </View>
  );
}
