/**
 * Response creation screen
 *
 * Allows users to photograph their artwork, add notes and tags, and submit responses.
 * Supports offline queueing and native share sheet for completed responses.
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useImagePicker } from '@/lib/hooks/useImagePicker';
import { useResponseUpload } from '@/lib/hooks/useResponseUpload';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

export default function Respond() {
  const params = useLocalSearchParams();
  const promptId = (params.prompt_id as string) || (__DEV__ ? 'dev-prompt-id' : '');
  const promptText = (params.prompt_text as string) || 'Your creative prompt';

  const { images, pickFromLibrary, pickFromCamera, removeImage } = useImagePicker();
  const { submitResponse, uploading, queueLength } = useResponseUpload();
  const { isConnected } = useNetworkStatus();

  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

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

  // Handle share
  const handleShare = async (imageUri: string) => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
      return;
    }

    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share your artwork',
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  // Submit response
  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please add at least one photo of your artwork');
      return;
    }

    const input = {
      prompt_id: promptId,
      image_uris: images,
      notes: notes.trim() || null,
      tags,
    };

    const response = await submitResponse(input);

    if (response) {
      // Successfully uploaded - offer to share
      const firstImageUri = images[0]; // Keep reference to local URI for sharing

      Alert.alert(
        'Saved!',
        'Your response has been saved.',
        [
          {
            text: 'Share',
            onPress: () => handleShare(firstImageUri),
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      // Queued offline - alert already shown by hook
      router.back();
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#FFF8F0]">
      <View className="px-6 pt-12 pb-8">
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-[#7C9A72] text-base">← Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-semibold text-gray-900 mb-4">Respond to Prompt</Text>

        {/* Prompt reminder */}
        <View className="bg-white rounded-xl p-4 mb-6">
          <Text className="text-sm text-gray-600 italic">{promptText}</Text>
        </View>

        {/* Offline indicator */}
        {!isConnected && (
          <View className="bg-yellow-50 rounded-lg p-3 mb-4">
            <Text className="text-yellow-700 text-xs">
              You're offline. Your response will be saved and uploaded later.
            </Text>
            {queueLength > 0 && (
              <Text className="text-yellow-700 text-xs mt-1">
                {queueLength} response(s) waiting to upload
              </Text>
            )}
          </View>
        )}

        {/* Image selection section */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Photos</Text>

          {/* Image previews */}
          {images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              {images.map((uri, index) => (
                <View key={index} className="mr-3 relative">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-gray-100 rounded-xl p-6 mb-3 items-center">
              <Text className="text-gray-500 text-sm text-center">
                Add at least one photo of your artwork
              </Text>
            </View>
          )}

          {/* Image picker buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={pickFromLibrary}
              className="flex-1 bg-white border-2 border-[#7C9A72] rounded-xl py-3"
            >
              <Text className="text-[#7C9A72] text-center font-semibold">
                Choose from Library
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromCamera}
              className="flex-1 bg-white border-2 border-[#7C9A72] rounded-xl py-3"
            >
              <Text className="text-[#7C9A72] text-center font-semibold">
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-xs text-center mt-2">
            {images.length}/3 photos
          </Text>
        </View>

        {/* Notes section */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 mb-2">Notes (optional)</Text>
          <TextInput
            multiline
            numberOfLines={4}
            maxLength={500}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it go? What did you learn?"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl p-4 border border-gray-200 text-base text-gray-900"
            style={{ textAlignVertical: 'top' }}
          />
          <Text className="text-gray-400 text-xs text-right mt-1">
            {notes.length}/500
          </Text>
        </View>

        {/* Tags section */}
        <View className="mb-6">
          <Text className="text-sm text-gray-500 mb-2">Tags (optional)</Text>
          <TextInput
            value={tagInput}
            onChangeText={handleTagInputChange}
            placeholder="Add tags separated by commas"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl p-4 border border-gray-200 text-base text-gray-900 mb-2"
          />

          {/* Tag chips */}
          {tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => removeTag(index)}
                  className="bg-[#7C9A72]/10 rounded-full px-3 py-1 flex-row items-center"
                >
                  <Text className="text-[#7C9A72] text-xs mr-1">{tag}</Text>
                  <Text className="text-[#7C9A72] text-xs">×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={images.length === 0 || uploading}
          className={`rounded-xl py-4 ${
            images.length === 0 || uploading
              ? 'bg-gray-300'
              : 'bg-[#7C9A72]'
          }`}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Share My Creation
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
