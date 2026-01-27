'use client';

import { CreateMailboxCard } from './CreateMailboxCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Shield, Zap, Mail, Clock } from 'lucide-react';
import { Card } from '@/components-v2/ui/Card';

const features = [
  {
    icon: Zap,
    title: 'Instantâneo',
    description: 'Emails chegam em tempo real via WebSocket'
  },
  {
    icon: Shield,
    title: 'Privado',
    description: 'Sem cadastro, completamente anônimo'
  },
  {
    icon: Clock,
    title: 'Temporário',
    description: 'Autodestrução automática após 1 hora'
  },
  {
    icon: Mail,
    title: 'Ilimitado',
    description: 'Crie quantos emails precisar'
  }
];

export const HeroSection = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="relative min-h-screen flex flex-col px-4 py-6">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} 
      />

      {/* Header with Logo and Theme Toggle */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
          TEMP<span className="text-[var(--accent-primary)]">MAIL</span>
        </h1>
        
        <button
          onClick={toggleTheme}
          className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-[var(--text-primary)]" /> : <Moon className="w-5 h-5 text-[var(--text-primary)]" />}
        </button>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-6">    
          <CreateMailboxCard />
        </div>
      </div>

      {/* Features at Bottom */}
      <div className="relative z-10 mt-auto pt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
