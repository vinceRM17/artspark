/**
 * Progress Gallery screen
 *
 * Displays a grid of all user artwork submissions with filter options.
 * Tap an image to view its prompt detail.
 */

import React, { useCallback, memo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useGallery } from '@/lib/hooks/useGallery';
import { MEDIUM_OPTIONS, SUBJECT_OPTIONS } from '@/lib/constants/preferences';
import type { GalleryItem } from '@/lib/services/gallery';

const { width: screenWidth } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_PADDING = 16;
const ITEM_WIDTH = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;

// Memoized gallery image tile
const GalleryTile = memo<{
  item: GalleryItem;
  onPress: (promptId: string) => void;
}>(
  ({ item, onPress }) => {
    const mediumLabel = MEDIUM_OPTIONS.find(m => m.id === item.medium)?.label || item.medium;

    return (
      <TouchableOpacity
        onPress={() => onPress(item.prompt_id)}
        activeOpacity={0.8}
        style={{ width: ITEM_WIDTH, marginBottom: GRID_GAP }}
      >
        <Image
          source={{ uri: item.image_url }}
          style={{
            width: ITEM_WIDTH,
            height: ITEM_WIDTH,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
        <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
          {mediumLabel}
        </Text>
        <Text className="text-[10px] text-gray-400" numberOfLines={1}>
          {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.item.id === next.item.id
);

GalleryTile.displayName = 'GalleryTile';

// Filter chip component
function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: selected ? '#7C9A72' : '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: selected ? '#FFFFFF' : '#6B7280',
          fontSize: 13,
          fontWeight: selected ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function GalleryScreen() {
  const { items, loading, error, hasMore, filters, setFilters, loadMore, refresh } = useGallery();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handlePress = useCallback((promptId: string) => {
    router.push(`/(auth)/history/${promptId}`);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: GalleryItem }) => (
      <GalleryTile item={item} onPress={handlePress} />
    ),
    [handlePress]
  );

  const toggleMediumFilter = useCallback(
    (mediumId: string) => {
      setFilters({
        ...filters,
        medium: filters.medium === mediumId ? undefined : mediumId,
      });
    },
    [filters, setFilters]
  );

  const toggleSubjectFilter = useCallback(
    (subjectId: string) => {
      setFilters({
        ...filters,
        subject: filters.subject === subjectId ? undefined : subjectId,
      });
    },
    [filters, setFilters]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const hasActiveFilters = filters.medium || filters.subject;

  // Loading state
  if (loading && items.length === 0) {
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
  if (items.length === 0 && !hasActiveFilters) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text style={{ fontSize: 48 }} className="mb-4">{'🎨'}</Text>
        <Text className="text-gray-900 text-xl font-semibold mb-2">Your gallery is empty</Text>
        <Text className="text-gray-600 text-center mb-6">
          Complete a prompt and add photos to start building your gallery.
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

  return (
    <View className="flex-1 bg-[#FFF8F0]">
      {/* Filter toggle */}
      <View className="px-4 pt-3 pb-1">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Text className="text-[#7C9A72] font-medium text-sm">
              {showFilters ? 'Hide Filters' : 'Filter'}
              {hasActiveFilters ? ' (active)' : ''}
            </Text>
          </TouchableOpacity>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-gray-400 text-sm">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      {showFilters && (
        <View className="px-4 pb-3">
          <Text className="text-xs text-gray-400 mb-2">Medium</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {MEDIUM_OPTIONS.map(m => (
              <FilterChip
                key={m.id}
                label={m.label}
                selected={filters.medium === m.id}
                onPress={() => toggleMediumFilter(m.id)}
              />
            ))}
          </ScrollView>

          <Text className="text-xs text-gray-400 mb-2">Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SUBJECT_OPTIONS.map(s => (
              <FilterChip
                key={s.id}
                label={s.label}
                selected={filters.subject === s.id}
                onPress={() => toggleSubjectFilter(s.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty filtered state */}
      {items.length === 0 && hasActiveFilters ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-600 text-center mb-4">
            No artwork matches these filters.
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text className="text-[#7C9A72] font-medium">Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: GRID_PADDING,
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
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
            <View className="px-4 pt-2 pb-3">
              <Text className="text-2xl font-bold text-gray-900">My Gallery</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'piece' : 'pieces'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && items.length > 0 ? (
              <View className="py-4">
                <ActivityIndicator color="#7C9A72" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
