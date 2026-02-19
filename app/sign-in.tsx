import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/components/auth/SessionProvider';
import { router, Redirect } from 'expo-router';
import FloatingLeaves from '@/components/botanical/FloatingLeaves';
import VineDivider from '@/components/botanical/VineDivider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session, signIn } = useSession();
  const insets = useSafeAreaInsets();

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
    <View className="flex-1 bg-[#FFF8F0]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <FloatingLeaves width={screenWidth} height={screenHeight} opacity={0.05} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-bold text-gray-900" style={{ marginBottom: 4 }}>Welcome to</Text>
          <Text className="text-3xl font-bold text-[#7C9A72]" style={{ marginBottom: 8 }}>ArtSpark</Text>
          <VineDivider width={160} opacity={0.25} />
          <Text className="text-gray-500" style={{ marginTop: 10, marginBottom: 32 }}>
            Sign in to get your daily art inspiration
          </Text>

          <Text className="text-sm font-medium text-gray-700" style={{ marginBottom: 8 }}>Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            style={{ marginBottom: 16 }}
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
            className="bg-[#7C9A72] rounded-xl py-3"
            style={{ marginBottom: 16 }}
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
              className="border border-gray-300 rounded-lg py-3"
              style={{ marginTop: 32 }}
              onPress={async () => {
                setIsLoading(true);
                try {
                  const devEmail = 'dev@artspark.local';
                  const devPassword = 'devpassword123';
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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
