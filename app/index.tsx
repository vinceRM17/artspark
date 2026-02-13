import { Redirect } from 'expo-router';
import { useSession } from '@/components/auth/SessionProvider';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, isLoading } = useSession();

  // Dev bypass: skip auth entirely in development
  if (__DEV__) {
    return <Redirect href="/(auth)" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/sign-in" />;
}
