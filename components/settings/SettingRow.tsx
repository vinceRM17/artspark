import { View, Text, TouchableOpacity } from 'react-native';

type SettingRowProps = {
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

/**
 * Individual setting row with label, optional description, and right-side control slot
 * Can be tappable (onPress provided) or static
 */
export default function SettingRow({
  label,
  description,
  rightElement,
  onPress,
  disabled = false,
}: SettingRowProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress
    ? {
        onPress,
        disabled,
        activeOpacity: 0.7,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex-row items-center justify-between px-4 py-3.5 min-h-[52px] border-b border-gray-100"
    >
      <View className="flex-1">
        <Text className={`text-base ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </Text>
        {description && (
          <Text className="text-xs text-gray-500 mt-0.5">
            {description}
          </Text>
        )}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </Wrapper>
  );
}
