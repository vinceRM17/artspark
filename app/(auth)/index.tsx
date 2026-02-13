import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/components/auth/SessionProvider';

export default function Home() {
  const { session } = useSession();

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold mb-2">Welcome!</Text>
      <Text className="text-gray-600 mb-8">
        You're signed in as {session?.user?.email}
      </Text>

      <Text className="text-gray-500 mb-4">
        This is a placeholder home screen for Phase 1.
        Daily prompts will appear here in Phase 3.
      </Text>

      <TouchableOpacity
        className="bg-gray-200 rounded-lg py-3"
        onPress={() => router.push('/(auth)/settings')}
      >
        <Text className="text-gray-800 text-center font-semibold">
          Go to Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}
