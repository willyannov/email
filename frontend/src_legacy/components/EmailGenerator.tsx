import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EmailGenerator() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateEmail = async () => {
    console.log('🔄 Gerando email temporário...');
    setError('');
    setIsCreating(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/mailbox/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao criar mailbox');
      }

      const data = await response.json();
      
      console.log('✅ Mailbox criada!');
      console.log('Email:', data.address);
      console.log('Token:', data.accessToken);
      console.log('Dados completos:', data);
      
      // Verificar se o accessToken existe
      if (!data.accessToken) {
        throw new Error('Token de acesso não foi retornado pela API');
      }
      
      // Redireciona para a página da mailbox usando o token
      window.location.href = `/mailbox/${data.accessToken}`;
    } catch (error: any) {
      console.error('❌ Erro ao criar mailbox:', error);
      setError(error.message || 'Erro ao criar mailbox. Tente novamente.');
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto hover:shadow-xl transition-all">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl">Criar Email Temporário</CardTitle>
        <CardDescription className="text-base">
          Gere um endereço de email descartável instantaneamente.
          Perfeito para cadastros, verificações e proteção da sua privacidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          size="lg" 
          className="w-full text-lg h-14"
          onClick={handleGenerateEmail}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              Gerar Email Aleatório
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-center text-sm">{error}</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Email gerado automaticamente com nome único
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Válido por 1 hora (pode ser estendido)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Receba emails em tempo real
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Sem cadastro ou dados pessoais necessários
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
