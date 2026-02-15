import { ScrollView, View, Text } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function PrivacyPolicy() {
  const { colors } = useTheme();

  const sections = [
    {
      title: 'Your Privacy Matters',
      body: 'ArtSpark is designed to inspire your creativity, not to collect your personal data. This policy explains what information we handle and how we protect it.',
    },
    {
      title: 'Photos & Artwork',
      body: 'Photos you upload are yours. ArtSpark does not share your images with AI services, use them for training, or sell them for commercial purposes. All uploaded artwork remains the property of the creator. Photos are stored securely and only visible to you unless you choose to share them.',
    },
    {
      title: 'Account Information',
      body: 'When you create an account, we store your email address for authentication purposes. We do not sell or share your email with third parties.',
    },
    {
      title: 'App Data',
      body: 'Your preferences (art mediums, subjects, skill level), prompt history, streaks, and challenge progress are stored to personalize your experience. This data is tied to your account and is not shared with anyone.',
    },
    {
      title: 'Notifications',
      body: 'If you enable daily reminders, we schedule local notifications on your device. We do not send marketing notifications or share your notification preferences.',
    },
    {
      title: 'Analytics & Crash Reporting',
      body: 'We collect anonymous usage data (e.g., which features are used most) to improve the app. This data cannot be used to identify you personally. We use Sentry for crash reporting in production builds to identify and fix bugs. Crash reports may include device type, OS version, and error details, but do not include your artwork or personal content.',
    },
    {
      title: 'Third-Party Services',
      body: 'ArtSpark uses Supabase for secure data storage and authentication, and Sentry for crash reporting. Reference photos shown in the app come from Pexels, Unsplash, or Wikimedia Commons and are subject to their respective licenses.',
    },
    {
      title: 'Data Deletion',
      body: 'You can delete your prompt history from Settings at any time. To delete your entire account and all associated data, please contact us at support@artspark.app.',
    },
    {
      title: 'Children\'s Privacy',
      body: 'ArtSpark offers a Kids skill level for young artists. We do not knowingly collect personal information from children under 13 without parental consent. The Kids mode is designed to be used with parental supervision.',
    },
    {
      title: 'Changes to This Policy',
      body: 'We may update this policy from time to time. Any changes will be reflected in the app with an updated date.',
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
          Last updated: February 2026
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 6,
            }}>
              {section.title}
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 22,
            }}>
              {section.body}
            </Text>
          </View>
        ))}

        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginTop: 12,
        }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            Questions or concerns? Contact us at support@artspark.app
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
