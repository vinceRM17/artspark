import "../global.css";
import { useState } from 'react';
import { Slot } from 'expo-router';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AnimatedSplash from '@/components/AnimatedSplash';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider>
          <Slot />
          {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
