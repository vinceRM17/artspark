import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChipGrid from '@/components/onboarding/ChipGrid';
import { step2Schema } from '@/lib/schemas/onboarding';
import { COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';

type Step2Data = {
  colorPalettes?: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 2: Color Palette Preferences (OPTIONAL)
 * User can select preferred color palettes or skip this step
 */
export default function OnboardingStep2() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { colorPalettes: [] },
  });

  // Load existing progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const progress = JSON.parse(stored);
          if (progress.colorPalettes && Array.isArray(progress.colorPalettes)) {
            setValue('colorPalettes', progress.colorPalettes);
          }
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, [setValue]);

  const saveAndNavigate = async (colorPalettes: string[] = []) => {
    try {
      // Load existing progress
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const progress = stored ? JSON.parse(stored) : {};

      // Merge this step's data
      const updatedProgress = {
        ...progress,
        colorPalettes,
      };

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));

      // Navigate to next step
      router.push('/onboarding/step-3');
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  const onSubmit = async (data: Step2Data) => {
    await saveAndNavigate(data.colorPalettes || []);
  };

  const onSkip = async () => {
    await saveAndNavigate([]);
  };

  if (isLoading) {
    return null; // Or loading spinner
  }

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      title="Any color preferences?"
      subtitle="This is optional -- skip if you're open to any palette."
      onNext={handleSubmit(onSubmit)}
      onSkip={onSkip}
      showSkip={true}
      nextDisabled={false} // Optional step, always enabled
    >
      <Controller
        control={control}
        name="colorPalettes"
        render={({ field }) => (
          <View>
            <ChipGrid
              options={COLOR_PALETTE_OPTIONS}
              selectedIds={field.value || []}
              onToggle={(id) => {
                const current = field.value || [];
                const newValue = current.includes(id)
                  ? current.filter((paletteId) => paletteId !== id)
                  : [...current, id];
                field.onChange(newValue);
              }}
            />
          </View>
        )}
      />
    </OnboardingLayout>
  );
}
