import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { step2Schema } from '@/lib/schemas/onboarding';
import { COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';
import { DIFFICULTY_OPTIONS, DifficultyLevel } from '@/lib/constants/difficulty';
import { PALETTE_INFO } from '@/lib/constants/palettes';

type Step2Data = {
  colorPalettes?: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 2: Difficulty Level + Color Palette Preferences
 * Difficulty is required, color palettes are optional.
 * Shows visual palette swatch previews and explorer callout.
 */
export default function OnboardingStep2() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('developing');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { colorPalettes: [] },
  });

  const selectedPalettes = watch('colorPalettes') || [];

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
            // Handle legacy values
            const legacyMap: Record<string, DifficultyLevel> = {
              beginner: 'explorer',
              intermediate: 'developing',
              advanced: 'confident',
            };
            setDifficulty(legacyMap[progress.difficulty] || progress.difficulty);
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
      totalSteps={6}
      title="Tell us about yourself"
      subtitle="This helps us tailor prompts to your experience level."
      onNext={handleSubmit(onSubmit)}
      onBack={() => router.back()}
      onSkip={onSkip}
      showSkip={true}
      nextDisabled={false}
    >
      {/* Difficulty selector */}
      <Text className="text-sm font-semibold text-gray-700 mb-3">
        Skill Level
      </Text>
      <View className="mb-4">
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

      {/* Explorer callout */}
      {difficulty === 'explorer' && (
        <View className="bg-[#F0F5EE] rounded-xl p-4 mb-4 border border-[#7C9A72]/20">
          <Text className="text-sm text-[#5A7A50] font-medium">
            We'll include helpful tips and tutorials in your prompts!
          </Text>
        </View>
      )}

      {/* Color palettes with visual swatches */}
      <Text className="text-sm font-semibold text-gray-700 mb-3">
        Color Preferences (optional)
      </Text>
      <Controller
        control={control}
        name="colorPalettes"
        render={({ field }) => (
          <View>
            {COLOR_PALETTE_OPTIONS.map((option) => {
              const palette = PALETTE_INFO[option.id];
              const selected = (field.value || []).includes(option.id);

              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    const current = field.value || [];
                    const newValue = current.includes(option.id)
                      ? current.filter((id) => id !== option.id)
                      : [...current, option.id];
                    field.onChange(newValue);
                  }}
                  className="mb-2 rounded-xl border p-4"
                  style={{
                    borderColor: selected ? '#7C9A72' : '#E5E7EB',
                    backgroundColor: selected ? '#F0F5EE' : '#FFFFFF',
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text
                        className="font-semibold text-base"
                        style={{ color: selected ? '#7C9A72' : '#374151' }}
                      >
                        {option.label}
                      </Text>
                      {palette && (
                        <Text className="text-xs text-gray-400 mt-1">
                          {palette.description}
                        </Text>
                      )}
                    </View>

                    {/* Color swatch dots */}
                    {palette && (
                      <View className="flex-row items-center">
                        {palette.hexColors.map((hex, i) => (
                          <View
                            key={i}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              backgroundColor: hex,
                              marginLeft: i > 0 ? -4 : 0,
                              borderWidth: 1.5,
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
        )}
      />
    </OnboardingLayout>
  );
}
