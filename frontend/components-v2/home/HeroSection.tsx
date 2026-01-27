'use client';

import { CreateMailboxCard } from './CreateMailboxCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const HeroSection = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} 
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-[var(--text-primary)]" /> : <Moon className="w-5 h-5 text-[var(--text-primary)]" />}
      </button>

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold text-[var(--text-primary)]">
            TEMP<span className="text-[var(--accent-primary)]">MAIL</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Emails temporários seguros e anônimos. Autodestrução automática.
          </p>
        </div>

        <CreateMailboxCard />
      </div>
    </section>
  );
};
