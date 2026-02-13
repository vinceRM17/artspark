/**
 * History list screen
 *
 * Displays scrollable list of past prompts with completion status,
 * infinite scroll pagination, and pull-to-refresh.
 */

import React, { useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { usePromptHistory } from '@/lib/hooks/usePromptHistory';
import { PromptWithStatus } from '@/lib/schemas/prompts';

// Memoized prompt list item component for performance
const PromptListItem = memo<{
  prompt: PromptWithStatus;
  onPress: (id: string) => void;
}>(
  ({ prompt, onPress }) => {
    // Format date: "Jan 15, 2026"
    const formattedDate = new Date(prompt.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        onPress={() => onPress(prompt.id)}
        className="bg-white rounded-xl p-4 mb-3 mx-6 shadow-sm"
      >
        {/* Prompt text - truncated to 2 lines */}
        <Text
          className="text-base font-semibold text-gray-900 mb-2"
          numberOfLines={2}
        >
          {prompt.prompt_text}
        </Text>

        {/* Bottom row: date + completion badge */}
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-500">{formattedDate}</Text>

          {/* Completion badge */}
          {prompt.is_completed ? (
            <View className="bg-[#7C9A72]/10 rounded-full px-3 py-1">
              <Text className="text-[#7C9A72] text-xs font-medium">Completed</Text>
            </View>
          ) : (
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-gray-500 text-xs font-medium">Not yet</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.prompt.id === next.prompt.id && prev.prompt.is_completed === next.prompt.is_completed
);

PromptListItem.displayName = 'PromptListItem';

export default function HistoryScreen() {
  const { prompts, loading, error, hasMore, loadMore, refresh } = usePromptHistory();
  const [refreshing, setRefreshing] = React.useState(false);

  // Handle press navigation
  const handlePress = useCallback((id: string) => {
    router.push(`/(auth)/history/${id}`);
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle load more with guard
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Render item callback
  const renderItem = useCallback(
    ({ item }: { item: PromptWithStatus }) => (
      <PromptListItem prompt={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  // Loading state (initial load)
  if (loading && prompts.length === 0) {
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
          onPress={handleRefresh}
        >
          <Text className="text-white text-center font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (prompts.length === 0) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-gray-900 text-xl font-semibold mb-2">No prompts yet</Text>
        <Text className="text-gray-600 text-center mb-6">
          Start creating art to build your history
        </Text>
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-3 px-6"
          onPress={() => router.push('/(auth)')}
        >
          <Text className="text-white text-center font-semibold">Go to Today's Prompt</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Success state - FlatList with prompts
  return (
    <FlatList
      data={prompts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={5}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#7C9A72"
        />
      }
      ListHeaderComponent={
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900 px-6">Your History</Text>
        </View>
      }
      ListFooterComponent={
        loading && prompts.length > 0 ? (
          <View className="py-4">
            <ActivityIndicator color="#7C9A72" />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 20, backgroundColor: '#FFF8F0' }}
      className="flex-1 bg-[#FFF8F0]"
    />
  );
}
