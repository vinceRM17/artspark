/**
 * Home screen - Today's prompt display
 *
 * Shows the daily personalized prompt in a large artistic card
 * with "I made something" and "Generate Now" action buttons.
 */

import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useDailyPrompt } from '@/lib/hooks/useDailyPrompt';
import { MEDIUM_OPTIONS, COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';

// Helper to look up display labels from preference IDs
function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find(o => o.id === id)?.label || id;
}

export default function Home() {
  const { prompt, loading, error, generating, generateManualPrompt } = useDailyPrompt();

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-3 px-6"
          onPress={() => router.replace('/(auth)')}
        >
          <Text className="text-white text-center font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No prompt state (shouldn't happen if loading completes)
  if (!prompt) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-gray-600 text-center">No prompt available</Text>
      </View>
    );
  }

  // Success state - show prompt card
  const mediumLabel = getLabel(MEDIUM_OPTIONS, prompt.medium);
  const colorLabel = prompt.color_rule ? getLabel(COLOR_PALETTE_OPTIONS, prompt.color_rule) : null;

  return (
    <ScrollView className="flex-1 bg-[#FFF8F0]">
      <View className="px-6 pt-12 pb-8">
        {/* Header */}
        <Text className="text-[#7C9A72] text-center text-sm mb-2">ArtSpark</Text>
        <Text className="text-gray-500 text-center text-xs mb-6">
          {prompt.source === 'daily' ? "Today's Prompt" : 'Extra Prompt'}
        </Text>

        {/* Main Prompt Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          {/* Prompt Text - the main event */}
          <Text className="text-2xl font-semibold text-gray-900 leading-relaxed">
            {prompt.prompt_text}
          </Text>

          {/* Details Section */}
          <View className="mt-4 pt-4 border-t border-gray-100">
            {/* Medium */}
            <View className="mb-3">
              <Text className="text-xs text-gray-400 mb-1">Medium</Text>
              <Text className="text-sm text-gray-700">{mediumLabel}</Text>
            </View>

            {/* Color Rule (if present) */}
            {colorLabel && (
              <View className="mb-3">
                <Text className="text-xs text-gray-400 mb-1">Colors</Text>
                <Text className="text-sm text-gray-700">{colorLabel}</Text>
              </View>
            )}

            {/* Twist (if present) */}
            {prompt.twist && (
              <View>
                <Text className="text-xs text-gray-400 mb-1">Twist</Text>
                <Text className="text-sm text-[#7C9A72] italic">{prompt.twist}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {/* I made something - Navigate to response screen */}
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-4 mb-3"
          onPress={() => {
            if (prompt) {
              router.push({
                pathname: '/(auth)/respond',
                params: { prompt_id: prompt.id, prompt_text: prompt.prompt_text }
              });
            }
          }}
        >
          <Text className="text-white text-center text-lg font-semibold">
            I made something
          </Text>
        </TouchableOpacity>

        {/* Generate Now */}
        <TouchableOpacity
          className="bg-white border-2 border-[#7C9A72] rounded-xl py-4"
          onPress={generateManualPrompt}
          disabled={generating}
        >
          <Text className="text-[#7C9A72] text-center text-lg font-semibold">
            {generating ? 'Generating...' : 'Generate Now'}
          </Text>
        </TouchableOpacity>

        {/* View History */}
        <TouchableOpacity
          className="bg-white border-2 border-gray-300 rounded-xl py-4 mt-3"
          onPress={() => router.push('/(auth)/history')}
        >
          <Text className="text-gray-700 text-center text-lg font-semibold">
            View History
          </Text>
        </TouchableOpacity>

        {/* Settings Link */}
        <TouchableOpacity
          className="mt-8"
          onPress={() => router.push('/(auth)/settings')}
        >
          <Text className="text-gray-400 text-center text-sm underline">
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
