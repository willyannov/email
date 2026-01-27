import { Shield, Zap, Mail, Clock } from 'lucide-react';
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

export const FeaturesGrid = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="text-center hover:shadow-neon transition-all">
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
    </section>
  );
};
