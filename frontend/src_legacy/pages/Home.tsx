import React from 'react';
import { Mail, Check, Copy } from 'lucide-react';
import { EmailGenerator } from '@/components/EmailGenerator';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TempMail</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Title */}
          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
              Email Temporário
              <br />
              <span className="text-primary">Instantâneo e Anônimo</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Crie endereços de email descartáveis em segundos. 
              Sem cadastro, sem complicações.
            </p>
          </div>

          {/* Email Generator Component */}
          <div className="animate-in slide-in-from-bottom duration-700">
            <EmailGenerator />
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 animate-in fade-in slide-in-from-bottom duration-1000">
            <div className="space-y-2 p-4 transition-transform hover:scale-105">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base md:text-lg">Sem Cadastro</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Não precisa criar conta ou fornecer dados pessoais
              </p>
            </div>
            <div className="space-y-2 p-4 transition-transform hover:scale-105">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base md:text-lg">Temporário</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Emails expiram automaticamente após 1 hora
              </p>
            </div>
            <div className="space-y-2 p-4 sm:col-span-2 md:col-span-1 transition-transform hover:scale-105">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Copy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base md:text-lg">Fácil de Usar</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Copie o endereço e use onde precisar
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12 md:mt-16">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center text-xs md:text-sm text-muted-foreground">
            <p>© 2025 Ta Duro? Dorme! - Email Temporário e Descartável</p>
            <p className="mt-2">Desenvolvido com Bun, React e shadcn/ui</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
