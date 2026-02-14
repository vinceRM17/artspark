/**
 * Individual badge card with locked/unlocked states
 */

import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { BadgeDefinition } from '@/lib/constants/badges';

type BadgeCardProps = {
  badge: BadgeDefinition;
  unlocked: boolean;
  index: number;
};

export default function BadgeCard({ badge, unlocked, index }: BadgeCardProps) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, { damping: 12 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          backgroundColor: unlocked ? '#FFFFFF' : '#F9FAFB',
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          borderWidth: unlocked ? 2 : 1,
          borderColor: unlocked ? '#7C9A72' : '#E5E7EB',
          opacity: unlocked ? 1 : 0.5,
        }}
      >
        <Text style={{ fontSize: 36, marginBottom: 8 }}>
          {unlocked ? badge.icon : '\uD83D\uDD12'}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: unlocked ? '#111827' : '#9CA3AF',
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {badge.name}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: unlocked ? '#6B7280' : '#D1D5DB',
            textAlign: 'center',
          }}
          numberOfLines={2}
        >
          {badge.description}
        </Text>
      </View>
    </Animated.View>
  );
}
