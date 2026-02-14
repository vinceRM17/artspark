import { View, Text, TouchableOpacity, Alert } from 'react-native';

type UpgradePromptProps = {
  context?: 'portfolio' | 'prompts' | 'general';
};

const MESSAGES: Record<string, { title: string; subtitle: string }> = {
  portfolio: {
    title: 'Save your artwork',
    subtitle: 'Upgrade to build your portfolio and track your artistic journey.',
  },
  prompts: {
    title: 'Unlock more prompts',
    subtitle: 'Upgrade to generate up to 10 prompts per day.',
  },
  general: {
    title: 'Unlock more features',
    subtitle: 'Upgrade to save artwork, get more prompts, and join the community.',
  },
};

/**
 * Upgrade CTA card shown to free tier users
 */
export default function UpgradePrompt({ context = 'general' }: UpgradePromptProps) {
  const message = MESSAGES[context];

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'Subscriptions will be available in a future update. Stay tuned!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="bg-[#F0F5EE] rounded-xl p-4 mb-3 border border-[#7C9A72]/20">
      <Text className="text-base font-semibold text-[#5A7A50] mb-1">
        {message.title}
      </Text>
      <Text className="text-sm text-[#5A7A50]/70 mb-3">
        {message.subtitle}
      </Text>
      <TouchableOpacity
        onPress={handleUpgrade}
        className="bg-[#7C9A72] rounded-lg py-2.5"
      >
        <Text className="text-white text-center font-semibold">
          Upgrade
        </Text>
      </TouchableOpacity>
    </View>
  );
}
