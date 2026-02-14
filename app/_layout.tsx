import "../global.css";
import { Slot } from 'expo-router';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

export default function RootLayout() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </SessionProvider>
  );
}
