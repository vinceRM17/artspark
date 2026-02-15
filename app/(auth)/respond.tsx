/**
 * Response creation screen
 *
 * Allows users to photograph their artwork, add notes and tags, and submit responses.
 * Supports offline queueing and branded share cards for completed responses.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useImagePicker } from '@/lib/hooks/useImagePicker';
import { useResponseUpload } from '@/lib/hooks/useResponseUpload';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { invalidateHistoryCache } from '@/lib/hooks/usePromptHistory';
import { useTheme } from '@/lib/theme/ThemeContext';
import { hapticMedium, hapticSuccess } from '@/lib/utils/haptics';
import ShareModal from '@/components/share/ShareModal';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function Respond() {
  const params = useLocalSearchParams();
  const promptId = (params.prompt_id as string) || (__DEV__ ? 'dev-prompt-id' : '');
  const promptText = (params.prompt_text as string) || 'Your creative prompt';

  const { images, pickFromLibrary, pickFromCamera, removeImage } = useImagePicker();
  const { submitResponse, uploading, queueLength } = useResponseUpload();
  const { isConnected } = useNetworkStatus();
  const { colors } = useTheme();
  const { track } = useAnalytics();

  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [shareVisible, setShareVisible] = useState(false);
  const [shareImageUri, setShareImageUri] = useState('');
  const [showAndroidSheet, setShowAndroidSheet] = useState(false);

  // Unified photo picker via native action sheet
  const handleAddPhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) pickFromCamera();
          else if (buttonIndex === 1) pickFromLibrary();
        }
      );
    } else {
      setShowAndroidSheet(true);
    }
  };

  // Parse tags from comma-separated input
  const handleTagInputChange = (text: string) => {
    setTagInput(text);
    const parsed = text
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 30)
      .slice(0, 10);
    setTags(parsed);
  };

  // Remove individual tag
  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    setTagInput(newTags.join(', '));
  };

  // Submit response
  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please add at least one photo of your artwork');
      return;
    }

    hapticMedium();

    const input = {
      prompt_id: promptId,
      image_uris: images,
      notes: notes.trim() || null,
      tags,
    };

    const response = await submitResponse(input);

    track('response_submitted', {
      image_count: images.length,
      has_notes: notes.trim().length > 0,
      tag_count: tags.length,
      offline: !isConnected,
    });

    if (response) {
      // Successfully uploaded
      await invalidateHistoryCache();
      await hapticSuccess();

      const firstImageUri = images[0];

      Alert.alert(
        'Saved!',
        'Your response has been saved.',
        [
          {
            text: 'Share Card',
            onPress: () => {
              setShareImageUri(firstImageUri);
              setShareVisible(true);
            },
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      // Queued offline
      await invalidateHistoryCache();
      router.back();
    }
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
          <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Respond to Prompt</Text>

          {/* Prompt reminder */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' }}>{promptText}</Text>
          </View>

          {/* Offline indicator */}
          {!isConnected && (
            <View style={{ backgroundColor: '#FEFCE8', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#A16207', fontSize: 12 }}>
                You're offline. Your response will be saved and uploaded later.
              </Text>
              {queueLength > 0 && (
                <Text style={{ color: '#A16207', fontSize: 12, marginTop: 4 }}>
                  {queueLength} response(s) waiting to upload
                </Text>
              )}
            </View>
          )}

          {/* Image selection section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Photos</Text>

            {/* Image previews */}
            {images.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                {images.map((uri, index) => (
                  <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{ width: 96, height: 96, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: colors.error,
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{'\u00D7'}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ backgroundColor: colors.inputBg, borderRadius: 12, padding: 24, marginBottom: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
                  Add at least one photo of your artwork
                </Text>
              </View>
            )}

            {/* Add Photo button */}
            <TouchableOpacity
              onPress={handleAddPhoto}
              style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, paddingVertical: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>
                Add Photo
              </Text>
            </TouchableOpacity>

            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              {images.length}/3 photos
            </Text>

            {/* Photo ownership disclaimer */}
            <View style={{
              backgroundColor: colors.primaryLight,
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
            }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
                Your photos are yours. ArtSpark does not share your images with AI services or use them for commercial purposes. All uploaded artwork remains the property of the creator.
              </Text>
            </View>
          </View>

          {/* Notes section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>Notes (optional)</Text>
            <TextInput
              multiline
              numberOfLines={4}
              maxLength={500}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it go? What did you learn?"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 16,
                color: colors.text,
                textAlignVertical: 'top',
              }}
            />
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 4 }}>
              {notes.length}/500
            </Text>
          </View>

          {/* Tags section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>Tags (optional)</Text>
            <TextInput
              value={tagInput}
              onChangeText={handleTagInputChange}
              placeholder="Add tags separated by commas"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 16,
                color: colors.text,
                marginBottom: 8,
              }}
            />

            {/* Tag chips */}
            {tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => removeTag(index)}
                    style={{
                      backgroundColor: colors.primaryLight,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 12, marginRight: 4 }}>{tag}</Text>
                    <Text style={{ color: colors.primary, fontSize: 12 }}>{'\u00D7'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={images.length === 0 || uploading}
            style={{
              borderRadius: 12,
              paddingVertical: 16,
              backgroundColor: images.length === 0 || uploading ? colors.border : colors.primary,
            }}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                Share My Creation
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Android photo picker bottom sheet */}
      {Platform.OS === 'android' && showAndroidSheet && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowAndroidSheet(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32 }}>
            <TouchableOpacity
              onPress={() => { setShowAndroidSheet(false); pickFromCamera(); }}
              style={{ paddingVertical: 16 }}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 16, color: colors.text, textAlign: 'center' }}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowAndroidSheet(false); pickFromLibrary(); }}
              style={{ paddingVertical: 16 }}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 16, color: colors.text, textAlign: 'center' }}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAndroidSheet(false)}
              style={{ paddingVertical: 16 }}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Share Card Modal */}
      <ShareModal
        visible={shareVisible}
        onClose={() => {
          setShareVisible(false);
          router.back();
        }}
        promptText={promptText}
        imageUri={shareImageUri}
      />
    </>
  );
}
