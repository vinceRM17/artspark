/**
 * Badge evaluation service
 *
 * Computes which badges a user has unlocked from existing data.
 * No new DB table — reads from responses, streaks, and challenges.
 */

import { BADGES, type BadgeDefinition, type BadgeStats } from '@/lib/constants/badges';
import { getStreak } from '@/lib/services/streaks';
import { getTotalArtworkCount, getMediumCounts } from '@/lib/services/activityDates';
import { getActiveChallenges } from '@/lib/services/challenges';

export type EvaluatedBadge = {
  badge: BadgeDefinition;
  unlocked: boolean;
};

// Dev mode mock stats
const MOCK_STATS: BadgeStats = {
  totalArtworks: 12,
  currentStreak: 5,
  longestStreak: 8,
  mediumsUsed: 4,
  challengesCompleted: 1,
  challengeDaysCompleted: 9,
};

/**
 * Evaluate all badges for a user
 */
export async function evaluateBadges(
  userId: string | undefined
): Promise<EvaluatedBadge[]> {
  let stats: BadgeStats;

  if (!userId && __DEV__) {
    stats = MOCK_STATS;
  } else if (!userId) {
    stats = {
      totalArtworks: 0,
      currentStreak: 0,
      longestStreak: 0,
      mediumsUsed: 0,
      challengesCompleted: 0,
      challengeDaysCompleted: 0,
    };
  } else {
    // Gather stats from existing services
    const [streak, totalArtworks, mediumCounts, activeChallenges] =
      await Promise.all([
        getStreak(userId),
        getTotalArtworkCount(userId),
        getMediumCounts(userId),
        getActiveChallenges(userId).catch(() => []),
      ]);

    const challengesCompleted = activeChallenges.filter(
      (c) => c.progress.completed_at !== null
    ).length;

    const challengeDaysCompleted = activeChallenges.reduce(
      (sum, c) => sum + c.progress.days_completed,
      0
    );

    stats = {
      totalArtworks,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      mediumsUsed: Object.keys(mediumCounts).length,
      challengesCompleted,
      challengeDaysCompleted,
    };
  }

  return BADGES.map((badge) => ({
    badge,
    unlocked: badge.check(stats),
  }));
}
