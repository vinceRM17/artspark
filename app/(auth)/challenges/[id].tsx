/**
 * Challenge detail screen
 *
 * Shows challenge description, daily prompt checklist with progress,
 * and a "Complete Today" action button.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getChallengeById } from '@/lib/constants/challenges';
import { useChallenges } from '@/lib/hooks/useChallenges';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { active, loading, join, leave } = useChallenges();
  const [actionLoading, setActionLoading] = useState(false);

  const challenge = getChallengeById(id || '');
  const activeChallenge = active.find(a => a.challenge.id === id);
  const progress = activeChallenge?.progress;
  const currentDay = activeChallenge?.currentDay || 1;

  if (!challenge) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-gray-600 text-center">Challenge not found.</Text>
        <TouchableOpacity
          className="mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-[#7C9A72] font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  const isEnrolled = !!progress;
  const progressPct = progress
    ? (progress.days_completed / challenge.duration) * 100
    : 0;

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      await join(challenge.id);
    } catch {
      Alert.alert('Error', 'Could not join challenge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await leave(challenge.id);
            } catch {
              Alert.alert('Error', 'Could not leave challenge.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteToday = () => {
    // Navigate to respond flow — the response screen can call completeChallengeDay
    router.push({
      pathname: '/(auth)/respond',
      params: {
        challengeId: challenge.id,
        challengeDay: String(currentDay),
        promptText: challenge.dailyPrompts[currentDay - 1] || '',
      },
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-[#FFF8F0]"
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center mb-2">
          <Text style={{ fontSize: 32 }}>{challenge.icon}</Text>
          <View className="ml-3 flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {challenge.title}
            </Text>
            <Text className="text-sm text-gray-400">
              {challenge.duration} days
              {challenge.type === 'weekly' ? ' \u00B7 Weekly' : ' \u00B7 Monthly'}
            </Text>
          </View>
        </View>
        <Text className="text-base text-gray-600 mt-1">
          {challenge.description}
        </Text>
      </View>

      {/* Progress bar (if enrolled) */}
      {isEnrolled && (
        <View className="px-4 mb-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-400">Progress</Text>
            <Text className="text-xs text-[#7C9A72] font-medium">
              {progress!.days_completed} of {challenge.duration} days
            </Text>
          </View>
          <View className="h-3 bg-gray-100 rounded-full">
            <View
              style={{ width: `${Math.max(progressPct, 2)}%` }}
              className="h-3 bg-[#7C9A72] rounded-full"
            />
          </View>
        </View>
      )}

      {/* Action button */}
      <View className="px-4 mb-4">
        {isEnrolled ? (
          <TouchableOpacity
            onPress={handleCompleteToday}
            className="bg-[#7C9A72] rounded-xl py-3.5"
          >
            <Text className="text-white text-center font-semibold text-base">
              Complete Day {currentDay}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleJoin}
            disabled={actionLoading}
            className="bg-[#7C9A72] rounded-xl py-3.5"
            style={{ opacity: actionLoading ? 0.6 : 1 }}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Start Challenge
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Daily prompt checklist */}
      <View className="px-4">
        <Text className="text-base font-semibold text-gray-800 mb-3">
          Daily Prompts
        </Text>
        {challenge.dailyPrompts.map((prompt, index) => {
          const dayNum = index + 1;
          const dayProgress = progress?.day_data.find(d => d.day === dayNum);
          const isCompleted = dayProgress?.completed || false;
          const isCurrent = isEnrolled && dayNum === currentDay;
          const isFuture = isEnrolled && dayNum > currentDay;

          return (
            <View
              key={dayNum}
              className={`flex-row items-start p-3 mb-2 rounded-lg ${
                isCurrent
                  ? 'bg-[#F0F5EE] border border-[#7C9A72]'
                  : isCompleted
                  ? 'bg-white'
                  : 'bg-white'
              }`}
              style={{ opacity: isFuture ? 0.5 : 1 }}
            >
              {/* Checkbox indicator */}
              <View
                className={`w-6 h-6 rounded-full items-center justify-center mt-0.5 ${
                  isCompleted
                    ? 'bg-[#7C9A72]'
                    : isCurrent
                    ? 'border-2 border-[#7C9A72]'
                    : 'border border-gray-300'
                }`}
              >
                {isCompleted && (
                  <Text style={{ fontSize: 12, color: '#FFFFFF' }}>{'\u2713'}</Text>
                )}
              </View>

              {/* Prompt text */}
              <View className="ml-3 flex-1">
                <Text
                  className={`text-sm ${
                    isCompleted
                      ? 'text-gray-400 line-through'
                      : isCurrent
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  {prompt}
                </Text>
                {isCompleted && dayProgress?.completed_at && (
                  <Text className="text-xs text-gray-300 mt-1">
                    Completed{' '}
                    {new Date(dayProgress.completed_at).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </Text>
                )}
                {isCurrent && (
                  <Text className="text-xs text-[#7C9A72] font-medium mt-1">
                    Today
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Leave challenge */}
      {isEnrolled && (
        <View className="px-4 mt-6">
          <TouchableOpacity onPress={handleLeave}>
            <Text className="text-red-400 text-center text-sm">
              Leave Challenge
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
