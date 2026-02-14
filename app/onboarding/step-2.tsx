import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChipGrid from '@/components/onboarding/ChipGrid';
import { step2Schema } from '@/lib/schemas/onboarding';
import { COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';
import { DIFFICULTY_OPTIONS, DifficultyLevel } from '@/lib/constants/difficulty';

type Step2Data = {
  colorPalettes?: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 2: Difficulty Level + Color Palette Preferences
 * Difficulty is required, color palettes are optional
 */
export default function OnboardingStep2() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');

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
          if (progress.difficulty) {
            setDifficulty(progress.difficulty);
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
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const progress = stored ? JSON.parse(stored) : {};

      const updatedProgress = {
        ...progress,
        colorPalettes,
        difficulty,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
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
    return null;
  }

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      title="Tell us about yourself"
      subtitle="This helps us tailor prompts to your experience level."
      onNext={handleSubmit(onSubmit)}
      onSkip={onSkip}
      showSkip={true}
      nextDisabled={false}
    >
      {/* Difficulty selector */}
      <Text className="text-sm font-semibold text-gray-700 mb-3">
        Skill Level
      </Text>
      <View className="mb-6">
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
      </View>

      {/* Color palettes */}
      <Text className="text-sm font-semibold text-gray-700 mb-3">
        Color Preferences (optional)
      </Text>
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
