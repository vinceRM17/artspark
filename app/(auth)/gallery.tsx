/**
 * Progress Gallery screen
 *
 * Displays a grid of all user artwork submissions with filter options.
 * Includes calendar heatmap showing activity over the last 90 days.
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
import { useActivityDates } from '@/lib/hooks/useActivityDates';
import { MEDIUM_OPTIONS, SUBJECT_OPTIONS } from '@/lib/constants/preferences';
import { useTheme } from '@/lib/theme/ThemeContext';
import CalendarHeatmap from '@/components/activity/CalendarHeatmap';
import ShareModal from '@/components/share/ShareModal';
import type { GalleryItem } from '@/lib/services/gallery';

const { width: screenWidth } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_PADDING = 16;
const ITEM_WIDTH = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;

// Memoized gallery image tile
const GalleryTile = memo<{
  item: GalleryItem;
  onPress: (promptId: string) => void;
  onShare: (item: GalleryItem) => void;
  colors: any;
}>(
  ({ item, onPress, onShare, colors }) => {
    const mediumLabel = MEDIUM_OPTIONS.find(m => m.id === item.medium)?.label || item.medium;

    return (
      <TouchableOpacity
        onPress={() => onPress(item.prompt_id)}
        onLongPress={() => onShare(item)}
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
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
          {mediumLabel}
        </Text>
        <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
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
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: selected ? colors.primary : colors.inputBg,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: selected ? '#FFFFFF' : colors.textSecondary,
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
  const { dates: activityDates, loading: activityLoading } = useActivityDates();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [shareItem, setShareItem] = useState<GalleryItem | null>(null);

  const handlePress = useCallback((promptId: string) => {
    router.push(`/(auth)/history/${promptId}`);
  }, []);

  const handleShare = useCallback((item: GalleryItem) => {
    setShareItem(item);
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
      <GalleryTile item={item} onPress={handlePress} onShare={handleShare} colors={colors} />
    ),
    [handlePress, handleShare, colors]
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
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          onPress={handleRefresh}
        >
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (items.length === 0 && !hasActiveFilters) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDFA8'}</Text>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600', marginBottom: 8 }}>Your gallery is empty</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Complete a prompt and add photos to start building your gallery.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          onPress={() => router.push('/(auth)')}
        >
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>Go to Today's Prompt</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filter toggle */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Text style={{ color: colors.primary, fontWeight: '500', fontSize: 14 }}>
              {showFilters ? 'Hide Filters' : 'Filter'}
              {hasActiveFilters ? ' (active)' : ''}
            </Text>
          </TouchableOpacity>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      {showFilters && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>Medium</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {MEDIUM_OPTIONS.map(m => (
              <FilterChip
                key={m.id}
                label={m.label}
                selected={filters.medium === m.id}
                onPress={() => toggleMediumFilter(m.id)}
                colors={colors}
              />
            ))}
          </ScrollView>

          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SUBJECT_OPTIONS.map(s => (
              <FilterChip
                key={s.id}
                label={s.label}
                selected={filters.subject === s.id}
                onPress={() => toggleSubjectFilter(s.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty filtered state */}
      {items.length === 0 && hasActiveFilters ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            No artwork matches these filters.
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={{ color: colors.primary, fontWeight: '500' }}>Clear Filters</Text>
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
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>My Gallery</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                {items.length} {items.length === 1 ? 'piece' : 'pieces'}
              </Text>

              {/* Calendar Heatmap */}
              {!activityLoading && activityDates.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <CalendarHeatmap activityDates={activityDates} />
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            loading && items.length > 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Share Modal */}
      {shareItem && (
        <ShareModal
          visible={!!shareItem}
          onClose={() => setShareItem(null)}
          promptText={shareItem.prompt_text}
          imageUri={shareItem.image_url}
        />
      )}
    </View>
  );
}
