import dynamic from 'next/dynamic';

declare global {
  interface Window {
    __POMODORO_MODE: boolean;
  }
}

const CountdownTimer = dynamic(() => import('@/components/countdown-timer'), {
  ssr: false
});

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <CountdownTimer />
    </main>
  );
}