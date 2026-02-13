/**
 * Image upload service
 *
 * Handles image compression and upload to Supabase Storage.
 * Uses react-native-compressor for efficient compression with quality 0.8 and max 2048px.
 * Converts images to ArrayBuffer via base64 for Supabase Storage upload.
 */

import { Image } from 'react-native-compressor';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import {
  COMPRESSION_QUALITY,
  MAX_IMAGE_DIMENSION,
  STORAGE_BUCKET,
} from '@/lib/constants/upload';

/**
 * Compress image to max dimensions and quality
 * @param uri - Local file URI to compress
 * @returns Compressed image URI
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const compressedUri = await Image.compress(uri, {
      compressionMethod: 'auto',
      quality: COMPRESSION_QUALITY,
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
      returnableOutputType: 'uri',
    });
    return compressedUri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Upload single image to Supabase Storage
 * @param fileUri - Local file URI (should be compressed)
 * @param userId - User ID for folder organization
 * @param responseId - Response ID for file naming
 * @param index - Image index in response (0-2)
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
  fileUri: string,
  userId: string,
  responseId: string,
  index: number
): Promise<string> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Determine file extension from URI (default to jpg)
    const uriParts = fileUri.split('.');
    const ext = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';

    // Generate storage path: userId/responseId_index_timestamp.ext
    const filePath = `${userId}/${responseId}_${index}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple response images
 * Compresses all images in parallel, then uploads in parallel
 * @param imageUris - Array of local file URIs (1-3 items)
 * @param userId - User ID for folder organization
 * @param responseId - Response ID for file naming
 * @returns Array of public URLs
 */
export async function uploadResponseImages(
  imageUris: string[],
  userId: string,
  responseId: string
): Promise<string[]> {
  // Compress all images in parallel
  const compressedUris = await Promise.all(
    imageUris.map(uri => compressImage(uri))
  );

  // Upload all compressed images in parallel
  const publicUrls = await Promise.all(
    compressedUris.map((uri, index) => uploadImage(uri, userId, responseId, index))
  );

  return publicUrls;
}
