import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { router } from 'expo-router';

export default function Settings() {
  const { session, signOut } = useSession();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/sign-in');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white px-6 pt-6">
      <View className="mb-8">
        <Text className="text-sm font-medium text-gray-500 mb-1">
          Signed in as
        </Text>
        <Text className="text-base text-gray-900">
          {session?.user?.email}
        </Text>
      </View>

      <TouchableOpacity
        className="bg-red-600 rounded-lg py-3"
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-semibold">
          Log Out
        </Text>
      </TouchableOpacity>

      <Text className="text-xs text-gray-500 mt-4">
        Phase 1: Foundation + Auth complete. Preferences, prompts,
        and other features coming in future phases.
      </Text>
    </View>
  );
}
