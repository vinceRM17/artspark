import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChipGrid from '@/components/onboarding/ChipGrid';
import { step4Schema } from '@/lib/schemas/onboarding';
import { SUBJECT_OPTIONS } from '@/lib/constants/preferences';
import type { PreferenceOption } from '@/lib/constants/preferences';

type Step4Data = {
  exclusions?: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 4: Subject Exclusions (OPTIONAL)
 * User can exclude subjects they don't want in prompts, or skip this step
 * Filters out subjects already selected in step 3 to prevent contradictions
 */
export default function OnboardingStep4() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [availableOptions, setAvailableOptions] = useState<PreferenceOption[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { exclusions: [] },
  });

  // Load existing progress on mount and filter subject options
  useEffect(() => {
    async function loadProgress() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const progress = JSON.parse(stored);

          // Get already-selected subjects from step 3
          const selectedSubjects = progress.subjects || [];

          // Filter out already-selected subjects to prevent contradictions
          const filtered = SUBJECT_OPTIONS.filter(
            (option) => !selectedSubjects.includes(option.id)
          );
          setAvailableOptions(filtered);

          // Load existing exclusions if any
          if (progress.exclusions && Array.isArray(progress.exclusions)) {
            setValue('exclusions', progress.exclusions);
          }
        } else {
          // No progress found, show all options
          setAvailableOptions(SUBJECT_OPTIONS);
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
        setAvailableOptions(SUBJECT_OPTIONS);
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, [setValue]);

  const saveAndNavigate = async (exclusions: string[] = []) => {
    try {
      // Load existing progress
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const progress = stored ? JSON.parse(stored) : {};

      // Merge this step's data
      const updatedProgress = {
        ...progress,
        exclusions,
      };

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));

      // Navigate to next step
      router.push('/onboarding/step-5-portfolio');
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  const onSubmit = async (data: Step4Data) => {
    await saveAndNavigate(data.exclusions || []);
  };

  const onSkip = async () => {
    await saveAndNavigate([]);
  };

  if (isLoading) {
    return null; // Or loading spinner
  }

  return (
    <OnboardingLayout
      step={4}
      totalSteps={6}
      title="Anything you'd rather avoid?"
      subtitle="We'll make sure these never show up in your prompts. Skip if nothing bothers you."
      onNext={handleSubmit(onSubmit)}
      onBack={() => router.back()}
      onSkip={onSkip}
      showSkip={true}
      nextDisabled={false} // Optional step, always enabled
    >
      {availableOptions.length === 0 ? (
        <View className="flex-1 justify-center items-center py-12">
          <Text className="text-gray-500 text-center text-base">
            You selected all subjects — nothing to exclude!
          </Text>
          <Text className="text-gray-400 text-center text-sm mt-2">
            Tap Next or Skip to continue.
          </Text>
        </View>
      ) : (
        <Controller
          control={control}
          name="exclusions"
          render={({ field }) => (
            <View>
              <ChipGrid
                options={availableOptions}
                selectedIds={field.value || []}
                onToggle={(id) => {
                  const current = field.value || [];
                  const newValue = current.includes(id)
                    ? current.filter((exclusionId) => exclusionId !== id)
                    : [...current, id];
                  field.onChange(newValue);
                }}
              />
            </View>
          )}
        />
      )}
    </OnboardingLayout>
  );
}
