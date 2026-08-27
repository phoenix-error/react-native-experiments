import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

import type { Experiment } from '@/experiments/shared/lib/experiment';

import { StubMark } from '../components/stub-mark';
import { useStubCopy } from '../hooks/use-stub-copy';

export const experiment: Experiment = {
  badge: 'template',
  brand: 'Stub',
  href: '/stub',
  icon: <StubMark size="icon" />,
  preview: (
    <View className="flex-1 items-center justify-center bg-neutral-950">
      <StubMark size="preview" />
    </View>
  ),
  slug: 'stub',
  title: 'A closed experiment',
};

export default function StubScreen() {
  const copy = useStubCopy();

  return (
    <View className="flex-1 items-center justify-center gap-5 bg-background px-8">
      <Stack.Screen options={{ title: copy.brand }} />
      <StubMark size="screen" />
      <Text className="text-center text-[23px] font-bold tracking-tight text-foreground">
        {copy.headline}
      </Text>
      <Text className="text-center text-[15px] leading-6 text-muted-foreground">
        {copy.body}
      </Text>
    </View>
  );
}
