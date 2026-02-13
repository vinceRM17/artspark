import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { router, useLocalSearchParams } from 'expo-router';

export default function VerifyOtp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyOtp, signIn } = useSession();

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the code from your email');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email address is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(email, otp.trim());
      // On success, onAuthStateChange will update session
      // Protected route guard will automatically redirect to /(auth)
      router.replace('/(auth)');
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid or expired code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await signIn(email);
      Alert.alert('Code Resent', 'Check your email for a new login code');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold mb-2">Check your email</Text>
      <Text className="text-gray-600 mb-8">
        We sent a code to {email}
      </Text>

      <Text className="text-sm font-medium text-gray-700 mb-2">
        Verification Code
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base text-center tracking-widest"
        placeholder="000000"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        autoFocus
        maxLength={6}
        editable={!isLoading}
      />

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-3 mb-4"
        onPress={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Verify Code
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={isLoading}>
        <Text className="text-blue-600 text-center text-sm">
          Didn't receive a code? Resend
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} className="mt-4">
        <Text className="text-gray-600 text-center text-sm">
          Back to sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
}
