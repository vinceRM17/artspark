/**
 * Share card generation service
 *
 * Captures a view as an image and shares it via the native share sheet.
 */

import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Capture a view ref as a PNG and open the native share sheet
 */
export async function generateAndShareCard(
  viewRef: RefObject<View | null>
): Promise<void> {
  if (!viewRef.current) {
    throw new Error('View ref is not available');
  }

  // Capture the view as a temporary PNG file
  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  // Open native share sheet
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your ArtSpark creation',
  });
}
