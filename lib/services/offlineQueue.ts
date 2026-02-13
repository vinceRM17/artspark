/**
 * Offline upload queue service
 *
 * Manages AsyncStorage-based queue for pending response uploads.
 * Stores metadata only (file URIs, not base64) to avoid performance issues.
 * Handles retry logic with max retry count and expiry cleanup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QUEUE_STORAGE_KEY,
  MAX_RETRY_COUNT,
  QUEUE_EXPIRY_DAYS,
} from '@/lib/constants/upload';
import { CreateResponseInput } from '@/lib/schemas/response';

/**
 * Queued upload item
 * Stores metadata only - image files remain on device at their URIs
 */
export type QueuedUpload = {
  id: string;
  userId: string;
  input: CreateResponseInput;
  timestamp: number;
  retryCount: number;
};

/**
 * Get queue from AsyncStorage
 * @returns Array of queued uploads (empty array if none)
 */
async function getQueue(): Promise<QueuedUpload[]> {
  try {
    const json = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as QueuedUpload[];
  } catch (error) {
    console.error('Error reading queue from storage:', error);
    return [];
  }
}

/**
 * Save queue to AsyncStorage
 * @param queue - Array of queued uploads
 */
async function saveQueue(queue: QueuedUpload[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving queue to storage:', error);
    throw new Error('Failed to save queue');
  }
}

/**
 * Add upload to queue
 * @param userId - User ID creating the response
 * @param input - Response data with local image URIs
 * @returns Queue item ID
 */
export async function queueUpload(
  userId: string,
  input: CreateResponseInput
): Promise<string> {
  const queue = await getQueue();

  const queueItem: QueuedUpload = {
    id: `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    input,
    timestamp: Date.now(),
    retryCount: 0,
  };

  queue.push(queueItem);
  await saveQueue(queue);

  return queueItem.id;
}

/**
 * Process upload queue
 * Attempts to upload all queued items using provided upload function
 * @param uploadFn - Function to upload a single response (userId, input) => Promise
 * @returns Counts of succeeded and failed uploads
 */
export async function processQueue(
  uploadFn: (userId: string, input: CreateResponseInput) => Promise<any>
): Promise<{ succeeded: number; failed: number }> {
  const queue = await getQueue();

  if (queue.length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  // Process all items with Promise.allSettled
  const results = await Promise.allSettled(
    queue.map(item => uploadFn(item.userId, item.input))
  );

  let succeeded = 0;
  let failed = 0;
  const updatedQueue: QueuedUpload[] = [];

  results.forEach((result, index) => {
    const item = queue[index];

    if (result.status === 'fulfilled') {
      // Success - remove from queue
      succeeded++;
    } else {
      // Failure - increment retry count
      item.retryCount++;

      if (item.retryCount >= MAX_RETRY_COUNT) {
        // Max retries reached - give up and remove from queue
        failed++;
        console.warn(`Dropping queued upload ${item.id} after ${MAX_RETRY_COUNT} retries`);
      } else {
        // Keep in queue for retry
        updatedQueue.push(item);
      }
    }
  });

  // Save updated queue
  await saveQueue(updatedQueue);

  return { succeeded, failed };
}

/**
 * Get current queue length
 * @returns Number of items in queue
 */
export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Clean up expired queue items
 * Removes items older than QUEUE_EXPIRY_DAYS
 * @returns Number of items removed
 */
export async function cleanupExpiredItems(): Promise<number> {
  const queue = await getQueue();
  const now = Date.now();
  const expiryMs = QUEUE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  const filteredQueue = queue.filter(item => {
    const age = now - item.timestamp;
    return age < expiryMs;
  });

  const removedCount = queue.length - filteredQueue.length;

  if (removedCount > 0) {
    await saveQueue(filteredQueue);
    console.log(`Cleaned up ${removedCount} expired queue items`);
  }

  return removedCount;
}
