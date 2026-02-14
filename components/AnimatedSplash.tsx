/**
 * Animated splash screen
 *
 * Shows a branded intro animation when the app launches:
 * leaf emoji scales up, app name fades in, tagline slides up.
 * Hides the native splash once ready, then calls onFinish when done.
 */

import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Keep native splash visible while we prepare
SplashScreen.preventAutoHideAsync().catch(() => {});

type AnimatedSplashProps = {
  onFinish: () => void;
};

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const leafScale = useSharedValue(0.3);
  const leafOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(15);
  const screenOpacity = useSharedValue(1);

  const startAnimations = useCallback(() => {
    // 1. Leaf scales up with spring
    leafOpacity.value = withTiming(1, { duration: 300 });
    leafScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // 2. Title fades in and slides up
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // 3. Tagline fades in and slides up
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    taglineTranslateY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // 4. Hold, then fade out the whole screen
    screenOpacity.value = withDelay(2200, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    }));
  }, [leafScale, leafOpacity, titleOpacity, titleTranslateY, taglineOpacity, taglineTranslateY, screenOpacity, onFinish]);

  useEffect(() => {
    // Hide native splash, then start our animations
    SplashScreen.hideAsync().then(() => {
      startAnimations();
    }).catch(() => {
      startAnimations();
    });
  }, [startAnimations]);

  const leafStyle = useAnimatedStyle(() => ({
    opacity: leafOpacity.value,
    transform: [{ scale: leafScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.leaf, leafStyle]}>
          {'\uD83C\uDF3F'}
        </Animated.Text>
        <Animated.Text style={[styles.title, titleStyle]}>
          ArtSpark
        </Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Your daily creative spark
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF8F0',
    zIndex: 999,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaf: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#7C9A72',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
});
