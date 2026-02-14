import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { useSession } from '@/components/auth/SessionProvider';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '@artspark:onboarding-progress';
const MAX_PORTFOLIO_IMAGES = 3;

/**
 * Onboarding Step 5: Portfolio Upload (OPTIONAL)
 * User can upload 1-3 pieces of existing artwork.
 * Images are stored in Supabase storage for future style analysis.
 */
export default function OnboardingStep5Portfolio() {
  const router = useRouter();
  const { session } = useSession();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const userId = session?.user?.id || (__DEV__ ? 'dev-user' : '');

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please allow photo library access to upload your artwork.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: MAX_PORTFOLIO_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newUris].slice(0, MAX_PORTFOLIO_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPortfolioImages = async () => {
    if (images.length === 0 || !userId || userId === 'dev-user') return;

    setUploading(true);

    try {
      for (let i = 0; i < images.length; i++) {
        // Compress image
        const manipulated = await ImageManipulator.manipulateAsync(
          images[i],
          [{ resize: { width: 2048 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Read as blob for upload
        const response = await fetch(manipulated.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const fileName = `${userId}/portfolio_${i}_${Date.now()}.jpg`;

        await supabase.storage
          .from('portfolios')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        // Save metadata to portfolio_uploads table
        await supabase.from('portfolio_uploads').insert({
          user_id: userId,
          storage_path: fileName,
        });
      }
    } catch (error) {
      console.error('Failed to upload portfolio images:', error);
      // Non-blocking — continue to next step even if upload fails
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (images.length > 0) {
      await uploadPortfolioImages();
    }
    router.push('/onboarding/step-6');
  };

  const handleSkip = () => {
    router.push('/onboarding/step-6');
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={6}
      title="Share your art with us"
      subtitle="Upload 1-3 pieces so we can learn your style. You can always add more later."
      onNext={handleNext}
      onSkip={handleSkip}
      showSkip={true}
      nextLabel={uploading ? 'Uploading...' : images.length > 0 ? 'Upload & Continue' : 'Continue'}
      nextDisabled={uploading}
    >
      {/* Image previews */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {images.map((uri, index) => (
            <View key={index} className="mr-3 relative">
              <Image
                source={{ uri }}
                className="rounded-xl"
                style={{ width: 120, height: 120 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upload button */}
      {images.length < MAX_PORTFOLIO_IMAGES && (
        <TouchableOpacity
          onPress={pickImages}
          className="bg-white border-2 border-dashed border-[#7C9A72] rounded-xl py-8 items-center mb-4"
        >
          <Text className="text-[#7C9A72] text-lg font-semibold mb-1">
            Choose from Library
          </Text>
          <Text className="text-gray-400 text-sm">
            {images.length === 0
              ? 'Select up to 3 pieces'
              : `${MAX_PORTFOLIO_IMAGES - images.length} more available`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Info text */}
      <View className="bg-gray-50 rounded-xl p-4 mt-2">
        <Text className="text-xs text-gray-500 leading-5">
          Your artwork is stored securely and only visible to you.
          In the future, we'll use these to understand your artistic style
          and personalize your experience.
        </Text>
      </View>
    </OnboardingLayout>
  );
}
