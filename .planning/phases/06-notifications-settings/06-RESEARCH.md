# Phase 6: Notifications + Settings - Research

**Researched:** 2026-02-13
**Domain:** Local notifications, settings UI, user preferences management
**Confidence:** HIGH

## Summary

Phase 6 implements daily local notifications and a comprehensive settings screen for managing user preferences. The existing `lib/notifications.ts` from Phase 2 already provides core notification scheduling functionality, but this phase extends it with settings UI, preference editing, notification time management, and "danger zone" actions like prompt history reset.

The standard stack leverages Expo's built-in `expo-notifications` for local notifications (no remote push service needed for MVP), `@react-native-community/datetimepicker` for time selection, and React Native's native `Switch` component with NativeWind styling. Settings screens in React Native commonly use SectionList or simple ScrollView with grouped sections for clear visual hierarchy.

**Key Android consideration:** Android 12+ requires the `SCHEDULE_EXACT_ALARM` permission in AndroidManifest.xml for reliable daily notifications. Android 8+ also requires explicit notification channels to be created via `setNotificationChannelAsync()`.

**Primary recommendation:** Reuse existing onboarding components (ChipGrid, PreferenceChip) for preference editing in settings to maintain UI consistency. Implement optimistic UI updates when changing preferences to provide instant feedback. Always cancel and reschedule notifications atomically when time changes to prevent duplicate firings.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-notifications | Latest (SDK 54) | Local notification scheduling, permissions, push token registration | Official Expo library, handles platform differences, proven reliability for local notifications |
| @react-native-community/datetimepicker | Latest | Native time picker UI | Community-maintained, official Expo support, uses native system components for platform-appropriate UX |
| React Native Switch | Built-in | Toggle component for settings | Native component, no external dependencies, perfect for NativeWind styling |
| Supabase (existing) | Latest | User preferences persistence | Already integrated in Phase 2, upsert pattern handles updates cleanly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AsyncStorage | Via @react-native-async-storage/async-storage | Local cache for preferences (optional) | Offline support, faster initial load before Supabase fetch |
| React Navigation | Via expo-router (existing) | Settings screen routing | Already in use, no new dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-notifications | react-native-push-notification | Expo's library is better integrated with SDK, simpler API, official support |
| @react-native-community/datetimepicker | react-native-modal-datetime-picker | Modal wrapper adds complexity; direct component gives more control for inline display |
| SectionList | FlatList | SectionList better for grouped settings with headers; FlatList sufficient for flat lists |
| Native Switch | Custom toggle component | Native Switch is accessible, platform-appropriate, simpler; custom needed only for brand-specific design |

**Installation:**
```bash
npx expo install expo-notifications @react-native-community/datetimepicker
```

**Config updates (app.json):**
```json
{
  "plugins": [
    "expo-notifications",
    "@react-native-community/datetimepicker"
  ],
  "android": {
    "permissions": [
      "android.permission.SCHEDULE_EXACT_ALARM"
    ]
  }
}
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (auth)/
│   └── settings.tsx              # Settings screen (already exists, expand)
lib/
├── notifications.ts              # Existing notification helpers (extend)
├── services/
│   └── preferences.ts            # Existing preference service (already has upsert)
components/
├── settings/
│   ├── SettingSection.tsx        # Grouped settings with header
│   ├── SettingRow.tsx            # Individual setting row
│   ├── NotificationTimePicker.tsx # Time picker for notification time
│   └── DangerZone.tsx            # Reset actions section
└── onboarding/                   # Reuse ChipGrid, PreferenceChip for preference editing
```

### Pattern 1: Settings Screen with SectionList

**What:** Organize settings into logical sections with sticky headers for visual hierarchy and easy navigation.

**When to use:** When settings screen has 3+ distinct groups (notifications, preferences, danger zone, account).

**Example:**
```typescript
// Source: https://reactnative.dev/docs/sectionlist
import { SectionList } from 'react-native';

const sections = [
  {
    title: 'Notifications',
    data: ['Enable Notifications', 'Notification Time'],
  },
  {
    title: 'Art Preferences',
    data: ['Mediums', 'Colors', 'Subjects', 'Exclusions'],
  },
  {
    title: 'Danger Zone',
    data: ['Reset History'],
  },
];

<SectionList
  sections={sections}
  renderSectionHeader={({ section }) => (
    <Text className="text-sm font-semibold text-gray-500 px-4 py-2 bg-gray-50">
      {section.title}
    </Text>
  )}
  renderItem={({ item }) => <SettingRow title={item} />}
  stickySectionHeadersEnabled
/>
```

### Pattern 2: Atomic Notification Rescheduling

**What:** Cancel all existing scheduled notifications, then schedule new one at updated time to prevent duplicates.

**When to use:** Whenever user changes notification time in settings.

**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';

async function updateNotificationTime(hour: number, minute: number) {
  // Cancel all previous scheduled notifications
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
```

### Pattern 3: Optimistic UI for Preference Updates

**What:** Update UI immediately on user action, save to Supabase in background, revert on error.

**When to use:** Toggling switches, changing notification time, updating preferences where success rate is high.

**Example:**
```typescript
// Source: https://makerkit.dev/blog/saas/supabase-react-query
const [enabled, setEnabled] = useState(preferences?.notification_enabled ?? true);

const handleToggle = async (value: boolean) => {
  // Optimistic update
  setEnabled(value);

  try {
    await savePreferences(userId, { notification_enabled: value });

    // If disabling, cancel notifications
    if (!value) {
      await cancelAllNotifications();
    } else {
      // If enabling, reschedule at saved time
      await scheduleDailyPrompt(preferences.notification_hour, preferences.notification_minute);
    }
  } catch (error) {
    // Revert on error
    setEnabled(!value);
    Alert.alert('Error', 'Failed to update notification settings');
  }
};
```

### Pattern 4: Platform-Specific DateTimePicker Display

**What:** Android uses imperative API (DateTimePickerAndroid.open), iOS uses component API for better UX alignment with platform conventions.

**When to use:** Time picker for notification time selection.

**Example:**
```typescript
// Source: https://github.com/react-native-datetimepicker/datetimepicker
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

// Android - imperative API (recommended)
if (Platform.OS === 'android') {
  DateTimePickerAndroid.open({
    value: new Date(0, 0, 0, hour, minute),
    mode: 'time',
    is24Hour: true,
    onChange: (event, selectedDate) => {
      if (event.type === 'set' && selectedDate) {
        const newHour = selectedDate.getHours();
        const newMinute = selectedDate.getMinutes();
        handleTimeChange(newHour, newMinute);
      }
    },
  });
}

// iOS - component API
{Platform.OS === 'ios' && (
  <DateTimePicker
    value={new Date(0, 0, 0, hour, minute)}
    mode="time"
    display="spinner"
    onChange={(event, selectedDate) => {
      if (selectedDate) {
        handleTimeChange(selectedDate.getHours(), selectedDate.getMinutes());
      }
    }}
  />
)}
```

### Pattern 5: Android Notification Channel Creation

**What:** Create notification channels on Android (required for Android 8+) during app initialization or before first notification.

**When to use:** App startup, before scheduling first notification.

**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C9A72', // Sage green
    });
  }
}

// Call during app initialization
useEffect(() => {
  setupNotificationChannel();
}, []);
```

### Pattern 6: Confirmation Dialog for Destructive Actions

**What:** Use Alert.alert with 'destructive' style button for actions like reset history.

**When to use:** Any irreversible user action (delete, reset, clear).

**Example:**
```typescript
// Source: https://reactnative.dev/docs/alert
import { Alert } from 'react-native';

const handleResetHistory = () => {
  Alert.alert(
    'Reset Prompt History',
    'This will clear all your saved prompts and inspiration. This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete prompt history from database
            await resetPromptHistory(userId);
            Alert.alert('Success', 'Prompt history has been reset');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset history');
          }
        },
      },
    ]
  );
};
```

### Pattern 7: Storing Expo Push Token for Future Use

**What:** Register for and store Expo push token even though MVP uses only local notifications, to enable future remote notifications without schema changes.

**When to use:** During onboarding step 5 (notification permission) or first app launch after permission granted.

**Example:**
```typescript
// Source: https://docs.expo.dev/push-notifications/push-notifications-setup/
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status === 'granted') {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Store token in user_preferences or separate push_tokens table
      await savePreferences(userId, { expo_push_token: token.data });

      return token.data;
    } catch (error) {
      console.log('Failed to get push token:', error);
    }
  }
}
```

### Anti-Patterns to Avoid

- **Not canceling before rescheduling:** Always cancel existing scheduled notifications before creating new ones with different times, or you'll get duplicate notifications.
- **Using AsyncStorage.clear():** Never use `.clear()` as it affects all apps on device; use `getAllKeys()` + `multiRemove()` with app-specific keys instead.
- **Skipping Android notification channels:** Notifications will silently fail on Android 8+ without channels; always create default channel.
- **Assuming permissions persist:** Always check permission status before scheduling notifications; iOS users can revoke in Settings.
- **Hardcoding projectId:** Use `Constants.expoConfig.extra.eas.projectId` to avoid token invalidation during project transfers.
- **Inline date/time pickers on Android:** Use imperative API (DateTimePickerAndroid.open) for better Android UX instead of inline component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time picker UI | Custom hour/minute wheels | @react-native-community/datetimepicker | Platform-appropriate UI, accessibility, localization, 12/24hr format handling |
| Notification scheduling | Custom alarm/timer system | expo-notifications with DAILY trigger | Handles platform differences, background execution, Doze mode, exact alarms |
| Settings sections | Custom collapsible sections | SectionList with sticky headers | Built-in optimization, accessibility, VoiceOver/TalkBack support |
| Confirmation dialogs | Custom modal components | Alert.alert with destructive style | Platform-appropriate styling (iOS action sheet vs Android dialog), minimal code |
| Push token management | Custom device token registration | expo-notifications getExpoPushTokenAsync | Handles Expo push service integration, token refresh, error handling |
| Android notification channels | Custom notification priority logic | Expo's setNotificationChannelAsync | Required by Android OS, handles channel groups, importance levels correctly |

**Key insight:** Notification reliability is deceptively complex across platforms. expo-notifications abstracts critical details: Android 12+ exact alarm permissions, iOS background notification entitlements, Doze mode handling, and notification channel management. Custom implementations miss edge cases that cause silent failures in production.

## Common Pitfalls

### Pitfall 1: Android 12+ Notifications Silently Failing

**What goes wrong:** Daily notifications don't fire on Android 12+ devices even though scheduling succeeds without errors.

**Why it happens:** Android 12 (API 31) introduced `SCHEDULE_EXACT_ALARM` permission requirement. Apps targeting SDK 31+ must declare this permission in AndroidManifest.xml. Without it, notifications fail silently when device enters Doze mode.

**How to avoid:** Add permission to app.json before building:
```json
{
  "android": {
    "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]
  }
}
```

**Warning signs:** Notifications work in development but fail in production builds; notifications work when app is active but not when backgrounded; Android 12+ specific failure.

**Sources:** [Making Expo Notifications Actually Work (Even on Android 12+ and iOS)](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845), [expo/expo Issue #17276](https://github.com/expo/expo/issues/17276)

### Pitfall 2: Notifications Missing on Android 8+ (No Channel)

**What goes wrong:** Notifications don't appear on Android devices running 8.0 (API 26) or higher, even with permissions granted.

**Why it happens:** Android 8.0+ requires all notifications to be assigned to a notification channel. If you don't create a channel explicitly, expo-notifications creates a fallback "Miscellaneous" channel, but it's better to create your own with appropriate settings.

**How to avoid:** Create notification channel during app initialization:
```typescript
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Daily Prompts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}
```

**Warning signs:** Notifications work on iOS but not Android; Android 7 works but Android 8+ fails; no notification sound/vibration even when configured.

**Sources:** [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/), [Making Expo Notifications Actually Work](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845)

### Pitfall 3: Duplicate Notifications After Time Changes

**What goes wrong:** User changes notification time in settings, then receives multiple notifications at different times each day.

**Why it happens:** `scheduleNotificationAsync()` creates a new scheduled notification without canceling previous ones. Each time user changes time, a new notification is added instead of replacing the old one.

**How to avoid:** Always cancel all scheduled notifications before creating new one:
```typescript
await Notifications.cancelAllScheduledNotificationsAsync();
await Notifications.scheduleNotificationAsync({ /* new trigger */ });
```

**Warning signs:** User reports receiving notifications at old time AND new time; notification count increases in `getAllScheduledNotificationsAsync()` output.

**Sources:** [How To Manage Scheduled Notifications In Expo App](https://medium.com/@kurucaner/how-to-manage-scheduled-notifications-in-expo-app-local-notifications-1c419d8c2a4d)

### Pitfall 4: iOS Permission Status Confusion

**What goes wrong:** App shows "notifications enabled" but notifications don't appear, or permission request doesn't trigger on iOS.

**Why it happens:** iOS has granular permission states (NOT_DETERMINED, DENIED, AUTHORIZED, PROVISIONAL, EPHEMERAL). The root `status` field doesn't capture nuances; you must check `ios.status` specifically.

**How to avoid:** Check platform-specific status:
```typescript
const { status, ios } = await Notifications.getPermissionsAsync();
const iosStatus = Platform.OS === 'ios' ? ios?.status : status;

if (iosStatus === 'undetermined' || iosStatus === 'denied') {
  // Show permission request or settings prompt
}
```

**Warning signs:** Permission appears granted but notifications don't fire; permission request dialog doesn't show; "provisional" permissions (banner but no sound).

**Sources:** [Expo Notifications API Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)

### Pitfall 5: Testing Notifications in Simulator/Emulator

**What goes wrong:** Notifications appear to schedule successfully but never fire during testing.

**Why it happens:** Local notifications require a physical device to test. Simulators/emulators don't support notification delivery even though the API calls succeed.

**How to avoid:** Always test notification functionality on real iOS and Android devices. Use Expo Go during development, but create development builds for final notification testing.

**Warning signs:** API calls succeed without errors, but notifications never appear; getAllScheduledNotificationsAsync shows scheduled notifications but they don't fire.

**Sources:** [Daily Reminder with Push Notifications in React Native (Expo)](https://medium.com/@ftardasti96/daily-reminder-with-push-notifications-in-react-native-expo-e69d0077a4b8), [Mastering Local Notifications in Expo](https://kitemetric.com/blogs/mastering-local-notifications-in-expo-for-react-native-apps)

### Pitfall 6: Not Handling Permission Denial Gracefully

**What goes wrong:** App forces users to notification settings screen or shows "enable notifications" toggle that doesn't work after permission denied.

**Why it happens:** iOS and Android don't allow re-requesting permissions programmatically after denial. User must go to system Settings to change permission.

**How to avoid:** Detect denial state and show helpful message with deep link to settings:
```typescript
if (status === 'denied') {
  Alert.alert(
    'Notifications Disabled',
    'To enable daily prompts, please allow notifications in Settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
}
```

**Warning signs:** Users toggle "Enable Notifications" but nothing happens; permission dialog doesn't appear; users complain they can't enable notifications.

**Sources:** [Expo Permissions Guide](https://docs.expo.dev/guides/permissions/)

### Pitfall 7: AsyncStorage.clear() Affecting Other Apps

**What goes wrong:** User's data in other apps disappears after resetting prompt history in your app.

**Why it happens:** On some platforms, `AsyncStorage.clear()` can delete storage beyond your app's scope, affecting other apps that share the same storage namespace.

**How to avoid:** Use targeted deletion with app-specific keys:
```typescript
// DON'T:
await AsyncStorage.clear();

// DO:
const allKeys = await AsyncStorage.getAllKeys();
const appKeys = allKeys.filter(key => key.startsWith('@artspark:'));
await AsyncStorage.multiRemove(appKeys);
```

**Warning signs:** GitHub issues report data loss in other apps; AsyncStorage docs explicitly warn against using `.clear()`.

**Sources:** [react-native-async-storage Issue #735](https://github.com/react-native-async-storage/async-storage/issues/735), [Understanding AsyncStorage in React Native](https://medium.com/@sheharyar29/understanding-asyncstorage-in-react-native-a-comprehensive-guide-69629e3adc4b)

## Code Examples

Verified patterns from official sources:

### Request Notification Permission
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';

async function requestNotificationPermission(): Promise<{
  granted: boolean;
  status: string;
}> {
  const { status } = await Notifications.requestPermissionsAsync();
  return {
    granted: status === 'granted',
    status,
  };
}
```

### Schedule Daily Notification
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';

async function scheduleDailyPrompt(hour: number, minute: number): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();

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
```

### Cancel All Notifications
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';

async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

### Get and Store Expo Push Token
```typescript
// Source: https://docs.expo.dev/push-notifications/push-notifications-setup/
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function getAndStorePushToken(userId: string) {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Store in user_preferences table
    await savePreferences(userId, { expo_push_token: token.data });

    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}
```

### Create Android Notification Channel
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Art Prompts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C9A72', // Sage green brand color
      sound: true,
    });
  }
}
```

### Time Picker (Platform-Specific)
```typescript
// Source: https://github.com/react-native-datetimepicker/datetimepicker
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

function NotificationTimePicker({ hour, minute, onChange }) {
  const handleTimeChange = (newHour: number, newMinute: number) => {
    onChange(newHour, newMinute);
  };

  const showAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(0, 0, 0, hour, minute),
      mode: 'time',
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          handleTimeChange(selectedDate.getHours(), selectedDate.getMinutes());
        }
      },
    });
  };

  if (Platform.OS === 'android') {
    return (
      <TouchableOpacity onPress={showAndroidPicker}>
        <Text>{`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <DateTimePicker
      value={new Date(0, 0, 0, hour, minute)}
      mode="time"
      display="spinner"
      onChange={(event, selectedDate) => {
        if (selectedDate) {
          handleTimeChange(selectedDate.getHours(), selectedDate.getMinutes());
        }
      }}
    />
  );
}
```

### Settings Section with Switch
```typescript
// Source: React Native core documentation + NativeWind
import { View, Text, Switch } from 'react-native';

function NotificationToggle({ enabled, onToggle }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      <Text className="text-base text-gray-900">Enable Notifications</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: '#7C9A72' }}
        thumbColor={enabled ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );
}
```

### Destructive Action Confirmation
```typescript
// Source: https://reactnative.dev/docs/alert
import { Alert } from 'react-native';

function confirmResetHistory(onConfirm: () => void) {
  Alert.alert(
    'Reset Prompt History',
    'This will permanently delete all your saved prompts and inspiration. This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]
  );
}
```

### Targeted AsyncStorage Clear
```typescript
// Source: https://react-native-async-storage.github.io/async-storage/docs/api/
import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAppData() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key => key.startsWith('@artspark:'));
    await AsyncStorage.multiRemove(appKeys);
  } catch (error) {
    console.error('Failed to clear app data:', error);
  }
}
```

### Optimistic Preference Update
```typescript
// Pattern combining Supabase + optimistic UI
async function updatePreference(
  userId: string,
  key: keyof UserPreferences,
  value: any,
  setLocalState: (value: any) => void
) {
  // Optimistic update
  setLocalState(value);

  try {
    await savePreferences(userId, { [key]: value });
  } catch (error) {
    // Revert on error
    setLocalState(!value);
    Alert.alert('Error', 'Failed to update setting');
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Push notifications in Expo Go | Development builds required (SDK 53+) | Expo SDK 53 (2024) | Testing requires building dev client, but local notifications still work in Expo Go |
| Manual notification channels | setNotificationChannelAsync API | Android 8.0 (2017) | Must create channels for Android 8+; calls are no-op on iOS |
| Manual alarm permissions | SCHEDULE_EXACT_ALARM required | Android 12 (2021) | Must declare in manifest; Android 13+ requires runtime permission for API 33+ apps |
| Global AsyncStorage.clear() | Targeted multiRemove with getAllKeys | Community package (2020+) | Prevents cross-app data deletion, safer for user data management |
| Class components | Functional components + hooks | React 16.8 (2019) | Simpler state management, better code reuse, standard in 2026 |
| Hardcoded projectId | Constants.expoConfig.extra.eas.projectId | EAS Build era (~2021) | Prevents push token invalidation during account/project transfers |

**Deprecated/outdated:**
- **React Native's built-in AsyncStorage:** Moved to community package `@react-native-async-storage/async-storage`; import from core deprecated.
- **Push notifications in Expo Go (SDK 53+):** Remote push requires development build; local notifications still supported.
- **react-native-push-notification package:** Less maintained; expo-notifications is the current standard for Expo projects.
- **Asking for notification permissions without explanation:** iOS App Store requires clear explanation before permission request; best practice to show custom UI first.

## Open Questions

1. **Should we create separate notification channels for different prompt types in the future?**
   - What we know: Android allows multiple channels with different importance/sound settings
   - What's unclear: Whether future features (Pro tier, different prompt categories) warrant separate channels
   - Recommendation: Use single "default" channel for MVP; schema supports adding channel_id to future prompts if needed

2. **Should we implement AsyncStorage caching for preferences?**
   - What we know: Supabase call works fine for settings screen; AsyncStorage adds complexity
   - What's unclear: Whether offline-first settings access provides meaningful UX improvement
   - Recommendation: Skip for MVP; Supabase is fast enough for settings screen. Add caching only if users report slow loads.

3. **How should we handle "Pro (coming soon)" placeholder UI?**
   - What we know: Requirements specify showing Pro toggle as placeholder
   - What's unclear: Should it be disabled Switch, text label, or different component entirely
   - Recommendation: Disabled Switch with "Coming Soon" label and onPress showing "Pro features launching soon (~$25/yr)" alert

4. **Should we validate notification time range (e.g., 6am-10pm only)?**
   - What we know: Some apps restrict notification hours to prevent sleep disruption
   - What's unclear: Whether ArtSpark should limit times or trust user choice
   - Recommendation: No restrictions for MVP; users know their creative hours best. Could add "quiet hours" in Pro tier.

5. **Do we need to handle notification time zone changes?**
   - What we know: expo-notifications uses device local time; DAILY trigger respects time zone
   - What's unclear: Whether we need special handling for users traveling across time zones
   - Recommendation: No special handling needed; DAILY trigger naturally adapts to device time zone

## Sources

### Primary (HIGH confidence)
- [Expo Notifications API Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/) - Official API reference, scheduling triggers, permissions
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) - Push token registration, configuration
- [React Native DateTimePicker GitHub](https://github.com/react-native-datetimepicker/datetimepicker) - Time picker API, platform differences, examples
- [React Native Alert Documentation](https://reactnative.dev/docs/alert) - Confirmation dialog patterns, destructive actions
- [React Native SectionList Documentation](https://reactnative.dev/docs/sectionlist) - Settings screen structure, sticky headers
- [AsyncStorage API Documentation](https://react-native-async-storage.github.io/async-storage/docs/api/) - Safe data clearing patterns

### Secondary (MEDIUM confidence)
- [Making Expo Notifications Actually Work (Medium)](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845) - Android 12+ SCHEDULE_EXACT_ALARM requirement, notification channel setup, production gotchas
- [How To Manage Scheduled Notifications In Expo App (Medium)](https://medium.com/@kurucaner/how-to-manage-scheduled-notifications-in-expo-app-local-notifications-1c419d8c2a4d) - Rescheduling patterns, cancel-then-schedule approach
- [Daily Reminder with Push Notifications in React Native (Medium)](https://medium.com/@ftardasti96/daily-reminder-with-push-notifications-in-react-native-expo-e69d0077a4b8) - Device testing requirements
- [expo/expo Issue #17276](https://github.com/expo/expo/issues/17276) - SCHEDULE_EXACT_ALARM permission details for Android 12+
- [How to Use Supabase with TanStack Query](https://makerkit.dev/blog/saas/supabase-react-query) - Optimistic UI patterns for preference updates
- [Understanding AsyncStorage in React Native (Medium)](https://medium.com/@sheharyar29/understanding-asyncstorage-in-react-native-a-comprehensive-guide-69629e3adc4b) - AsyncStorage best practices, multiRemove pattern
- [react-native-async-storage Issue #735](https://github.com/react-native-async-storage/async-storage/issues/735) - clear() cross-app concerns

### Tertiary (LOW confidence)
- [25 React Native Best Practices (2026)](https://www.esparkinfo.com/blog/react-native-best-practices) - General patterns, FlatList optimization
- [React Native Best Practices (Aalpha)](https://www.aalpha.net/articles/best-practices-for-react-native-development/) - Component organization, functional components

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - expo-notifications and @react-native-community/datetimepicker are official, well-documented libraries with Expo support
- Architecture: HIGH - Patterns verified from official docs and existing codebase (notifications.ts, preferences.ts already implemented)
- Pitfalls: HIGH - Android 12+ permission issues, notification channel requirements, and AsyncStorage.clear() dangers documented in official sources and GitHub issues

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - stable Expo SDK and React Native core APIs)

**Notes:**
- Phase 2 already implemented core notification infrastructure (`lib/notifications.ts`) with permission requests and scheduling
- Existing onboarding components (`ChipGrid`, `PreferenceChip`) should be reused for preference editing in settings
- Supabase `user_preferences` table already exists with all necessary fields (notification_time, notification_enabled, etc.)
- Android 12+ permission requirement is critical - must be added to app.json before production build
