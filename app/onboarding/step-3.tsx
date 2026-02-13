import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChipGrid from '@/components/onboarding/ChipGrid';
import { step3Schema } from '@/lib/schemas/onboarding';
import { SUBJECT_OPTIONS } from '@/lib/constants/preferences';

type Step3Data = {
  subjects: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 3: Subject Preferences (REQUIRED)
 * User selects subjects they'd love to get prompts about with min 1 selection enforced
 */
export default function OnboardingStep3() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { subjects: [] },
  });

  // Load existing progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const progress = JSON.parse(stored);
          if (progress.subjects && Array.isArray(progress.subjects)) {
            setValue('subjects', progress.subjects);
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

  // Watch subjects for button disable state
  const selectedSubjects = watch('subjects');

  const onSubmit = async (data: Step3Data) => {
    try {
      // Load existing progress
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const progress = stored ? JSON.parse(stored) : {};

      // Merge this step's data
      const updatedProgress = {
        ...progress,
        subjects: data.subjects,
      };

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));

      // Navigate to next step
      router.push('/onboarding/step-4');
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  if (isLoading) {
    return null; // Or loading spinner
  }

  return (
    <OnboardingLayout
      step={3}
      totalSteps={5}
      title="What inspires you?"
      subtitle="Pick subjects you'd love to get prompts about."
      onNext={handleSubmit(onSubmit)}
      nextDisabled={selectedSubjects.length === 0}
    >
      <Controller
        control={control}
        name="subjects"
        render={({ field }) => (
          <View>
            <ChipGrid
              options={SUBJECT_OPTIONS}
              selectedIds={field.value}
              onToggle={(id) => {
                const current = field.value;
                const newValue = current.includes(id)
                  ? current.filter((subjectId) => subjectId !== id)
                  : [...current, id];
                field.onChange(newValue);
              }}
            />
          </View>
        )}
      />

      {/* Validation error message */}
      {errors.subjects && (
        <Text className="text-red-500 mt-4 text-base">
          {errors.subjects.message}
        </Text>
      )}
    </OnboardingLayout>
  );
}
