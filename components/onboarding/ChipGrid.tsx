import { View } from 'react-native';
import PreferenceChip from './PreferenceChip';

type ChipOption = {
  id: string;
  label: string;
};

type ChipGridProps = {
  options: ChipOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  columns?: number;
};

/**
 * Multi-select chip grid component
 * Renders a flex-wrapped grid of PreferenceChip components
 * Parent manages selected state (controlled component)
 */
export default function ChipGrid({
  options,
  selectedIds,
  onToggle,
  columns = 3,
}: ChipGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((option) => (
        <PreferenceChip
          key={option.id}
          label={option.label}
          selected={selectedIds.includes(option.id)}
          onPress={() => onToggle(option.id)}
        />
      ))}
    </View>
  );
}
