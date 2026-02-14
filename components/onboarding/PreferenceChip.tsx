import { TouchableOpacity, Text } from 'react-native';

type PreferenceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Tappable chip/pill component for preference selection
 * Follows artistic direction with sage green accents
 */
export default function PreferenceChip({ label, selected, onPress }: PreferenceChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      className={`
        px-4 py-2.5 rounded-full min-h-[44px] items-center justify-center
        ${
          selected
            ? 'bg-[#7C9A72]' // Selected: sage green background
            : 'bg-[#FFF8F0] border-2 border-gray-300' // Unselected: cream with border
        }
      `}
      activeOpacity={0.7}
    >
      <Text
        className={`text-base font-medium ${
          selected ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
