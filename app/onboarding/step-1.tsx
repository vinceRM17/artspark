import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChipGrid from '@/components/onboarding/ChipGrid';
import { step1Schema } from '@/lib/schemas/onboarding';
import { MEDIUM_OPTIONS } from '@/lib/constants/preferences';
import { getMediumInfo } from '@/lib/constants/mediums';

type Step1Data = {
  mediums: string[];
};

const STORAGE_KEY = '@artspark:onboarding-progress';

/**
 * Onboarding Step 1: Art Medium Selection (REQUIRED)
 * User selects preferred art mediums with min 1 selection enforced.
 * Shows expandable material info cards and custom medium input.
 */
export default function OnboardingStep1() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMedium, setExpandedMedium] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMediumName, setCustomMediumName] = useState('');

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
            // Check if any custom mediums exist
            const hasCustom = progress.mediums.some((m: string) => m.startsWith('custom:'));
            if (hasCustom) {
              const customName = progress.mediums
                .find((m: string) => m.startsWith('custom:'))
                ?.replace('custom:', '');
              if (customName) {
                setCustomMediumName(customName);
                setShowCustomInput(true);
              }
            }
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

  // Toggle info card for a medium
  const handleInfoToggle = (mediumId: string) => {
    setExpandedMedium(expandedMedium === mediumId ? null : mediumId);
  };

  // Handle adding custom medium
  const handleAddCustomMedium = () => {
    const name = customMediumName.trim();
    if (!name) return;

    const customId = `custom:${name}`;
    const current = selectedMediums;

    // Remove any existing custom medium first
    const filtered = current.filter(m => !m.startsWith('custom:'));
    setValue('mediums', [...filtered, customId]);
  };

  // Handle removing custom medium
  const handleRemoveCustomMedium = () => {
    const filtered = selectedMediums.filter(m => !m.startsWith('custom:'));
    setValue('mediums', filtered);
    setCustomMediumName('');
    setShowCustomInput(false);
  };

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
    return null;
  }

  // Get info for the expanded medium
  const expandedInfo = expandedMedium ? getMediumInfo(expandedMedium) : null;

  // Build options list with "Other" at the end
  const allOptions = [
    ...MEDIUM_OPTIONS,
    { id: '__other__', label: 'Other' },
  ];

  return (
    <OnboardingLayout
      step={1}
      totalSteps={6}
      title="What supplies do you have?"
      subtitle="Select the art materials you have on hand. We'll only suggest prompts you can actually do."
      onNext={handleSubmit(onSubmit)}
      nextDisabled={selectedMediums.length === 0}
    >
      <Controller
        control={control}
        name="mediums"
        render={({ field }) => (
          <View>
            <ChipGrid
              options={allOptions}
              selectedIds={[
                ...field.value.filter(m => !m.startsWith('custom:')),
                ...(field.value.some(m => m.startsWith('custom:')) ? ['__other__'] : []),
              ]}
              onToggle={(id) => {
                if (id === '__other__') {
                  if (showCustomInput) {
                    handleRemoveCustomMedium();
                  } else {
                    setShowCustomInput(true);
                  }
                  return;
                }

                const current = field.value;
                const newValue = current.includes(id)
                  ? current.filter((mediumId) => mediumId !== id)
                  : [...current, id];
                field.onChange(newValue);

                // Toggle info expansion on select
                if (!current.includes(id)) {
                  setExpandedMedium(id);
                } else if (expandedMedium === id) {
                  setExpandedMedium(null);
                }
              }}
            />
          </View>
        )}
      />

      {/* Custom medium input */}
      {showCustomInput && (
        <View className="mt-4 bg-white rounded-xl p-4 border border-[#7C9A72]">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            What medium do you use?
          </Text>
          <TextInput
            value={customMediumName}
            onChangeText={(text) => {
              setCustomMediumName(text);
            }}
            onBlur={handleAddCustomMedium}
            placeholder="e.g. Watercolor pencils, Encaustic..."
            placeholderTextColor="#9CA3AF"
            className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-base text-gray-900"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAddCustomMedium}
          />
          {customMediumName.trim() && (
            <Text className="text-xs text-[#7C9A72] mt-2">
              Will be saved as "{customMediumName.trim()}"
            </Text>
          )}
        </View>
      )}

      {/* Medium info card — shows when a medium is tapped */}
      {expandedInfo && (
        <View className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {expandedInfo.label}
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            {expandedInfo.description}
          </Text>

          <TouchableOpacity
            onPress={() => handleInfoToggle(expandedMedium!)}
          >
            <Text className="text-sm font-medium text-[#7C9A72] mb-2">
              What do I need?
            </Text>
          </TouchableOpacity>

          <View className="ml-2">
            {expandedInfo.materialsNeeded.map((material, i) => (
              <View key={i} className="flex-row items-start mb-1">
                <Text className="text-gray-400 mr-2">-</Text>
                <Text className="text-sm text-gray-700 flex-1">{material}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Validation error message */}
      {errors.mediums && (
        <Text className="text-red-500 mt-4 text-base">
          {errors.mediums.message}
        </Text>
      )}
    </OnboardingLayout>
  );
}
