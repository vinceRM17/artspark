/**
 * Challenge card for home screen
 *
 * Compact card showing active challenge name, progress bar,
 * current day indicator, and today's prompt preview.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { ActiveChallenge } from '@/lib/services/challenges';

type ChallengeCardProps = {
  activeChallenge: ActiveChallenge;
};

export default function ChallengeCard({ activeChallenge }: ChallengeCardProps) {
  const { challenge, progress, currentDay } = activeChallenge;
  const progressPct = (progress.days_completed / challenge.duration) * 100;
  const todayPrompt = challenge.dailyPrompts[currentDay - 1] || '';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(auth)/challenges/${challenge.id}`)}
      activeOpacity={0.8}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm"
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Text style={{ fontSize: 20 }}>{challenge.icon}</Text>
          <Text className="text-base font-semibold text-gray-900 ml-2" numberOfLines={1}>
            {challenge.title}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          Day {currentDay} of {challenge.duration}
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-gray-100 rounded-full mb-3">
        <View
          style={{ width: `${Math.max(progressPct, 2)}%` }}
          className="h-2 bg-[#7C9A72] rounded-full"
        />
      </View>

      {/* Today's prompt preview */}
      <Text className="text-sm text-gray-600" numberOfLines={2}>
        {todayPrompt}
      </Text>

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-[#7C9A72] font-medium">
          {progress.days_completed} of {challenge.duration} completed
        </Text>
        <Text className="text-xs text-[#7C9A72] font-medium">
          View Details
        </Text>
      </View>
    </TouchableOpacity>
  );
}
