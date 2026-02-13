import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChipGrid from '@/components/onboarding/ChipGrid';
import { step1Schema } from '@/lib/schemas/onboarding';
import { MEDIUM_OPTIONS } from '@/lib/constants/preferences';

type Step1Data = {
  mediums: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 1: Art Medium Selection (REQUIRED)
 * User selects preferred art mediums with min 1 selection enforced
 */
export default function OnboardingStep1() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { mediums: [] },
  });

  // Load existing progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const progress = JSON.parse(stored);
          if (progress.mediums && Array.isArray(progress.mediums)) {
            setValue('mediums', progress.mediums);
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

  // Watch mediums for button disable state
  const selectedMediums = watch('mediums');

  const onSubmit = async (data: Step1Data) => {
    try {
      // Load existing progress
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const progress = stored ? JSON.parse(stored) : {};

      // Merge this step's data
      const updatedProgress = {
        ...progress,
        mediums: data.mediums,
      };

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));

      // Navigate to next step
      router.push('/onboarding/step-2');
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  if (isLoading) {
    return null; // Or loading spinner
  }

  return (
    <OnboardingLayout
      step={1}
      totalSteps={5}
      title="What do you create with?"
      subtitle="Pick the mediums you love working in. You can always change these later."
      onNext={handleSubmit(onSubmit)}
      nextDisabled={selectedMediums.length === 0}
    >
      <Controller
        control={control}
        name="mediums"
        render={({ field }) => (
          <View>
            <ChipGrid
              options={MEDIUM_OPTIONS}
              selectedIds={field.value}
              onToggle={(id) => {
                const current = field.value;
                const newValue = current.includes(id)
                  ? current.filter((mediumId) => mediumId !== id)
                  : [...current, id];
                field.onChange(newValue);
              }}
            />
          </View>
        )}
      />

      {/* Validation error message */}
      {errors.mediums && (
        <Text className="text-red-500 mt-4 text-base">
          {errors.mediums.message}
        </Text>
      )}
    </OnboardingLayout>
  );
}
