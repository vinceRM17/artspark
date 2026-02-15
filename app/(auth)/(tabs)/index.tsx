/**
 * Home screen - Today's prompt display
 *
 * Shows the daily personalized prompt as the hero element,
 * followed by stats, reference images, and action buttons.
 */

import { useState, useEffect, useMemo } from 'react';
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
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
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
import { useStreak } from '@/lib/hooks/useStreak';
import { useBadges } from '@/lib/hooks/useBadges';
import { useTheme } from '@/lib/theme/ThemeContext';
import { hapticLight, hapticMedium } from '@/lib/utils/haptics';
import { useIsBookmarked } from '@/lib/hooks/useBookmarks';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

const { width: screenWidth } = Dimensions.get('window');
const FREE_PROMPT_KEY = '@artspark:free-prompt-count';

function getLabel(options: { id: string; label: string }[], id: string): string {
  return options.find(o => o.id === id)?.label || id;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { prompt, loading, error, generating, isRestDay, generateManualPrompt } = useDailyPrompt();
  const { streak, loading: streakLoading } = useStreak();
  const { unlockedCount, totalCount } = useBadges();
  const { colors } = useTheme();
  const { bookmarked, toggle: toggleBookmark } = useIsBookmarked(prompt?.id);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [userDifficulty, setUserDifficulty] = useState<string>('developing');
  const [freePromptUsed, setFreePromptUsed] = useState(false);

  const { session } = useSession();
  const { track } = useAnalytics();
  const userId = session?.user?.id;
  const greeting = useMemo(() => getGreeting(), []);

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
          setUserTier('basic');
        }
      } else if (__DEV__) {
        try {
          const progressJson = await AsyncStorage.getItem('@artspark:onboarding-progress');
          if (progressJson) {
            const progress = JSON.parse(progressJson);
            if (progress.difficulty) setUserDifficulty(progress.difficulty);
          }
        } catch {}
        setUserTier('basic');
      } else {
        setUserTier('free');
        const today = new Date().toISOString().split('T')[0];
        const stored = await AsyncStorage.getItem(FREE_PROMPT_KEY);
        if (stored === today) setFreePromptUsed(true);
      }
    }
    loadUserInfo();
  }, [userId]);

  useEffect(() => {
    if (prompt && userTier === 'free' && !userId) {
      const today = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem(FREE_PROMPT_KEY, today);
      setFreePromptUsed(true);
    }
  }, [prompt, userTier, userId]);

  useEffect(() => {
    if (prompt) {
      setLiked(null);
      // Reset images when prompt changes — user must request them
      setReferenceImages([]);
      setImagesLoading(false);
      track('prompt_generated', {
        prompt_id: prompt.id,
        medium: prompt.medium,
        has_twist: !!prompt.twist,
        has_color_rule: !!prompt.color_rule,
        source: prompt.source,
      });
    }
  }, [prompt?.id]);

  const handleLoadImages = () => {
    if (!prompt || imagesLoading) return;
    setImagesLoading(true);
    fetchReferenceImages(prompt.subject, prompt.medium, 3, prompt.prompt_text)
      .then((imgs) => {
        setReferenceImages(imgs);
        track('reference_images_loaded', { count: imgs.length, medium: prompt.medium });
      })
      .catch(() => setReferenceImages([]))
      .finally(() => setImagesLoading(false));
  };

  const handleThumbsUp = () => {
    hapticLight();
    setLiked(true);
    if (prompt) track('prompt_liked', { prompt_id: prompt.id, medium: prompt.medium });
  };
  const handleThumbsDown = () => {
    if (!prompt) return;
    hapticLight();
    setFeedbackVisible(true);
    track('prompt_disliked', { prompt_id: prompt.id, medium: prompt.medium });
  };

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
              updates.art_mediums = currentMediums.filter((m: string) => m !== prompt.medium);
            }
            if (Object.keys(updates).length > 0) await savePreferences(userId, updates);
          }
        }
      } catch (err) {
        console.error('Failed to update preferences from feedback:', err);
      }
    }
    generateManualPrompt();
  };

  const tierLimits = TIER_LIMITS[userTier];
  const difficulty = getDifficultyOption(userDifficulty);
  const tutorials: TutorialLink[] =
    difficulty.id === 'explorer' && prompt ? getTutorialLinks(prompt.medium) : [];

  // Loading
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <FloatingLeaves width={screenWidth} height={600} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 14 }}>Preparing your prompt...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 }}
          onPress={() => router.replace('/(auth)')}
        >
          <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Rest day (prompt frequency setting)
  if (isRestDay && !prompt) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            {greeting}!
          </Text>
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 24,
              marginTop: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83C\uDFA8'}</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
              Rest Day
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              No prompt scheduled for today based on your frequency settings. Enjoy the break, or generate one anyway!
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await generateManualPrompt();
              }}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginTop: 16,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>
                Generate Prompt Anyway
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Still show streak on rest days */}
          {!streakLoading && streak && (
            <View style={{ marginTop: 20 }}>
              <StreakCounter streak={streak} />
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // No prompt
  if (!prompt) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No prompt available</Text>
      </View>
    );
  }

  const mediumLabel = getLabel(MEDIUM_OPTIONS, prompt.medium);
  const colorLabel = prompt.color_rule ? getLabel(COLOR_PALETTE_OPTIONS, prompt.color_rule) : null;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>

          {/* ── Greeting header ── */}
          <Animated.View entering={FadeIn.duration(500)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 15, color: colors.textMuted, marginBottom: 2 }}>
              {greeting}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: 0.3 }}>
              {prompt.source === 'daily' ? "Today's Prompt" : 'Your Prompt'}
            </Text>
          </Animated.View>

          {/* ── HERO: Prompt Card ── */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 20,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}>
              {/* Accent stripe */}
              <View style={{ height: 4, backgroundColor: colors.primary }} />

              <View style={{ padding: 24 }}>
                <LeafCorner position="topRight" size={80} opacity={0.08} />
                <LeafCorner position="bottomLeft" size={60} opacity={0.06} />

                {/* Bookmark button */}
                <TouchableOpacity
                  onPress={() => {
                    hapticLight();
                    if (prompt) {
                      if (!bookmarked) track('bookmark_added', { prompt_id: prompt.id });
                      toggleBookmark(prompt);
                    }
                  }}
                  style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save prompt'}
                  accessibilityState={{ selected: bookmarked }}
                >
                  <Text style={{ fontSize: 22, opacity: bookmarked ? 1 : 0.3 }}>
                    {'\uD83D\uDD16'}
                  </Text>
                </TouchableOpacity>

                {/* Prompt text — large & inviting */}
                <Text style={{
                  fontSize: 26,
                  fontWeight: '700',
                  color: colors.text,
                  lineHeight: 36,
                  paddingRight: 20,
                  marginBottom: 20,
                }}>
                  {prompt.prompt_text}
                </Text>

                {/* Detail pills */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  <View style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                      {mediumLabel}
                    </Text>
                  </View>

                  {colorLabel && (
                    <View style={{
                      backgroundColor: colors.primaryLight,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                        {colorLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Twist */}
                {prompt.twist && (
                  <View style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 20,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.primary,
                  }}>
                    <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      Twist
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.primary, fontStyle: 'italic', lineHeight: 20 }}>
                      {prompt.twist}
                    </Text>
                  </View>
                )}

                {/* Primary CTA — right inside the card */}
                {tierLimits.canSavePhotos ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 14,
                      paddingVertical: 15,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 3,
                    }}
                    onPress={() => {
                      hapticMedium();
                      router.push({
                        pathname: '/(auth)/respond',
                        params: { prompt_id: prompt.id, prompt_text: prompt.prompt_text },
                      });
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Add to My Gallery"
                    accessibilityHint="Opens the camera to create art for this prompt"
                  >
                    <Text style={{ color: '#FFF', textAlign: 'center', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>
                      Add to My Gallery
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <UpgradePrompt context="gallery" />
                )}

                {/* Feedback row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  gap: 12,
                }}>
                  <TouchableOpacity
                    onPress={handleThumbsUp}
                    accessibilityRole="button"
                    accessibilityLabel="Love this prompt"
                    accessibilityState={{ selected: liked === true }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 999,
                      backgroundColor: liked === true ? colors.primaryLight : 'transparent',
                      borderWidth: 1.5,
                      borderColor: liked === true ? colors.primary : colors.border,
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{'\uD83D\uDC4D'}</Text>
                    <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: liked === true ? colors.primary : colors.textMuted }}>
                      Love it
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleThumbsDown}
                    accessibilityRole="button"
                    accessibilityLabel="Dislike this prompt"
                    accessibilityHint="Opens feedback dialog to improve future prompts"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 999,
                      backgroundColor: liked === false ? '#FEF2F2' : 'transparent',
                      borderWidth: 1.5,
                      borderColor: liked === false ? colors.error : colors.border,
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{'\uD83D\uDC4E'}</Text>
                    <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: liked === false ? colors.error : colors.textMuted }}>
                      Not for me
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { hapticMedium(); generateManualPrompt(); }}
                    disabled={generating}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                      {generating ? '...' : 'New'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Reference Images (on demand) ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={{ marginBottom: 20 }}>
            {referenceImages.length === 0 && !imagesLoading ? (
              <TouchableOpacity
                onPress={handleLoadImages}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                accessibilityRole="button"
                accessibilityLabel="Show visual inspiration"
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>{'\uD83D\uDDBC\uFE0F'}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
                  Show Visual Ideas
                </Text>
              </TouchableOpacity>
            ) : imagesLoading ? (
              <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>Finding inspiration...</Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Visual Inspiration
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {referenceImages.map((img) => {
                    const imgWidth = (screenWidth - 40 - 8 * (referenceImages.length - 1)) / referenceImages.length;
                    return (
                      <TouchableOpacity
                        key={img.id}
                        onPress={() => Linking.openURL(img.url)}
                        activeOpacity={0.85}
                        style={{ flex: 1 }}
                      >
                        <Image
                          source={{ uri: img.thumbUrl }}
                          style={{
                            width: '100%',
                            height: imgWidth * 0.8,
                            borderRadius: 12,
                          }}
                          resizeMode="cover"
                        />
                        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }} numberOfLines={1}>
                          {img.photographer}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Required attribution */}
                {referenceImages.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      const source = referenceImages[0].source;
                      if (source === 'pexels') Linking.openURL('https://www.pexels.com');
                      else if (source === 'unsplash') Linking.openURL('https://unsplash.com');
                      else Linking.openURL('https://commons.wikimedia.org');
                    }}
                    style={{ marginTop: 8, alignSelf: 'center' }}
                    activeOpacity={0.6}
                  >
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {referenceImages[0].source === 'pexels' ? 'Photos provided by Pexels'
                        : referenceImages[0].source === 'unsplash' ? 'Photos provided by Unsplash'
                        : 'Photos from Wikimedia Commons'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>

          {/* ── Learning Resources (Explorer level only) ── */}
          {tutorials.length > 0 && (
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: '#5A7A50', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Learning Resources
              </Text>
              {tutorials.map((link, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(link.url)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
                >
                  <Text style={{ color: colors.primary, marginRight: 8, fontSize: 12 }}>{'\u203A'}</Text>
                  <Text style={{ fontSize: 14, color: '#5A7A50', textDecorationLine: 'underline', flex: 1 }}>
                    {link.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Stats row: Streak + Badges ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(350)} style={{ marginBottom: 16 }}>
            {!streakLoading && <StreakCounter streak={streak} />}

            {/* Badges chip */}
            <TouchableOpacity
              onPress={() => { hapticLight(); router.push('/(auth)/badges'); }}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{'\u2728'}</Text>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                    {unlockedCount} of {totalCount} badges
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    Achievements
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                View {'\u203A'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Free tier upgrade prompt ── */}
          {userTier === 'free' && freePromptUsed && !__DEV__ && (
            <View style={{ backgroundColor: colors.inputBg, borderRadius: 14, paddingVertical: 14, marginBottom: 12, opacity: 0.6 }}>
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 15, fontWeight: '600' }}>
                Upgrade for more prompts
              </Text>
            </View>
          )}

          {/* ── Divider ── */}
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <VineDivider width={180} opacity={0.12} />
          </View>

          {/* ── View Prompt History link ── */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/history')}
            activeOpacity={0.7}
            style={{ alignItems: 'center', paddingVertical: 12 }}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
              View Prompt History {'\u203A'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        prompt={prompt}
        onSubmit={handleFeedbackSubmit}
        onCancel={() => setFeedbackVisible(false)}
      />
    </>
  );
}
