import { Stack } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Experiment } from '@/experiments/shared/lib/experiment';

import { OrbToastStack } from '../components/orb-toast-stack';
import { ParticleOrb } from '../components/particle-orb';
import { useOrbToasts } from '../hooks/use-orb-toasts';
import { ORB_ORDER, orbCellLabel } from '../lib/orb-states';

function FeedPreview() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <View className="scale-[1.2]">
        <ParticleOrb size={64} state="composing" />
      </View>
    </View>
  );
}

export const experiment: Experiment = {
  badge: 'new drop',
  brand: 'Thinking orbs',
  href: '/thinking-orbs',
  icon: <ParticleOrb size={38} state="composing" />,
  preview: <FeedPreview />,
  slug: 'thinking-orbs',
  title: 'Toast stack that morphs into a sheet',
};

export default function ThinkingOrbsScreen() {
  const { toasts, expandedId, push, clear, expand, collapse } = useOrbToasts();

  return (
    <View className="flex-1 bg-neutral-950">
      <Stack.Screen options={{ title: 'Thinking orbs' }} />
      <ScrollView
        contentContainerClassName="p-[18px] pb-[200px]"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3.5 text-xs font-bold uppercase tracking-[1.2px] text-neutral-400">
          Push a toast
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {ORB_ORDER.map(state => (
            <Pressable
              accessibilityLabel={`Push ${orbCellLabel(state)} toast`}
              accessibilityRole="button"
              className="w-24 items-center rounded-2xl border border-neutral-800 bg-neutral-900 py-3 active:opacity-70"
              key={state}
              onPress={() => push(state)}
            >
              <ParticleOrb size={38} state={state} />
              <Text
                className="mt-1 text-[10px] font-semibold text-neutral-400"
                numberOfLines={1}
              >
                {orbCellLabel(state)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-[22px] gap-3">
          <Pressable
            accessibilityLabel="Clear toasts"
            accessibilityRole="button"
            className="self-start rounded-full border border-neutral-800 bg-neutral-900 px-[18px] py-[9px] active:opacity-70"
            onPress={clear}
          >
            <Text className="text-[13px] font-semibold text-neutral-200">
              Clear
            </Text>
          </Pressable>
          <Text className="text-xs text-neutral-600">
            tap a toast to open · tap outside to close
          </Text>
        </View>
      </ScrollView>

      <OrbToastStack
        expandedId={expandedId}
        onCollapse={collapse}
        onExpand={expand}
        toasts={toasts}
      />
    </View>
  );
}
