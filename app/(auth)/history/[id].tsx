/**
 * Prompt detail screen
 *
 * Shows full prompt details including medium, color, twist, and all linked responses with images.
 * Offers "Respond Now" button for uncompleted prompts.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getPromptById } from '@/lib/services/prompts';
import { getResponsesForPromptWithImages } from '@/lib/services/responses';
import { useSession } from '@/components/auth/SessionProvider';
import { PromptWithStatus } from '@/lib/schemas/prompts';
import { Response } from '@/lib/schemas/response';
import { MEDIUM_OPTIONS, COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';

// Helper to look up display labels from preference IDs
function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find((o) => o.id === id)?.label || id;
}

export default function PromptDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { session } = useSession();
  const userId = session?.user?.id;

  const [prompt, setPrompt] = useState<PromptWithStatus | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Dev mode fallback
      if (!userId && __DEV__) {
        setPrompt({
          id: 'dev-prompt-1',
          user_id: 'dev',
          date_key: new Date().toISOString().split('T')[0],
          source: 'daily',
          medium: 'watercolor',
          subject: 'botanicals',
          color_rule: 'earthy',
          twist: 'Focus on texture over detail',
          prompt_text: 'Create a watercolor piece featuring botanicals with earthy colors. Focus on texture over detail.',
          created_at: new Date().toISOString(),
          response_count: 1,
          is_completed: true,
        });
        setResponses([
          {
            id: 'dev-response-1',
            user_id: 'dev',
            prompt_id: 'dev-prompt-1',
            image_urls: [
              'https://via.placeholder.com/400x400.png?text=Sample+Image+1',
              'https://via.placeholder.com/400x400.png?text=Sample+Image+2',
            ],
            notes: 'Sample response notes for development',
            tags: ['dev', 'sample'],
            created_at: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [promptData, responsesData] = await Promise.all([
          getPromptById(userId, id),
          getResponsesForPromptWithImages(userId, id),
        ]);

        if (!promptData) {
          setError('Prompt not found');
          setLoading(false);
          return;
        }

        setPrompt(promptData);
        setResponses(responsesData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompt details');
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, id]);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  // Error state
  if (error || !prompt) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-red-600 text-center mb-4">{error || 'Prompt not found'}</Text>
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-3 px-6"
          onPress={() => router.back()}
        >
          <Text className="text-white text-center font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format date: "January 15, 2026"
  const formattedDate = new Date(prompt.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const mediumLabel = getLabel(MEDIUM_OPTIONS, prompt.medium);
  const colorLabel = prompt.color_rule ? getLabel(COLOR_PALETTE_OPTIONS, prompt.color_rule) : null;

  return (
    <ScrollView className="flex-1 bg-[#FFF8F0]">
      <View className="px-6 pt-6 pb-8">
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-[#7C9A72] text-base">← Back to History</Text>
        </TouchableOpacity>

        {/* Date display */}
        <Text className="text-gray-500 text-sm mb-2">{formattedDate}</Text>

        {/* Source badge */}
        <View className="mb-4">
          <View className="bg-gray-100 rounded-full px-3 py-1 self-start">
            <Text className="text-gray-600 text-xs font-medium">
              {prompt.source === 'daily' ? 'Daily Prompt' : 'Extra Prompt'}
            </Text>
          </View>
        </View>

        {/* Main prompt card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          {/* Prompt text */}
          <Text className="text-xl font-semibold text-gray-900 leading-relaxed mb-4">
            {prompt.prompt_text}
          </Text>

          {/* Details section */}
          <View className="pt-4 border-t border-gray-100">
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

          {/* Completion status */}
          <View className="pt-4 border-t border-gray-100 mt-4">
            {prompt.is_completed ? (
              <View className="bg-[#7C9A72]/10 rounded-full px-3 py-2 self-start">
                <Text className="text-[#7C9A72] text-sm font-medium">Completed</Text>
              </View>
            ) : (
              <View className="bg-gray-100 rounded-full px-3 py-2 self-start">
                <Text className="text-gray-500 text-sm font-medium">Not yet responded</Text>
              </View>
            )}
          </View>
        </View>

        {/* Responses section */}
        {responses.length > 0 ? (
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-3 px-0">Your Responses</Text>

            {responses.map((response) => {
              const responseDate = new Date(response.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <View key={response.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  {/* Images */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                  >
                    {response.image_urls.map((url, index) => (
                      <Image
                        key={index}
                        source={{ uri: url }}
                        className="w-48 h-48 rounded-xl mr-3"
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>

                  {/* Notes */}
                  {response.notes && (
                    <Text className="text-gray-600 italic mb-3">{response.notes}</Text>
                  )}

                  {/* Tags */}
                  {response.tags && response.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {response.tags.map((tag, index) => (
                        <View
                          key={index}
                          className="bg-[#7C9A72]/10 rounded-full px-3 py-1"
                        >
                          <Text className="text-[#7C9A72] text-xs">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Date */}
                  <Text className="text-gray-400 text-xs">{responseDate}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          // No responses state
          !prompt.is_completed && (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-gray-600 text-center mb-4">
                You haven't responded to this prompt yet
              </Text>
              <TouchableOpacity
                className="bg-[#7C9A72] rounded-xl py-3 px-6"
                onPress={() => {
                  router.push({
                    pathname: '/(auth)/respond',
                    params: {
                      prompt_id: prompt.id,
                      prompt_text: prompt.prompt_text,
                    },
                  });
                }}
              >
                <Text className="text-white text-center font-semibold">Respond Now</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
}
