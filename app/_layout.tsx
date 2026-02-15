import "../global.css";
import { useState } from 'react';
import { Slot } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AnimatedSplash from '@/components/AnimatedSplash';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ErrorBoundary onError={(error) => Sentry.captureException(error)}>
      <SessionProvider>
        <ThemeProvider>
          <Slot />
          {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
