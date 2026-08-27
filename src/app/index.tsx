import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';

import { EXPERIMENTS } from '@/experiments/catalog';
import { ShowcaseCard } from '@/experiments/shared/components/showcase-card';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pt-6 pb-safe"
      showsVerticalScrollIndicator={false}
    >
      {EXPERIMENTS.map(experiment => (
        <ShowcaseCard
          key={experiment.slug}
          icon={experiment.icon}
          brand={experiment.brand}
          badge={experiment.badge}
          title={experiment.title}
          onPress={() => router.push(experiment.href)}
        >
          {experiment.preview}
        </ShowcaseCard>
      ))}
    </ScrollView>
  );
}
