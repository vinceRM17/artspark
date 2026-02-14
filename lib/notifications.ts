import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { savePreferences } from '@/lib/services/preferences';

/**
 * Configure notification handler at module level
 * Controls how notifications appear when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the user
 * Returns permission status - does NOT throw on denial
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  status: string;
}> {
  const { status } = await Notifications.requestPermissionsAsync();
  return {
    granted: status === 'granted',
    status,
  };
}

/**
 * Schedule a daily notification at the specified time
 * Cancels all existing scheduled notifications first
 *
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns Notification identifier string
 */
export async function scheduleDailyPrompt(
  hour: number,
  minute: number
): Promise<string> {
  // Cancel all existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule new daily notification
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your daily art prompt is ready',
      body: "Open ArtSpark for today's creative inspiration",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return identifier;
}

/**
 * Cancel all scheduled notifications
 * For use when user disables notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Setup Android notification channel at module level
 * Creates a high-importance channel for daily art prompts on Android 8+
 * On iOS this is a no-op
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Art Prompts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C9A72',
      sound: 'default',
    });
  }
}

/**
 * Get and store Expo push token for the user
 * This enables remote notifications in the future
 * Note: The user_preferences table will need an expo_push_token column
 * added in a future migration. For now, Supabase will ignore unknown columns gracefully.
 *
 * @param userId - User ID to associate the push token with
 * @returns Push token string or null on failure
 */
export async function getAndStorePushToken(userId: string): Promise<string | null> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('No EAS project ID configured - cannot get push token');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    // Save to user preferences
    // Note: This will be gracefully ignored until expo_push_token column is added to user_preferences
    await savePreferences(userId, { expo_push_token: token.data } as any);

    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Get notification permission status without requesting
 * Used for settings UI to display current state
 *
 * @returns Object with status string and whether we can request again
 */
export async function getNotificationPermissionStatus(): Promise<{
  status: string;
  canRequest: boolean;
}> {
  const result = await Notifications.getPermissionsAsync();
  return {
    status: result.status,
    canRequest: result.canAskAgain,
  };
}

/**
 * Reschedule daily prompt notification
 * Thin wrapper that cancels existing notifications then schedules new one
 * Makes the cancel-then-reschedule pattern explicit for settings usage
 *
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns Notification identifier string
 */
export async function rescheduleDailyPrompt(
  hour: number,
  minute: number
): Promise<string> {
  await cancelAllNotifications();
  return await scheduleDailyPrompt(hour, minute);
}

// Setup Android notification channel immediately at module load
setupNotificationChannel();
