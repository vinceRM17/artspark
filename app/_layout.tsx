import "../global.css";
import { Slot } from 'expo-router';
import { SessionProvider } from '@/components/auth/SessionProvider';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}
