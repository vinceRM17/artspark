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
  TextInput,
} from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { router } from 'expo-router';
import {
  getPreferences,
  savePreferences,
  trackCustomMedium,
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
import { DIFFICULTY_OPTIONS, DifficultyLevel } from '@/lib/constants/difficulty';
import { PALETTE_INFO } from '@/lib/constants/palettes';
import { TIER_INFO, UserTier } from '@/lib/constants/tiers';
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
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('developing');
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [resettingHistory, setResettingHistory] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showCustomMediumInput, setShowCustomMediumInput] = useState(false);
  const [customMediumName, setCustomMediumName] = useState('');

  // Load preferences on mount
  useEffect(() => {
    async function loadData() {
      try {
        if (__DEV__ && !session) {
          setMediums(['watercolor', 'pencil']);
          setSubjects(['landscapes', 'botanicals']);
          setNotificationEnabled(true);
          setUserTier('basic');
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
          setUserTier(prefs.tier || 'free');

          // Handle legacy difficulty values
          if (prefs.difficulty) {
            const legacyMap: Record<string, DifficultyLevel> = {
              beginner: 'explorer',
              intermediate: 'developing',
              advanced: 'confident',
            };
            setDifficulty(legacyMap[prefs.difficulty] || prefs.difficulty as DifficultyLevel);
          }

          // Check for existing custom medium
          const customMedium = prefs.art_mediums.find(m => m.startsWith('custom:'));
          if (customMedium) {
            setCustomMediumName(customMedium.replace('custom:', ''));
            setShowCustomMediumInput(true);
          }

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

  const handleAddCustomMedium = useCallback(() => {
    const name = customMediumName.trim();
    if (!name) return;

    const customId = `custom:${name}`;
    const filtered = mediums.filter(m => !m.startsWith('custom:'));
    setMediums([...filtered, customId]);
    trackCustomMedium(name);
  }, [customMediumName, mediums]);

  const handleRemoveCustomMedium = useCallback(() => {
    setMediums(mediums.filter(m => !m.startsWith('custom:')));
    setCustomMediumName('');
    setShowCustomMediumInput(false);
  }, [mediums]);

  const handleSavePreferences = useCallback(async () => {
    setSavingPreferences(true);
    try {
      const filteredExclusions = exclusions.filter((e) => !subjects.includes(e));

      await savePreferences(userId, {
        art_mediums: mediums,
        color_palettes: colorPalettes,
        subjects: subjects,
        exclusions: filteredExclusions,
        difficulty: difficulty,
      });
      setExclusions(filteredExclusions);
      setEditingSection(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  }, [mediums, colorPalettes, subjects, exclusions, difficulty, userId]);

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
        {/* Color palette editor with swatches */}
        {type === 'colors' ? (
          <View>
            {options.map((option) => {
              const palette = PALETTE_INFO[option.id];
              const selected = selectedIds.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleTogglePreference(type, option.id)}
                  className="mb-2 rounded-xl border p-3"
                  style={{
                    borderColor: selected ? '#7C9A72' : '#E5E7EB',
                    backgroundColor: selected ? '#F0F5EE' : '#FFFFFF',
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="font-medium text-sm"
                      style={{ color: selected ? '#7C9A72' : '#374151' }}
                    >
                      {option.label}
                    </Text>
                    {palette && (
                      <View className="flex-row items-center">
                        {palette.hexColors.map((hex, i) => (
                          <View
                            key={i}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              backgroundColor: hex,
                              marginLeft: i > 0 ? -3 : 0,
                              borderWidth: 1,
                              borderColor: '#FFFFFF',
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ChipGrid
            options={options}
            selectedIds={selectedIds}
            onToggle={(id) => handleTogglePreference(type, id)}
          />
        )}

        {/* Custom medium input (mediums section only) */}
        {type === 'mediums' && (
          <View className="mt-3">
            {showCustomMediumInput ? (
              <View className="bg-white rounded-lg p-3 border border-gray-200">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-700">Custom Medium</Text>
                  <TouchableOpacity onPress={handleRemoveCustomMedium}>
                    <Text className="text-red-500 text-xs">Remove</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={customMediumName}
                  onChangeText={setCustomMediumName}
                  onBlur={handleAddCustomMedium}
                  onSubmitEditing={handleAddCustomMedium}
                  placeholder="e.g. Watercolor pencils"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 text-sm text-gray-900"
                  returnKeyType="done"
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowCustomMediumInput(true)}
                className="py-2"
              >
                <Text className="text-[#7C9A72] text-sm font-medium">
                  + Add custom medium
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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

  const currentTierInfo = TIER_INFO[userTier];

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

      {/* Section 2: Skill Level (4 tiers) */}
      <SettingSection title="Skill Level">
        <SettingRow
          label="Difficulty"
          description={DIFFICULTY_OPTIONS.find(d => d.id === difficulty)?.label || 'Developing Artist'}
          onPress={() =>
            setEditingSection(editingSection === 'difficulty' ? null : 'difficulty')
          }
          rightElement={
            <Text className="text-gray-400 text-sm">
              {editingSection === 'difficulty' ? 'Close' : 'Change'}
            </Text>
          }
        />
        {editingSection === 'difficulty' && (
          <View className="px-4 py-3 bg-gray-50">
            {DIFFICULTY_OPTIONS.map((option) => {
              const selected = difficulty === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setDifficulty(option.id)}
                  className="mb-2 rounded-xl border p-4"
                  style={{
                    borderColor: selected ? '#7C9A72' : '#E5E7EB',
                    backgroundColor: selected ? '#F0F5EE' : '#FFFFFF',
                  }}
                >
                  <Text
                    className="font-semibold text-base"
                    style={{ color: selected ? '#7C9A72' : '#374151' }}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Explorer tutorial toggle */}
            {difficulty === 'explorer' && (
              <View className="bg-[#F0F5EE] rounded-xl p-3 mt-2 border border-[#7C9A72]/20">
                <Text className="text-sm text-[#5A7A50]">
                  Tutorial links and tips will appear with your prompts.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSavePreferences}
              disabled={savingPreferences}
              className="bg-[#7C9A72] rounded-lg py-2.5 mt-2"
              activeOpacity={0.7}
            >
              <Text className="text-white text-center font-semibold">
                {savingPreferences ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SettingSection>

      {/* Section 3: Art Supplies & Preferences */}
      <SettingSection title="My Supplies & Preferences">
        <SettingRow
          label="Art Supplies"
          description={`${mediums.length} materials on hand`}
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

      {/* Section 4: Subscription / Tier */}
      <SettingSection title="Subscription">
        <SettingRow
          label={currentTierInfo.label}
          description={currentTierInfo.description}
        />
        {userTier === 'free' && (
          <View className="px-4 py-3">
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Coming Soon', 'Subscriptions will be available in a future update.')
              }
              className="bg-[#7C9A72] rounded-lg py-2.5"
            >
              <Text className="text-white text-center font-semibold">
                Upgrade to Basic ({TIER_INFO.basic.price})
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {userTier === 'basic' && (
          <View className="px-4 py-3">
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Coming Soon', 'Community tier will be available in a future update.')
              }
              className="bg-white border-2 border-[#7C9A72] rounded-lg py-2.5"
            >
              <Text className="text-[#7C9A72] text-center font-semibold">
                Upgrade to Community ({TIER_INFO.community.price})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SettingSection>

      {/* Section 5: Account */}
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

      {/* Section 6: Danger Zone */}
      <DangerZone
        onResetHistory={handleResetHistory}
        resetting={resettingHistory}
      />

      {/* Footer */}
      <View className="px-6 py-8">
        <Text className="text-xs text-gray-400 text-center">
          ArtSpark v1.1.0
        </Text>
      </View>
    </ScrollView>
  );
}
