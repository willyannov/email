'use client';

import { HeroSection } from '@/components-v2/home/HeroSection';
import { FeaturesGrid } from '@/components-v2/home/FeaturesGrid';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <HeroSection />
      <FeaturesGrid />
    </main>
  );
}
