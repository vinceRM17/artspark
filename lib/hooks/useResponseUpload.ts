/**
 * useResponseUpload hook
 *
 * Orchestrates response submission with online/offline handling.
 * Validates input, attempts online upload, falls back to offline queue if needed.
 * Triggers queue processing when connectivity restores.
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { useNetworkStatus } from './useNetworkStatus';
import { createResponse } from '@/lib/services/responses';
import {
  queueUpload,
  processQueue,
  getQueueLength,
  cleanupExpiredItems,
} from '@/lib/services/offlineQueue';
import { CreateResponseInput, createResponseSchema, Response } from '@/lib/schemas/response';

export function useResponseUpload(): {
  submitResponse: (input: CreateResponseInput) => Promise<Response | null>;
  uploading: boolean;
  error: string | null;
  queueLength: number;
} {
  const { session } = useSession();
  const userId = session?.user?.id || (__DEV__ ? 'dev-user' : '');
  const { isConnected } = useNetworkStatus();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueLength, setQueueLength] = useState(0);

  // Initialize queue length and cleanup on mount
  useEffect(() => {
    async function initQueue() {
      const length = await getQueueLength();
      setQueueLength(length);
      await cleanupExpiredItems();
    }
    initQueue();
  }, []);

  // Process queue when connectivity restores
  useEffect(() => {
    if (isConnected) {
      async function tryProcessQueue() {
        const result = await processQueue(createResponse);

        if (result.succeeded > 0) {
          console.log(`Successfully uploaded ${result.succeeded} queued response(s)`);
        }

        // Update queue length
        const length = await getQueueLength();
        setQueueLength(length);
      }
      tryProcessQueue();
    }
  }, [isConnected]);

  const submitResponse = async (input: CreateResponseInput): Promise<Response | null> => {
    setUploading(true);
    setError(null);

    try {
      // Validate input
      const validation = createResponseSchema.safeParse(input);
      if (!validation.success) {
        const errorMsg = validation.error.issues.map(i => i.message).join(', ');
        setError(errorMsg);
        setUploading(false);
        Alert.alert('Invalid Input', errorMsg);
        return null;
      }

      // Try online upload if connected
      if (isConnected) {
        try {
          const response = await createResponse(userId, input);
          setUploading(false);
          return response;
        } catch (uploadError) {
          console.warn('Online upload failed, falling back to queue:', uploadError);
          // Fall through to offline queue
        }
      }

      // Offline or online failed - queue it
      await queueUpload(userId, input);
      const length = await getQueueLength();
      setQueueLength(length);

      setUploading(false);

      Alert.alert(
        'Saved Offline!',
        'Your response will upload when you\'re back online.'
      );

      return null; // Queued, not yet created
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit response';
      setError(errorMsg);
      setUploading(false);
      Alert.alert('Error', errorMsg);
      return null;
    }
  };

  return {
    submitResponse,
    uploading,
    error,
    queueLength,
  };
}
