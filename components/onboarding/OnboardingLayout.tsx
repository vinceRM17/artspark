import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressIndicator from './ProgressIndicator';
import FloatingLeaves from '@/components/botanical/FloatingLeaves';
import LeafAccent from '@/components/botanical/LeafAccent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
 * Includes subtle botanical leaf decorations
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
      {/* Background botanical decoration */}
      <FloatingLeaves width={screenWidth} height={screenHeight} opacity={0.04} />

      {/* Progress indicator at top */}
      <ProgressIndicator currentStep={step} totalSteps={totalSteps} />

      {/* Title and subtitle with leaf accent */}
      <View className="px-6 mb-4">
        <View className="flex-row items-start">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-2">{title}</Text>
            {subtitle && <Text className="text-base text-gray-500">{subtitle}</Text>}
          </View>
          <LeafAccent size={36} opacity={0.2} rotation={-20} style={{ marginTop: 4 }} />
        </View>
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
          style={{ backgroundColor: nextDisabled ? '#D1D5DB' : '#7C9A72' }}
          className="py-4 rounded-xl items-center justify-center"
          activeOpacity={0.8}
        >
          <Text style={{ color: nextDisabled ? '#6B7280' : '#FFFFFF' }} className="text-lg font-semibold">
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
