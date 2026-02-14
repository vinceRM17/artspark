/**
 * Weekly Recap screen — summary of the past week's art activity
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSession } from '@/components/auth/SessionProvider';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getWeeklyRecap, type WeeklyRecap } from '@/lib/services/weeklyRecap';

export default function RecapScreen() {
  const { session } = useSession();
  const { colors } = useTheme();
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id || (__DEV__ ? 'dev-user' : '');

  useEffect(() => {
    if (!userId) return;
    getWeeklyRecap(userId)
      .then(setRecap)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!recap) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted }}>No recap data available</Text>
      </View>
    );
  }

  const dateRange = `${formatDate(recap.weekStart)} - ${formatDate(recap.weekEnd)}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={{ fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Weekly Recap
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
          {dateRange}
        </Text>
      </Animated.View>

      {/* Motivational message */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={{
        backgroundColor: colors.primaryLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
      }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, lineHeight: 26 }}>
          {recap.message}
        </Text>
      </Animated.View>

      {/* Stats grid */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <StatCard
          value={recap.piecesCreated.toString()}
          label="Pieces Created"
          emoji={'\uD83C\uDFA8'}
          colors={colors}
        />
        <StatCard
          value={recap.currentStreak.toString()}
          label="Day Streak"
          emoji={'\uD83D\uDD25'}
          colors={colors}
        />
        <StatCard
          value={recap.subjectsExplored.toString()}
          label="Subjects"
          emoji={'\uD83C\uDF1F'}
          colors={colors}
        />
      </Animated.View>

      {/* Mediums breakdown */}
      {recap.mediumsUsed.length > 0 && (
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Mediums Used
          </Text>
          {recap.mediumsUsed.map((m, i) => (
            <View key={m.id} style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }}>{m.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: colors.primary,
                  height: 6,
                  borderRadius: 3,
                  width: Math.max(20, (m.count / recap.piecesCreated) * 120),
                }} />
                <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '600', width: 24, textAlign: 'right' }}>
                  {m.count}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

function StatCard({ value, label, emoji, colors }: {
  value: string;
  label: string;
  emoji: string;
  colors: any;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    }}>
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
