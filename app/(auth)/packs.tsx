/**
 * Prompt Packs screen — seasonal & themed curated prompt collections
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { getActivePacks, getRandomPackPrompt, type PromptPack } from '@/lib/constants/seasonalPacks';
import { useTheme } from '@/lib/theme/ThemeContext';
import { hapticLight, hapticMedium } from '@/lib/utils/haptics';

export default function PacksScreen() {
  const { colors } = useTheme();
  const packs = getActivePacks();

  const seasonalPacks = packs.filter(p => p.type === 'seasonal');
  const themedPacks = packs.filter(p => p.type === 'themed');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Seasonal section */}
      {seasonalPacks.length > 0 && (
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
          }}>
            In Season Now
          </Text>
          {seasonalPacks.map((pack, i) => (
            <PackCard key={pack.id} pack={pack} index={i} colors={colors} />
          ))}
        </Animated.View>
      )}

      {/* Themed section */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <Text style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
          marginTop: seasonalPacks.length > 0 ? 12 : 0,
        }}>
          Themed Collections
        </Text>
        {themedPacks.map((pack, i) => (
          <PackCard key={pack.id} pack={pack} index={i} colors={colors} />
        ))}
      </Animated.View>
    </ScrollView>
  );
}

function PackCard({ pack, index, colors }: { pack: PromptPack; index: number; colors: any }) {
  const [expanded, setExpanded] = useState(false);

  const handleTryRandom = () => {
    hapticMedium();
    const prompt = getRandomPackPrompt(pack.id);
    if (prompt) {
      Alert.alert(
        `${pack.emoji} ${pack.name}`,
        prompt.text,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Art',
            onPress: () => {
              router.push({
                pathname: '/(auth)/respond',
                params: { prompt_text: prompt.text },
              });
            },
          },
        ]
      );
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100 * index)}>
      <TouchableOpacity
        onPress={() => { hapticLight(); setExpanded(!expanded); }}
        activeOpacity={0.85}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 28, marginRight: 12 }}>{pack.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                {pack.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                {pack.description}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {pack.prompts.length} prompts
          </Text>
        </View>

        {expanded && (
          <View style={{ marginTop: 16 }}>
            {pack.prompts.map((prompt, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  hapticLight();
                  router.push({
                    pathname: '/(auth)/respond',
                    params: { prompt_text: prompt.text },
                  });
                }}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                  {prompt.text}
                </Text>
                {prompt.medium && (
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                    Suggested: {prompt.medium}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={handleTryRandom}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                marginTop: 12,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#FFF', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                Try a Random Prompt
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
