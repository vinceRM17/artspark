import { View, Text } from 'react-native';

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

/**
 * Dot-based progress indicator for onboarding steps
 * Shows current position in the onboarding flow
 */
export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <View className="items-center py-6">
      {/* Dot row */}
      <View className="flex-row gap-2 mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <View
              key={stepNumber}
              className={`w-2.5 h-2.5 rounded-full ${
                isActive
                  ? 'bg-[#7C9A72]' // Active: sage green
                  : isCompleted
                  ? 'bg-[#A8C5A0]' // Completed: lighter green
                  : 'bg-gray-300' // Upcoming: light gray
              }`}
            />
          );
        })}
      </View>

      {/* Step text */}
      <Text className="text-sm text-gray-500">
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}
