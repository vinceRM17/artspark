import * as Notifications from 'expo-notifications';

/**
 * Configure notification handler at module level
 * Controls how notifications appear when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
