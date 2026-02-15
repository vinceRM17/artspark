/**
 * Animated splash screen
 *
 * Shows the branded splash image when the app launches,
 * holds briefly, then fades out to reveal the app.
 */

import { useEffect, useCallback } from 'react';
import { Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

// Keep native splash visible while we prepare
SplashScreen.preventAutoHideAsync().catch(() => {});

type AnimatedSplashProps = {
  onFinish: () => void;
};

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const screenOpacity = useSharedValue(1);

  const startAnimations = useCallback(() => {
    // Hold the splash for a moment, then fade out
    screenOpacity.value = withDelay(1800, withTiming(0, { duration: 400 }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    }));
  }, [screenOpacity, onFinish]);

  useEffect(() => {
    // Hide native splash, then start our fade-out animation
    SplashScreen.hideAsync().then(() => {
      startAnimations();
    }).catch(() => {
      startAnimations();
    });
  }, [startAnimations]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Image
        source={require('@/assets/splash.png')}
        style={styles.splashImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
