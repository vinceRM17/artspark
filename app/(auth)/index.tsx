/**
 * Home screen - Today's prompt display
 *
 * Shows the daily personalized prompt in a large artistic card
 * with botanical decorations, reference images, and action buttons.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useDailyPrompt } from '@/lib/hooks/useDailyPrompt';
import { MEDIUM_OPTIONS, COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';
import { fetchReferenceImages, ReferenceImage } from '@/lib/services/referenceImages';
import LeafCorner from '@/components/botanical/LeafCorner';
import VineDivider from '@/components/botanical/VineDivider';
import FloatingLeaves from '@/components/botanical/FloatingLeaves';

const { width: screenWidth } = Dimensions.get('window');

// Helper to look up display labels from preference IDs
function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find(o => o.id === id)?.label || id;
}

export default function Home() {
  const { prompt, loading, error, generating, generateManualPrompt } = useDailyPrompt();
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Fetch reference images when prompt changes
  useEffect(() => {
    if (prompt) {
      setImagesLoading(true);
      fetchReferenceImages(prompt.subject, prompt.medium, 3)
        .then(setReferenceImages)
        .catch(() => setReferenceImages([]))
        .finally(() => setImagesLoading(false));
    }
  }, [prompt?.id]);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <FloatingLeaves width={screenWidth} height={600} />
        <ActivityIndicator size="large" color="#7C9A72" />
        <Text className="text-gray-400 mt-4 text-sm">Preparing your prompt...</Text>
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

  // No prompt state
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
      <View className="px-6 pt-8 pb-8">
        {/* Header with botanical accent */}
        <View className="items-center mb-6">
          <Text className="text-[#7C9A72] text-center text-lg font-semibold tracking-wider">
            ArtSpark
          </Text>
          <VineDivider width={140} />
          <Text className="text-gray-400 text-center text-xs mt-1">
            {prompt.source === 'daily' ? "Today's Prompt" : 'Extra Prompt'}
          </Text>
        </View>

        {/* Main Prompt Card with leaf corners */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6 overflow-hidden">
          <LeafCorner position="topRight" size={70} opacity={0.1} />
          <LeafCorner position="bottomLeft" size={55} opacity={0.08} />

          {/* Prompt Text - the main event */}
          <Text className="text-2xl font-semibold text-gray-900 leading-relaxed pr-6">
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

        {/* Reference Images Section */}
        {(referenceImages.length > 0 || imagesLoading) && (
          <View className="mb-6">
            <Text className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Reference Inspiration
            </Text>
            {imagesLoading ? (
              <View className="h-32 justify-center items-center">
                <ActivityIndicator size="small" color="#7C9A72" />
              </View>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                >
                  {referenceImages.map((img) => (
                    <TouchableOpacity
                      key={img.id}
                      onPress={() => Linking.openURL(img.unsplashUrl)}
                      activeOpacity={0.8}
                      className="mr-3"
                    >
                      <Image
                        source={{ uri: img.url }}
                        className="rounded-xl"
                        style={{ width: 180, height: 130 }}
                        resizeMode="cover"
                      />
                      <Text className="text-[10px] text-gray-400 mt-1">
                        {img.photographer}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text className="text-[10px] text-gray-300 text-right">
                  Photos from Unsplash
                </Text>
              </>
            )}
          </View>
        )}

        {/* Vine divider before actions */}
        <VineDivider width={200} opacity={0.15} />

        {/* Action Buttons */}
        <View className="mt-4">
          {/* I made something */}
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
      </View>
    </ScrollView>
  );
}
