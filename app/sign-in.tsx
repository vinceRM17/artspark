import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { router, Redirect } from 'expo-router';
import FloatingLeaves from '@/components/botanical/FloatingLeaves';
import VineDivider from '@/components/botanical/VineDivider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session, signIn } = useSession();

  // If already logged in, redirect to home
  if (session) {
    return <Redirect href="/(auth)" />;
  }

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.toLowerCase().trim());
      Alert.alert(
        'Check your email',
        'We sent you a login code. Enter it on the next screen.',
        [
          {
            text: 'OK',
            onPress: () => router.push({ pathname: '/verify-otp', params: { email: email.toLowerCase().trim() } }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send login code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FFF8F0] px-6 justify-center">
      <FloatingLeaves width={screenWidth} height={screenHeight} opacity={0.05} />
      <Text className="text-3xl font-bold mb-1 text-gray-900">Welcome to</Text>
      <Text className="text-3xl font-bold mb-2 text-[#7C9A72]">ArtSpark</Text>
      <VineDivider width={160} opacity={0.25} />
      <Text className="text-gray-500 mb-8 mt-2">
        Sign in to get your daily art inspiration
      </Text>

      <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        editable={!isLoading}
        accessibilityLabel="Email address"
        accessibilityHint="Enter your email to receive a login code"
      />

      <TouchableOpacity
        className="bg-[#7C9A72] rounded-xl py-3 mb-4"
        onPress={handleSignIn}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Send login code"
        accessibilityState={{ disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Send Login Code
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-xs text-gray-500 text-center">
        We'll send you a one-time code to sign in. No passwords needed.
      </Text>

      {__DEV__ && (
        <TouchableOpacity
          className="mt-8 border border-gray-300 rounded-lg py-3"
          onPress={async () => {
            setIsLoading(true);
            try {
              const devEmail = 'dev@artspark.local';
              const devPassword = 'devpassword123';
              // Try sign in first, then sign up if no account
              const { error: signInError } = await (await import('@/lib/supabase')).supabase.auth.signInWithPassword({
                email: devEmail,
                password: devPassword,
              });
              if (signInError) {
                const { error: signUpError } = await (await import('@/lib/supabase')).supabase.auth.signUp({
                  email: devEmail,
                  password: devPassword,
                  options: { data: { display_name: 'Dev User' } },
                });
                if (signUpError) throw signUpError;
              }
              router.replace('/(auth)');
            } catch (error: any) {
              Alert.alert('Dev Login Error', error.message);
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <Text className="text-gray-500 text-center text-sm">
            Dev: Skip Login
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
