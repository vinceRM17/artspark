/**
 * Badges screen
 *
 * Shows all achievement badges with locked/unlocked status.
 */

import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useBadges } from '@/lib/hooks/useBadges';
import BadgeGrid from '@/components/badges/BadgeGrid';
import type { BadgeCategory } from '@/lib/constants/badges';

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  milestone: 'Milestones',
  streak: 'Streaks',
  exploration: 'Exploration',
};

const CATEGORY_ORDER: BadgeCategory[] = [
  'milestone',
  'streak',
  'exploration',
];

export default function BadgesScreen() {
  const { badges, unlockedCount, totalCount, loading } = useBadges();

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#FFF8F0]"
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Achievements</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {unlockedCount} of {totalCount} unlocked
        </Text>

        {/* Progress bar */}
        <View className="mt-3 h-2 bg-gray-200 rounded-full">
          <View
            style={{
              width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%`,
            }}
            className="h-2 bg-[#7C9A72] rounded-full"
          />
        </View>
      </View>

      {/* Badges by category */}
      {CATEGORY_ORDER.map((category) => {
        const categoryBadges = badges.filter(
          (b) => b.badge.category === category
        );
        if (categoryBadges.length === 0) return null;

        return (
          <View key={category} className="mb-6">
            <Text className="px-4 text-xs uppercase tracking-wider text-gray-400 mb-3">
              {CATEGORY_LABELS[category]}
            </Text>
            <BadgeGrid badges={categoryBadges} />
          </View>
        );
      })}
    </ScrollView>
  );
}
