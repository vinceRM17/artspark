import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

type DangerZoneProps = {
  onResetHistory: () => void;
  resetting?: boolean;
};

/**
 * Danger Zone settings section
 * Red-styled section with destructive actions (reset history)
 * Includes built-in confirmation dialog
 */
export default function DangerZone({ onResetHistory, resetting = false }: DangerZoneProps) {
  const handleResetPress = () => {
    Alert.alert(
      'Reset Prompt History',
      'This will permanently delete all your saved prompts, responses, and artwork. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: onResetHistory,
        },
      ]
    );
  };

  return (
    <View>
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 pt-6 pb-2">
        Danger Zone
      </Text>
      <View className="bg-red-50 rounded-xl mx-4 p-4">
        <Text className="text-xs text-red-400 mb-3">
          These actions cannot be undone.
        </Text>
        <TouchableOpacity
          onPress={handleResetPress}
          disabled={resetting}
          className="bg-red-600 rounded-lg py-3 px-4 items-center"
          activeOpacity={0.7}
        >
          {resetting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Reset Prompt History
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
