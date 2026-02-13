import { View, Text } from 'react-native';

type SettingSectionProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * Grouped settings section with header label
 * Renders a section header and white card containing child rows
 * Follows iOS Settings app pattern
 */
export default function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <View>
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 pt-6 pb-2">
        {title}
      </Text>
      <View className="bg-white rounded-xl mx-4 overflow-hidden">
        {children}
      </View>
    </View>
  );
}
