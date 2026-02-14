/**
 * Haptic feedback utilities
 *
 * Wraps expo-haptics with safe no-op fallback on web/simulator.
 */

import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;

// Dynamically import to avoid crashes on web
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    // expo-haptics not available
  }
}

export async function hapticLight(): Promise<void> {
  try {
    await Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silent fail on unsupported platforms
  }
}

export async function hapticMedium(): Promise<void> {
  try {
    await Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Silent fail
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Silent fail
  }
}

export async function hapticWarning(): Promise<void> {
  try {
    await Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Silent fail
  }
}
