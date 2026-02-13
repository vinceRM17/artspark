import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressIndicator from './ProgressIndicator';

type OnboardingLayoutProps = {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSkip?: boolean;
};

/**
 * Shared layout wrapper for all onboarding steps
 * Provides consistent structure: progress, title, scrollable content, action buttons
 * Follows artistic direction with warm cream backgrounds and sage green accents
 */
export default function OnboardingLayout({
  children,
  step,
  totalSteps,
  title,
  subtitle,
  onNext,
  onSkip,
  nextLabel = 'Next',
  nextDisabled = false,
  showSkip = false,
}: OnboardingLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-[#FFF8F0]">
      {/* Progress indicator at top */}
      <ProgressIndicator currentStep={step} totalSteps={totalSteps} />

      {/* Title and subtitle */}
      <View className="px-6 mb-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">{title}</Text>
        {subtitle && <Text className="text-base text-gray-500">{subtitle}</Text>}
      </View>

      {/* Scrollable content area */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Fixed bottom action area */}
      <View className="px-6 pb-6 pt-4 bg-[#FFF8F0]">
        {/* Next button */}
        <TouchableOpacity
          onPress={onNext}
          disabled={nextDisabled}
          className={`
            py-4 rounded-xl items-center justify-center
            ${nextDisabled ? 'bg-gray-300' : 'bg-[#7C9A72]'}
          `}
          activeOpacity={0.8}
        >
          <Text className={`text-lg font-semibold ${nextDisabled ? 'text-gray-500' : 'text-white'}`}>
            {nextLabel}
          </Text>
        </TouchableOpacity>

        {/* Optional skip button */}
        {showSkip && onSkip && (
          <TouchableOpacity onPress={onSkip} className="mt-3 items-center py-2" activeOpacity={0.6}>
            <Text className="text-base text-gray-500">Skip this step</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
