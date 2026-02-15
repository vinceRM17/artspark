/**
 * Challenges list screen
 *
 * Shows available and active challenges with progress indicators.
 * Users can join new challenges or view active ones.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useChallenges } from '@/lib/hooks/useChallenges';
import type { ChallengeDefinition } from '@/lib/constants/challenges';

export default function ChallengesScreen() {
  const { challenges, active, loading, error, join, refresh } = useChallenges();
  const [joining, setJoining] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeIds = new Set(active.map(a => a.challenge.id));

  const handleJoin = useCallback(
    async (challengeId: string) => {
      Alert.alert(
        'Join Challenge',
        'Are you ready to start this challenge? You can leave at any time.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: async () => {
              try {
                setJoining(challengeId);
                await join(challengeId);
                router.push(`/(auth)/challenges/${challengeId}`);
              } catch {
                Alert.alert('Error', 'Could not join challenge. Please try again.');
              } finally {
                setJoining(null);
              }
            },
          },
        ]
      );
    },
    [join]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const weeklyChallenges = challenges.filter(c => c.type === 'weekly');
  const monthlyChallenges = challenges.filter(c => c.type === 'monthly');

  if (loading && active.length === 0) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-3 px-6"
          onPress={handleRefresh}
        >
          <Text className="text-white text-center font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#FFF8F0]"
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#7C9A72"
        />
      }
    >
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Challenges</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Push your skills with themed multi-day challenges
        </Text>
      </View>

      {/* Active challenges */}
      {active.length > 0 && (
        <View className="px-4 mt-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">Active</Text>
          {active.map(ac => (
            <TouchableOpacity
              key={ac.challenge.id}
              onPress={() => router.push(`/(auth)/challenges/${ac.challenge.id}`)}
              activeOpacity={0.8}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-center mb-2">
                <Text style={{ fontSize: 22 }}>{ac.challenge.icon}</Text>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {ac.challenge.title}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    Day {ac.currentDay} of {ac.challenge.duration}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-[#7C9A72]">
                  {ac.progress.days_completed}/{ac.challenge.duration}
                </Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full">
                <View
                  style={{
                    width: `${Math.max(
                      (ac.progress.days_completed / ac.challenge.duration) * 100,
                      2
                    )}%`,
                  }}
                  className="h-2 bg-[#7C9A72] rounded-full"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Weekly challenges */}
      <View className="px-4 mt-6">
        <Text className="text-base font-semibold text-gray-800 mb-3">
          Weekly Challenges
        </Text>
        {weeklyChallenges.map(c => (
          <ChallengeListItem
            key={c.id}
            challenge={c}
            isActive={activeIds.has(c.id)}
            isJoining={joining === c.id}
            onJoin={handleJoin}
            onView={() => router.push(`/(auth)/challenges/${c.id}`)}
          />
        ))}
      </View>

      {/* Monthly challenges */}
      <View className="px-4 mt-6">
        <Text className="text-base font-semibold text-gray-800 mb-3">
          Monthly Challenges
        </Text>
        {monthlyChallenges.map(c => (
          <ChallengeListItem
            key={c.id}
            challenge={c}
            isActive={activeIds.has(c.id)}
            isJoining={joining === c.id}
            onJoin={handleJoin}
            onView={() => router.push(`/(auth)/challenges/${c.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ChallengeListItem({
  challenge,
  isActive,
  isJoining,
  onJoin,
  onView,
}: {
  challenge: ChallengeDefinition;
  isActive: boolean;
  isJoining: boolean;
  onJoin: (id: string) => void;
  onView: () => void;
}) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start">
        <Text style={{ fontSize: 28 }}>{challenge.icon}</Text>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {challenge.title}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {challenge.duration} days
            {challenge.medium ? ` \u00B7 ${challenge.medium}` : ''}
            {challenge.subject ? ` \u00B7 ${challenge.subject}` : ''}
          </Text>
          <Text className="text-sm text-gray-600 mt-2" numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        {isActive ? (
          <TouchableOpacity
            onPress={onView}
            className="bg-[#F0F5EE] rounded-lg py-2.5"
          >
            <Text className="text-[#5A7A50] text-center font-semibold text-sm">
              Continue
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onJoin(challenge.id)}
            disabled={isJoining}
            className="bg-[#7C9A72] rounded-lg py-2.5"
            style={{ opacity: isJoining ? 0.6 : 1 }}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-center font-semibold text-sm">
                Start Challenge
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
