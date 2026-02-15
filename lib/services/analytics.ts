/**
 * Analytics service
 *
 * Queues events in AsyncStorage and batch-inserts them into Supabase.
 * All operations are fire-and-forget — analytics never breaks the app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const QUEUE_KEY = '@artspark:analytics-queue';
const MAX_QUEUE_SIZE = 500;
const BATCH_SIZE = 50;

type AnalyticsEvent = {
  event_name: string;
  properties: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
};

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  userId?: string | null
): Promise<void> {
  try {
    const event: AnalyticsEvent = {
      event_name: eventName,
      properties,
      user_id: userId ?? null,
      created_at: new Date().toISOString(),
    };

    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];

    queue.push(event);

    // Cap queue size — drop oldest events
    const trimmed = queue.length > MAX_QUEUE_SIZE
      ? queue.slice(queue.length - MAX_QUEUE_SIZE)
      : queue;

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent failure — analytics should never break the app
  }
}

export async function processQueue(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return;

    const queue: AnalyticsEvent[] = JSON.parse(raw);
    if (queue.length === 0) return;

    // Process in batches
    const batch = queue.slice(0, BATCH_SIZE);
    const remaining = queue.slice(BATCH_SIZE);

    const { error } = await supabase
      .from('analytics_events')
      .insert(batch);

    if (error) return; // Will retry on next processQueue call

    // Save remaining events back to storage
    if (remaining.length > 0) {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } else {
      await AsyncStorage.removeItem(QUEUE_KEY);
    }

    // If more events remain, process next batch
    if (remaining.length > 0) {
      await processQueue();
    }
  } catch {
    // Silent failure
  }
}
