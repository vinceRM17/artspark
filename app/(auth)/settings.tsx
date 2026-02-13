import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { router } from 'expo-router';
import {
  getPreferences,
  savePreferences,
  UserPreferences,
} from '@/lib/services/preferences';
import { resetPromptHistory } from '@/lib/services/prompts';
import {
  rescheduleDailyPrompt,
  cancelAllNotifications,
  getNotificationPermissionStatus,
  getAndStorePushToken,
} from '@/lib/notifications';
import { invalidateHistoryCache } from '@/lib/hooks/usePromptHistory';
import {
  MEDIUM_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  SUBJECT_OPTIONS,
} from '@/lib/constants/preferences';
import SettingSection from '@/components/settings/SettingSection';
import SettingRow from '@/components/settings/SettingRow';
import NotificationTimePicker from '@/components/settings/NotificationTimePicker';
import DangerZone from '@/components/settings/DangerZone';
import ChipGrid from '@/components/onboarding/ChipGrid';

export default function Settings() {
  const { session, signOut } = useSession();
  const userId = session?.user?.id || (__DEV__ ? 'dev-user' : '');

  // State
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationHour, setNotificationHour] = useState(9);
  const [notificationMinute, setNotificationMinute] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('');
  const [mediums, setMediums] = useState<string[]>([]);
  const [colorPalettes, setColorPalettes] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [resettingHistory, setResettingHistory] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    async function loadData() {
      try {
        if (__DEV__ && !session) {
          // Dev fallback defaults
          setMediums(['watercolor', 'pencil']);
          setSubjects(['landscapes', 'botanicals']);
          setNotificationEnabled(true);
          setLoading(false);
          return;
        }

        const prefs = await getPreferences(userId);
        if (prefs) {
          setPreferences(prefs);
          setNotificationEnabled(prefs.notification_enabled);
          setMediums(prefs.art_mediums);
          setColorPalettes(prefs.color_palettes);
          setSubjects(prefs.subjects);
          setExclusions(prefs.exclusions);

          // Parse notification_time (HH:MM:SS) into hour and minute
          if (prefs.notification_time) {
            const parts = prefs.notification_time.split(':');
            setNotificationHour(parseInt(parts[0], 10));
            setNotificationMinute(parseInt(parts[1], 10));
          }
        }

        const permStatus = await getNotificationPermissionStatus();
        setNotificationPermission(permStatus.status);
      } catch (error: any) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, session]);

  // Handlers
  const handleNotificationToggle = useCallback(
    async (value: boolean) => {
      const previousValue = notificationEnabled;
      setNotificationEnabled(value);

      try {
        if (value) {
          // Check permission
          const permStatus = await getNotificationPermissionStatus();
          if (permStatus.status === 'denied') {
            Alert.alert(
              'Notifications Disabled',
              'Notifications are disabled in your device settings. Please enable them to receive daily art prompts.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            setNotificationEnabled(previousValue);
            return;
          }

          await rescheduleDailyPrompt(notificationHour, notificationMinute);
          await savePreferences(userId, { notification_enabled: true });
          // Fire and forget push token storage
          getAndStorePushToken(userId);
        } else {
          await cancelAllNotifications();
          await savePreferences(userId, { notification_enabled: false });
        }
      } catch (error: any) {
        setNotificationEnabled(previousValue);
        Alert.alert('Error', error.message || 'Failed to update notification settings');
      }
    },
    [notificationEnabled, notificationHour, notificationMinute, userId]
  );

  const handleTimeChange = useCallback(
    async (hour: number, minute: number) => {
      setNotificationHour(hour);
      setNotificationMinute(minute);

      const timeString = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}:00`;

      try {
        await savePreferences(userId, { notification_time: timeString });
        if (notificationEnabled) {
          await rescheduleDailyPrompt(hour, minute);
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update notification time');
      }
    },
    [notificationEnabled, userId]
  );

  const handleTogglePreference = useCallback(
    (type: 'mediums' | 'colors' | 'subjects' | 'exclusions', id: string) => {
      const setState =
        type === 'mediums'
          ? setMediums
          : type === 'colors'
          ? setColorPalettes
          : type === 'subjects'
          ? setSubjects
          : setExclusions;

      const currentList =
        type === 'mediums'
          ? mediums
          : type === 'colors'
          ? colorPalettes
          : type === 'subjects'
          ? subjects
          : exclusions;

      if (currentList.includes(id)) {
        // Removing — enforce minimum for mediums and subjects
        if ((type === 'mediums' || type === 'subjects') && currentList.length <= 1) {
          const label = type === 'mediums' ? 'medium' : 'subject';
          Alert.alert('Required', `You need at least one ${label} selected.`);
          return;
        }
        setState(currentList.filter((item) => item !== id));
      } else {
        setState([...currentList, id]);
      }
    },
    [mediums, colorPalettes, subjects, exclusions]
  );

  const handleSavePreferences = useCallback(async () => {
    setSavingPreferences(true);
    try {
      // Filter exclusions to remove any that are also in subjects
      const filteredExclusions = exclusions.filter((e) => !subjects.includes(e));

      await savePreferences(userId, {
        art_mediums: mediums,
        color_palettes: colorPalettes,
        subjects: subjects,
        exclusions: filteredExclusions,
      });
      setExclusions(filteredExclusions);
      setEditingSection(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  }, [mediums, colorPalettes, subjects, exclusions, userId]);

  const handleResetHistory = useCallback(async () => {
    setResettingHistory(true);
    try {
      await resetPromptHistory(userId);
      await invalidateHistoryCache();
      Alert.alert('Success', 'Your prompt history has been reset.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset history');
    } finally {
      setResettingHistory(false);
    }
  }, [userId]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/sign-in');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to log out');
          }
        },
      },
    ]);
  }, [signOut]);

  // Permission status text
  const permissionText =
    notificationPermission === 'granted'
      ? 'Notifications allowed'
      : notificationPermission === 'denied'
      ? 'Notifications disabled in device settings'
      : 'Permission not yet requested';

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#FFF8F0]">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  const renderPreferenceEditor = (
    sectionKey: string,
    options: { id: string; label: string }[],
    selectedIds: string[],
    type: 'mediums' | 'colors' | 'subjects' | 'exclusions'
  ) => {
    if (editingSection !== sectionKey) return null;
    return (
      <View className="px-4 py-3 bg-gray-50">
        <ChipGrid
          options={options}
          selectedIds={selectedIds}
          onToggle={(id) => handleTogglePreference(type, id)}
        />
        <TouchableOpacity
          onPress={handleSavePreferences}
          disabled={savingPreferences}
          className="bg-[#7C9A72] rounded-lg py-2.5 mt-4"
          activeOpacity={0.7}
        >
          <Text className="text-white text-center font-semibold">
            {savingPreferences ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-[#FFF8F0]">
      {/* Section 1: Notifications */}
      <SettingSection title="Notifications">
        <SettingRow
          label="Daily Reminders"
          description={permissionText}
          rightElement={
            <Switch
              trackColor={{ false: '#D1D5DB', true: '#7C9A72' }}
              thumbColor="white"
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
            />
          }
        />
        <SettingRow
          label="Reminder Time"
          description="When to send your daily art prompt"
          rightElement={
            <NotificationTimePicker
              hour={notificationHour}
              minute={notificationMinute}
              onChange={handleTimeChange}
              disabled={!notificationEnabled}
            />
          }
        />
      </SettingSection>

      {/* Section 2: Art Preferences */}
      <SettingSection title="Art Preferences">
        <SettingRow
          label="Mediums"
          description={`${mediums.length} selected`}
          onPress={() =>
            setEditingSection(editingSection === 'mediums' ? null : 'mediums')
          }
          rightElement={
            <Text className="text-gray-400 text-sm">
              {editingSection === 'mediums' ? 'Close' : 'Edit'}
            </Text>
          }
        />
        {renderPreferenceEditor('mediums', MEDIUM_OPTIONS, mediums, 'mediums')}

        <SettingRow
          label="Color Palettes"
          description={
            colorPalettes.length > 0
              ? `${colorPalettes.length} selected`
              : 'None selected'
          }
          onPress={() =>
            setEditingSection(editingSection === 'colors' ? null : 'colors')
          }
          rightElement={
            <Text className="text-gray-400 text-sm">
              {editingSection === 'colors' ? 'Close' : 'Edit'}
            </Text>
          }
        />
        {renderPreferenceEditor(
          'colors',
          COLOR_PALETTE_OPTIONS,
          colorPalettes,
          'colors'
        )}

        <SettingRow
          label="Subjects"
          description={`${subjects.length} selected`}
          onPress={() =>
            setEditingSection(editingSection === 'subjects' ? null : 'subjects')
          }
          rightElement={
            <Text className="text-gray-400 text-sm">
              {editingSection === 'subjects' ? 'Close' : 'Edit'}
            </Text>
          }
        />
        {renderPreferenceEditor(
          'subjects',
          SUBJECT_OPTIONS,
          subjects,
          'subjects'
        )}

        <SettingRow
          label="Exclusions"
          description={
            exclusions.length > 0
              ? `${exclusions.length} excluded`
              : 'None'
          }
          onPress={() =>
            setEditingSection(
              editingSection === 'exclusions' ? null : 'exclusions'
            )
          }
          rightElement={
            <Text className="text-gray-400 text-sm">
              {editingSection === 'exclusions' ? 'Close' : 'Edit'}
            </Text>
          }
        />
        {renderPreferenceEditor(
          'exclusions',
          SUBJECT_OPTIONS,
          exclusions,
          'exclusions'
        )}
      </SettingSection>

      {/* Section 3: Subscription */}
      <SettingSection title="Subscription">
        <SettingRow
          label="ArtSpark Pro"
          description="Coming Soon (~$25/yr)"
          rightElement={
            <Switch
              value={false}
              disabled
              trackColor={{ false: '#D1D5DB', true: '#7C9A72' }}
              thumbColor="white"
            />
          }
        />
      </SettingSection>

      {/* Section 4: Account */}
      <SettingSection title="Account">
        <SettingRow
          label="Email"
          description={session?.user?.email || 'Not signed in'}
        />
        <SettingRow
          label="Log Out"
          onPress={handleLogout}
          rightElement={<Text className="text-red-500 font-medium">Log Out</Text>}
        />
      </SettingSection>

      {/* Section 5: Danger Zone */}
      <DangerZone
        onResetHistory={handleResetHistory}
        resetting={resettingHistory}
      />

      {/* Footer */}
      <View className="px-6 py-8">
        <Text className="text-xs text-gray-400 text-center">
          ArtSpark v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
