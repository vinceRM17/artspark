import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/components/auth/SessionProvider';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { session, isLoading } = useSession();

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Redirect to sign-in if no session
  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
