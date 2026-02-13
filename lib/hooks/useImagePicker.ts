/**
 * useImagePicker hook
 *
 * Manages image selection from camera or library with permissions.
 * Enforces MAX_IMAGES (3) limit and handles permission denial gracefully.
 */

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { MAX_IMAGES } from '@/lib/constants/upload';

export function useImagePicker(): {
  images: string[];
  pickFromLibrary: () => Promise<void>;
  pickFromCamera: () => Promise<void>;
  removeImage: (index: number) => void;
  clearImages: () => void;
} {
  const [images, setImages] = useState<string[]>([]);

  const pickFromLibrary = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to select images.'
      );
      return;
    }

    // Calculate remaining slots
    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {
      Alert.alert('Maximum Reached', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 1.0,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets) {
      // Append new URIs, respecting MAX_IMAGES cap
      const newUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  };

  const pickFromCamera = async () => {
    // Request camera permissions first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take photos.'
      );
      return;
    }

    // Check if we have room
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Maximum Reached', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1.0,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  return {
    images,
    pickFromLibrary,
    pickFromCamera,
    removeImage,
    clearImages,
  };
}
