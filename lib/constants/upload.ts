/**
 * Upload and compression constants for response image handling
 * Used across image upload service and offline queue management
 */

export const MAX_IMAGES = 3; // max images per response
export const COMPRESSION_QUALITY = 0.8; // react-native-compressor quality (0-1 scale)
export const MAX_IMAGE_DIMENSION = 2048; // max width/height in pixels
export const MAX_RETRY_COUNT = 3; // max retries before dropping queued upload
export const QUEUE_EXPIRY_DAYS = 7; // expire queue items after 7 days
export const QUEUE_STORAGE_KEY = '@artspark:upload-queue'; // AsyncStorage key for offline queue
export const STORAGE_BUCKET = 'responses'; // Supabase Storage bucket name
