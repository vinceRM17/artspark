/**
 * Home screen - Today's prompt display
 *
 * Shows the daily personalized prompt in a large artistic card
 * with botanical decorations, reference images, thumbs up/down
 * feedback, tutorial links (for explorer level), and action buttons.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useDailyPrompt } from '@/lib/hooks/useDailyPrompt';
import { MEDIUM_OPTIONS, COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';
import { fetchReferenceImages, ReferenceImage } from '@/lib/services/referenceImages';
import { savePreferences, getPreferences } from '@/lib/services/preferences';
import { useSession } from '@/components/auth/SessionProvider';
import { getTutorialLinks, TutorialLink } from '@/lib/constants/mediums';
import { getDifficultyOption } from '@/lib/constants/difficulty';
import { TIER_LIMITS, UserTier } from '@/lib/constants/tiers';
import UpgradePrompt from '@/components/tiers/UpgradePrompt';
import LeafCorner from '@/components/botanical/LeafCorner';
import VineDivider from '@/components/botanical/VineDivider';
import FloatingLeaves from '@/components/botanical/FloatingLeaves';
import FeedbackModal from '@/components/prompts/FeedbackModal';
import StreakCounter from '@/components/streaks/StreakCounter';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import { useStreak } from '@/lib/hooks/useStreak';
import { useChallenges } from '@/lib/hooks/useChallenges';
import { useBadges } from '@/lib/hooks/useBadges';
import { useTheme } from '@/lib/theme/ThemeContext';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/utils/haptics';

const { width: screenWidth } = Dimensions.get('window');
const FREE_PROMPT_KEY = '@artspark:free-prompt-count';

// Helper to look up display labels from preference IDs
function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find(o => o.id === id)?.label || id;
}

export default function Home() {
  const { prompt, loading, error, generating, generateManualPrompt } = useDailyPrompt();
  const { streak, loading: streakLoading } = useStreak();
  const { active: activeChallenges } = useChallenges();
  const { unlockedCount, totalCount } = useBadges();
  const { colors } = useTheme();
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [userDifficulty, setUserDifficulty] = useState<string>('developing');
  const [freePromptUsed, setFreePromptUsed] = useState(false);

  const { session } = useSession();
  const userId = session?.user?.id;

  // Load user tier and difficulty
  useEffect(() => {
    async function loadUserInfo() {
      if (userId) {
        try {
          const prefs = await getPreferences(userId);
          if (prefs) {
            setUserTier((prefs as any).tier || 'basic');
            setUserDifficulty(prefs.difficulty || 'developing');
          }
        } catch {
          // Default to basic for authenticated users
          setUserTier('basic');
        }
      } else if (__DEV__) {
        // Dev mode: load difficulty from AsyncStorage
        try {
          const progressJson = await AsyncStorage.getItem('@artspark:onboarding-progress');
          if (progressJson) {
            const progress = JSON.parse(progressJson);
            if (progress.difficulty) setUserDifficulty(progress.difficulty);
          }
        } catch {}
        setUserTier('basic'); // Dev mode gets basic tier features
      } else {
        // No auth, no dev = free tier
        setUserTier('free');
        // Check if free prompt already used today
        const today = new Date().toISOString().split('T')[0];
        const stored = await AsyncStorage.getItem(FREE_PROMPT_KEY);
        if (stored === today) {
          setFreePromptUsed(true);
        }
      }
    }
    loadUserInfo();
  }, [userId]);

  // Track free tier prompt usage
  useEffect(() => {
    if (prompt && userTier === 'free' && !userId) {
      const today = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem(FREE_PROMPT_KEY, today);
      setFreePromptUsed(true);
    }
  }, [prompt, userTier, userId]);

  // Fetch reference images when prompt changes
  useEffect(() => {
    if (prompt) {
      setImagesLoading(true);
      setLiked(null);
      fetchReferenceImages(prompt.subject, prompt.medium, 3)
        .then(setReferenceImages)
        .catch(() => setReferenceImages([]))
        .finally(() => setImagesLoading(false));
    }
  }, [prompt?.id]);

  // Handle thumbs up
  const handleThumbsUp = () => {
    hapticLight();
    setLiked(true);
  };

  // Handle thumbs down - show feedback modal
  const handleThumbsDown = () => {
    if (!prompt) return;
    hapticLight();
    setFeedbackVisible(true);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (
    reasons: ('subject' | 'medium' | 'twist' | 'other')[],
    updatePrefs: boolean
  ) => {
    setFeedbackVisible(false);
    setLiked(false);

    if (updatePrefs && prompt) {
      try {
        if (!userId && __DEV__) {
          console.log('[Dev] Would update preferences:', reasons);
        } else if (userId) {
          const currentPrefs = await getPreferences(userId);
          if (currentPrefs) {
            const updates: Record<string, any> = {};

            if (reasons.includes('subject')) {
              const currentExclusions = currentPrefs.exclusions || [];
              if (!currentExclusions.includes(prompt.subject)) {
                updates.exclusions = [...currentExclusions, prompt.subject];
              }
            }

            if (reasons.includes('medium')) {
              const currentMediums = currentPrefs.art_mediums || [];
              updates.art_mediums = currentMediums.filter(
                (m: string) => m !== prompt.medium
              );
            }

            if (Object.keys(updates).length > 0) {
              await savePreferences(userId, updates);
            }
          }
        }
      } catch (err) {
        console.error('Failed to update preferences from feedback:', err);
      }
    }

    generateManualPrompt();
  };

  // Get tier limits
  const tierLimits = TIER_LIMITS[userTier];

  // Get tutorial links for current medium (explorer level only)
  const difficulty = getDifficultyOption(userDifficulty);
  const tutorials: TutorialLink[] =
    difficulty.id === 'explorer' && prompt
      ? getTutorialLinks(prompt.medium)
      : [];

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <FloatingLeaves width={screenWidth} height={600} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 14 }}>Preparing your prompt...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          onPress={() => router.replace('/(auth)')}
        >
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No prompt state
  if (!prompt) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No prompt available</Text>
      </View>
    );
  }

  // Success state - show prompt card
  const mediumLabel = getLabel(MEDIUM_OPTIONS, prompt.medium);
  const colorLabel = prompt.color_rule ? getLabel(COLOR_PALETTE_OPTIONS, prompt.color_rule) : null;

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 }}>
          {/* Header with botanical accent */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: colors.primary, textAlign: 'center', fontSize: 18, fontWeight: '600', letterSpacing: 2 }}>
              ArtSpark
            </Text>
            <VineDivider width={140} />
            <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              {prompt.source === 'daily' ? "Today's Prompt" : 'Extra Prompt'}
            </Text>
          </View>

          {/* Streak Counter */}
          {!streakLoading && <StreakCounter streak={streak} />}

          {/* Badges Summary Chip */}
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.push('/(auth)/badges');
            }}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>{'\u2728'}</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                {unlockedCount} of {totalCount} unlocked
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>
              View All
            </Text>
          </TouchableOpacity>

          {/* Active Challenge Card */}
          {activeChallenges.length > 0 && (
            <ChallengeCard activeChallenge={activeChallenges[0]} />
          )}

          {/* Main Prompt Card with leaf corners */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
            <LeafCorner position="topRight" size={70} opacity={0.1} />
            <LeafCorner position="bottomLeft" size={55} opacity={0.08} />

            {/* Prompt Text */}
            <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, lineHeight: 34, paddingRight: 24 }}>
              {prompt.prompt_text}
            </Text>

            {/* Details Section */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Medium</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>{mediumLabel}</Text>
              </View>

              {colorLabel && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Colors</Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{colorLabel}</Text>
                </View>
              )}

              {prompt.twist && (
                <View>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Twist</Text>
                  <Text style={{ fontSize: 14, color: colors.primary, fontStyle: 'italic' }}>{prompt.twist}</Text>
                </View>
              )}
            </View>

            {/* Thumbs Up / Down Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                onPress={handleThumbsUp}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  marginRight: 16,
                  backgroundColor: liked === true ? colors.primaryLight : colors.inputBg,
                  borderWidth: 1,
                  borderColor: liked === true ? colors.primary : colors.border,
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 20 }}>{'👍'}</Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: '500',
                    color: liked === true ? colors.primary : colors.textMuted,
                  }}
                >
                  Love it
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleThumbsDown}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  backgroundColor: liked === false ? '#FEF2F2' : colors.inputBg,
                  borderWidth: 1,
                  borderColor: liked === false ? colors.error : colors.border,
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 20 }}>{'👎'}</Text>
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: '500',
                    color: liked === false ? colors.error : colors.textMuted,
                  }}
                >
                  Not for me
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Learning Resources (Explorer level only) */}
          {tutorials.length > 0 && (
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#5A7A50', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Learning Resources
              </Text>
              {tutorials.map((link, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(link.url)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.primary, marginRight: 8 }}>{'>'}</Text>
                  <Text style={{ fontSize: 14, color: '#5A7A50', textDecorationLine: 'underline', flex: 1 }}>
                    {link.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Reference Images Section */}
          {(referenceImages.length > 0 || imagesLoading) && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Reference Inspiration
              </Text>
              {imagesLoading ? (
                <View style={{ height: 128, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 }}>
                    {referenceImages.map((img) => {
                      const imgWidth = (screenWidth - 48 - 8 * (referenceImages.length - 1)) / referenceImages.length;
                      return (
                        <TouchableOpacity
                          key={img.id}
                          onPress={() => Linking.openURL(img.url)}
                          activeOpacity={0.8}
                          style={{ width: imgWidth }}
                        >
                          <Image
                            source={{ uri: img.thumbUrl }}
                            style={{ width: imgWidth, height: imgWidth * 0.75, borderRadius: 8 }}
                            resizeMode="cover"
                          />
                          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }} numberOfLines={1}>
                            {img.photographer}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 10, color: colors.border, textAlign: 'right' }}>
                    Reference photos
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Vine divider before actions */}
          <VineDivider width={200} opacity={0.15} />

          {/* Action Buttons */}
          <View style={{ marginTop: 16 }}>
            {/* Add to My Portfolio (hidden for free tier) */}
            {tierLimits.canSavePhotos ? (
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, marginBottom: 12 }}
                onPress={() => {
                  hapticMedium();
                  if (prompt) {
                    router.push({
                      pathname: '/(auth)/respond',
                      params: { prompt_id: prompt.id, prompt_text: prompt.prompt_text }
                    });
                  }
                }}
              >
                <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                  Add to My Portfolio
                </Text>
              </TouchableOpacity>
            ) : (
              <UpgradePrompt context="portfolio" />
            )}

            {/* Generate New */}
            {userTier === 'free' && freePromptUsed && !__DEV__ ? (
              <View style={{ backgroundColor: colors.border, borderRadius: 12, paddingVertical: 16, marginBottom: 12 }}>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                  Generate New
                </Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                  Upgrade to unlock more prompts
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, paddingVertical: 16 }}
                onPress={() => {
                  hapticMedium();
                  generateManualPrompt();
                }}
                disabled={generating}
              >
                <Text style={{ color: colors.primary, textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                  {generating ? 'Generating...' : 'Generate New'}
                </Text>
              </TouchableOpacity>
            )}

            {/* View History */}
            <TouchableOpacity
              style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, marginTop: 12 }}
              onPress={() => router.push('/(auth)/history')}
            >
              <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 18, fontWeight: '600' }}>
                View History
              </Text>
            </TouchableOpacity>

            {/* Gallery & Challenges row */}
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, paddingVertical: 16 }}
                onPress={() => router.push('/(auth)/gallery')}
              >
                <Text style={{ color: colors.primary, textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
                  My Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, paddingVertical: 16 }}
                onPress={() => router.push('/(auth)/challenges')}
              >
                <Text style={{ color: colors.primary, textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
                  Challenges
                </Text>
              </TouchableOpacity>
            </View>

            {/* Settings Link */}
            <TouchableOpacity
              style={{ marginTop: 32 }}
              onPress={() => router.push('/(auth)/settings')}
            >
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 14, textDecorationLine: 'underline' }}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackVisible}
        prompt={prompt}
        onSubmit={handleFeedbackSubmit}
        onCancel={() => setFeedbackVisible(false)}
      />
    </>
  );
}
