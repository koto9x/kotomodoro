import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SoundProvider } from '@/contexts/sound-context';

export const metadata: Metadata = {
  title: 'Kotomodoro | Pomodoro & Countdown Timer',
  description: 'A minimalist pomodoro and countdown timer',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono dark">
        <SoundProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </SoundProvider>
      </body>
    </html>
  );
}
