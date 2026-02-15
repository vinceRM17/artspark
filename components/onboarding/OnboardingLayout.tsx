import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressIndicator from './ProgressIndicator';
import FloatingLeaves from '@/components/botanical/FloatingLeaves';
import LeafCorner from '@/components/botanical/LeafCorner';
import VineDivider from '@/components/botanical/VineDivider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type OnboardingLayoutProps = {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onNext: () => void;
  onBack?: () => void;
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
  onBack,
  onSkip,
  nextLabel = 'Next',
  nextDisabled = false,
  showSkip = false,
}: OnboardingLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-[#FFF8F0]">
      {/* Background botanical decoration */}
      <FloatingLeaves width={screenWidth} height={screenHeight} opacity={0.08} />

      {/* Corner leaf decorations */}
      <LeafCorner size={80} opacity={0.15} position="topRight" />
      <LeafCorner size={80} opacity={0.15} position="bottomLeft" />

      {/* Warm gradient header band */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          backgroundColor: '#FFF2E0',
          opacity: 0.5,
        }}
        pointerEvents="none"
      />

      {/* Back button (shown on steps after the first) */}
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          className="px-6 pt-3 pb-1"
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="text-[#7C9A72] text-base">{'\u2190'} Back</Text>
        </TouchableOpacity>
      )}

      {/* Progress indicator at top */}
      <ProgressIndicator currentStep={step} totalSteps={totalSteps} />

      {/* Title and subtitle */}
      <View className="px-6 mb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-2">{title}</Text>
        {subtitle && <Text className="text-base text-gray-500">{subtitle}</Text>}
      </View>

      {/* Botanical vine divider */}
      <View className="mb-4">
        <VineDivider width={screenWidth * 0.6} opacity={0.25} />
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
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          accessibilityState={{ disabled: nextDisabled }}
        >
          <Text style={{ color: nextDisabled ? '#6B7280' : '#FFFFFF' }} className="text-lg font-semibold">
            {nextLabel}
          </Text>
        </TouchableOpacity>

        {/* Optional skip button */}
        {showSkip && onSkip && (
          <TouchableOpacity
            onPress={onSkip}
            className="mt-3 items-center py-2"
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Skip this step"
          >
            <Text className="text-base text-gray-500">Skip this step</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
