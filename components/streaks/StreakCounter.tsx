/**
 * Streak counter badge for home screen
 *
 * Shows current streak with flame icon and longest streak.
 * Highlights milestone achievements with slide-down animation.
 * Streak number counts up from 0 on mount.
 */

import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  useDerivedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { hapticSuccess } from '@/lib/utils/haptics';
import type { StreakData } from '@/lib/services/streaks';

const MILESTONES = [7, 14, 30, 60, 100];

type StreakCounterProps = {
  streak: StreakData;
};

function getMilestoneMessage(days: number): string | null {
  if (days >= 100) return '100 days! Legendary artist!';
  if (days >= 60) return '60 days! Incredible dedication!';
  if (days >= 30) return '30 days! A month of creating!';
  if (days >= 14) return '14 days! Two weeks strong!';
  if (days >= 7) return '7 days! One week streak!';
  return null;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  const { currentStreak, longestStreak } = streak;
  const milestone = getMilestoneMessage(currentStreak);
  const isOnFire = currentStreak >= 3;

  // Animated streak number
  const animatedStreak = useSharedValue(0);
  const displayStreak = useDerivedValue(() =>
    Math.round(animatedStreak.value)
  );

  // Milestone slide-in
  const milestoneOpacity = useSharedValue(0);
  const milestoneTranslateY = useSharedValue(-20);

  useEffect(() => {
    // Count up animation
    animatedStreak.value = withTiming(currentStreak, { duration: 800 });

    // Milestone slide-in
    if (milestone) {
      milestoneOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
      milestoneTranslateY.value = withDelay(
        600,
        withSpring(0, { damping: 14 })
      );

      // Haptic on milestone
      if (MILESTONES.includes(currentStreak)) {
        setTimeout(() => hapticSuccess(), 700);
      }
    }
  }, [currentStreak]);

  const milestoneStyle = useAnimatedStyle(() => ({
    opacity: milestoneOpacity.value,
    transform: [{ translateY: milestoneTranslateY.value }],
  }));

  return (
    <View
      className="bg-white rounded-xl p-4 mb-4 shadow-sm"
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${currentStreak} day streak. Longest streak: ${streak.longestStreak} days`}
    >
      <View className="flex-row items-center justify-between">
        {/* Current streak */}
        <View className="flex-row items-center">
          <Text style={{ fontSize: 28 }}>
            {currentStreak > 0 ? (isOnFire ? '\uD83D\uDD25' : '\u2728') : '\uD83C\uDFA8'}
          </Text>
          <View className="ml-3">
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-gray-900">
                {currentStreak}
              </Text>
              <Text className="text-sm text-gray-500 ml-1">
                {currentStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              Current streak
            </Text>
          </View>
        </View>

        {/* Longest streak */}
        <View className="items-end">
          <Text className="text-lg font-semibold text-[#7C9A72]">
            {longestStreak}
          </Text>
          <Text className="text-xs text-gray-400">
            Best streak
          </Text>
        </View>
      </View>

      {/* Milestone callout with slide-in animation */}
      {milestone && (
        <Animated.View
          style={milestoneStyle}
          className="mt-3 bg-[#F0F5EE] rounded-lg py-2 px-3"
        >
          <Text className="text-sm text-[#5A7A50] text-center font-medium">
            {milestone}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
