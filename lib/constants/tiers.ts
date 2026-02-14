/**
 * User tier definitions and access limits
 *
 * Defines the subscription tiers and what features each unlocks.
 */

export type UserTier = 'free' | 'basic' | 'community';

export type TierLimits = {
  promptsPerDay: number;
  canSavePhotos: boolean;
  requiresAuth: boolean;
  communityAccess?: boolean;
};

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    promptsPerDay: 1,
    canSavePhotos: false,
    requiresAuth: false,
  },
  basic: {
    promptsPerDay: 10,
    canSavePhotos: true,
    requiresAuth: true,
  },
  community: {
    promptsPerDay: 999,
    canSavePhotos: true,
    requiresAuth: true,
    communityAccess: true,
  },
};

export const TIER_INFO: Record<UserTier, { label: string; price: string; description: string }> = {
  free: {
    label: 'Free',
    price: 'Free',
    description: '1 prompt per day, no portfolio saving',
  },
  basic: {
    label: 'ArtSpark Basic',
    price: '~$25/yr',
    description: '10 prompts per day, save your artwork, full prompt history',
  },
  community: {
    label: 'ArtSpark Community',
    price: '~$50/yr',
    description: 'Unlimited prompts, portfolio, community features, and more',
  },
};
