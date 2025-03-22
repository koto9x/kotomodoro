import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SoundProvider } from '@/contexts/sound-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chronos | Modern Countdown Timer',
  description: 'A minimalist countdown timer with ADHD-friendly features',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark`}>
        <SoundProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </SoundProvider>
      </body>
    </html>
  );
}
