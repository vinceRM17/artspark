import { useState } from 'react';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

type NotificationTimePickerProps = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  disabled?: boolean;
};

/**
 * Platform-specific time picker for notification settings
 * - Android: Imperative DateTimePickerAndroid.open API
 * - iOS: Modal DateTimePicker spinner component
 * Displays time in 12-hour format with AM/PM
 */
export default function NotificationTimePicker({
  hour,
  minute,
  onChange,
  disabled = false,
}: NotificationTimePickerProps) {
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  // Format time as 12-hour with AM/PM
  const formatTime = (h: number, m: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minuteStr = m.toString().padStart(2, '0');
    return `${hour12}:${minuteStr} ${period}`;
  };

  const handleAndroidPress = () => {
    if (disabled) return;

    DateTimePickerAndroid.open({
      value: new Date(2024, 0, 1, hour, minute),
      mode: 'time',
      is24Hour: false,
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          onChange(date.getHours(), date.getMinutes());
        }
      },
    });
  };

  const handleIOSChange = (event: any, date?: Date) => {
    if (date) {
      onChange(date.getHours(), date.getMinutes());
    }
  };

  const timeText = formatTime(hour, minute);

  if (Platform.OS === 'android') {
    return (
      <TouchableOpacity onPress={handleAndroidPress} disabled={disabled}>
        <Text
          className={`text-base font-medium ${
            disabled ? 'text-gray-400 opacity-50' : 'text-[#7C9A72]'
          }`}
        >
          {timeText}
        </Text>
      </TouchableOpacity>
    );
  }

  // iOS
  return (
    <View>
      <TouchableOpacity
        onPress={() => !disabled && setShowIOSPicker(!showIOSPicker)}
        disabled={disabled}
      >
        <Text
          className={`text-base font-medium ${
            disabled ? 'text-gray-400 opacity-50' : 'text-[#7C9A72]'
          }`}
        >
          {timeText}
        </Text>
      </TouchableOpacity>
      {showIOSPicker && !disabled && (
        <DateTimePicker
          value={new Date(2024, 0, 1, hour, minute)}
          mode="time"
          display="spinner"
          onChange={handleIOSChange}
        />
      )}
    </View>
  );
}
