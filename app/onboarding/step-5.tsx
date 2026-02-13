import { useState, useEffect } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/components/auth/SessionProvider';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePreferences } from '@/lib/services/preferences';
import {
  requestNotificationPermission,
  scheduleDailyPrompt,
} from '@/lib/notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@artspark:onboarding-progress';

type OnboardingProgress = {
  mediums?: string[];
  colorPalettes?: string[];
  subjects?: string[];
  exclusions?: string[];
};

export default function Step5() {
  const router = useRouter();
  const { session } = useSession();

  const [loading, setLoading] = useState(false);
  const [showPermissionExplanation, setShowPermissionExplanation] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Time picker state - default to 9:00 AM
  const [selectedTime, setSelectedTime] = useState(new Date(2024, 0, 1, 9, 0));
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleEnableNotifications = async () => {
    const { granted } = await requestNotificationPermission();
    setPermissionGranted(granted);
    setShowPermissionExplanation(false);
  };

  const handleMaybeLater = () => {
    setPermissionGranted(false);
    setShowPermissionExplanation(false);
  };

  const handleComplete = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'No user session found. Please sign in again.');
      return;
    }

    setLoading(true);

    try {
      // Load accumulated preferences from AsyncStorage
      const progressJson = await AsyncStorage.getItem(STORAGE_KEY);
      const progress: OnboardingProgress = progressJson
        ? JSON.parse(progressJson)
        : {};

      // Format notification time as HH:MM:SS
      const hour = selectedTime.getHours();
      const minute = selectedTime.getMinutes();
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}:00`;

      // Save all preferences to Supabase
      await savePreferences(session.user.id, {
        art_mediums: progress.mediums || [],
        color_palettes: progress.colorPalettes || [],
        subjects: progress.subjects || [],
        exclusions: progress.exclusions || [],
        notification_time: formattedTime,
        notification_enabled: permissionGranted,
        onboarding_completed: true,
      });

      // Schedule notification if permission granted
      if (permissionGranted) {
        await scheduleDailyPrompt(hour, minute);
      }

      // Clear AsyncStorage onboarding progress
      await AsyncStorage.removeItem(STORAGE_KEY);

      // Navigate to main app and clear onboarding from history
      router.replace('/(auth)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to save preferences. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onTimeChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  // Show permission explanation first
  if (showPermissionExplanation) {
    return (
      <OnboardingLayout
        step={5}
        totalSteps={5}
        title="When should we inspire you?"
        subtitle="Get a daily art prompt at your favorite creative time."
        onNext={handleEnableNotifications}
        nextLabel="Enable notifications"
        showSkip={true}
        onSkip={handleMaybeLater}
      >
        <View className="flex-1 justify-center px-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Daily creative nudge
          </Text>
          <Text className="text-base text-gray-700 leading-relaxed">
            We'll send you one gentle reminder each day at the time you choose.
            No spam, no noise -- just your daily spark of inspiration.
          </Text>
        </View>
      </OnboardingLayout>
    );
  }

  // Show time picker
  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      title="When should we inspire you?"
      subtitle="Pick your preferred time for daily prompts."
      onNext={handleComplete}
      nextLabel="Complete Setup"
      nextDisabled={loading}
    >
      <View className="flex-1 justify-center items-center px-6">
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="spinner"
            onChange={onTimeChange}
            style={{ width: '100%' }}
          />
        ) : (
          <View className="w-full">
            <Text className="text-lg text-gray-700 text-center mb-4">
              Selected time:{' '}
              {selectedTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
            <View className="bg-sage rounded-xl px-6 py-4">
              <Text
                className="text-white text-center font-semibold"
                onPress={() => setShowPicker(true)}
              >
                Tap to change time
              </Text>
            </View>
            {showPicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>
        )}
      </View>
    </OnboardingLayout>
  );
}
