/**
 * Bookmarks screen — saved prompts for later inspiration
 */

import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { removeBookmark } from '@/lib/services/bookmarks';
import { useTheme } from '@/lib/theme/ThemeContext';
import { MEDIUM_OPTIONS } from '@/lib/constants/preferences';
import { hapticLight } from '@/lib/utils/haptics';

function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find(o => o.id === id)?.label || id;
}

export default function BookmarksScreen() {
  const { bookmarks, loading, refresh } = useBookmarks();
  const { colors } = useTheme();

  const handleRemove = async (promptId: string) => {
    hapticLight();
    await removeBookmark(promptId);
    refresh();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </View>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>{'\uD83D\uDD16'}</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          No saved prompts yet
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
          Tap the bookmark icon on any prompt to save it for later inspiration.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookmarks}
      keyExtractor={item => item.id}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 24, marginBottom: 10 }}>
            {item.prompt_text}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                {getLabel(MEDIUM_OPTIONS, item.medium)}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {new Date(item.bookmarked_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                router.push({
                  pathname: '/(auth)/respond',
                  params: { prompt_id: item.id, prompt_text: item.prompt_text },
                });
              }}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingVertical: 10,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#FFF', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                Create Art
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRemove(item.id)}
              style={{
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
