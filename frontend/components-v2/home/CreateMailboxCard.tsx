'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api';
import { Button } from '@/components-v2/ui/Button';
import { Input } from '@/components-v2/ui/Input';
import { Card } from '@/components-v2/ui/Card';
import { Loader2, Zap } from 'lucide-react';

export const CreateMailboxCard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customPrefix, setCustomPrefix] = useState('');

  const handleCreate = async () => {
    try {
      setLoading(true);
      const mailbox = await apiClient.createMailbox({
        customPrefix: customPrefix || undefined,
      });
      router.push(`/${mailbox.token}`);
    } catch (error) {
      alert('Erro ao criar mailbox. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card neon className="max-w-lg mx-auto">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Prefixo Customizado (Opcional)
          </label>
          <Input
            type="text"
            placeholder="meu-projeto-teste"
            value={customPrefix}
            onChange={(e) => setCustomPrefix(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Acessar Email'
          )}
        </Button>
      </div>
    </Card>
  );
};
