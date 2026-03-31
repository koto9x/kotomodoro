import dynamic from 'next/dynamic';

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