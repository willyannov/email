import React from 'react';
import { Home } from './pages/Home';
import { Mailbox } from './pages/Mailbox';
import { ToastProvider } from './components/Toast';

export function App({ url }: { url?: string }) {
  const path = url || (typeof window !== 'undefined' ? window.location.pathname : '/');
  
  console.log('🔍 Current path:', path);
  
  // Simple routing
  const renderPage = () => {
    if (path === '/') {
      return <Home />;
    }
    
    // Match /mailbox/:token (aceita tokens longos e prefixos curtos)
    const mailboxMatch = path.match(/^\/mailbox\/([a-zA-Z0-9_-]+)$/);
    if (mailboxMatch) {
      const token = mailboxMatch[1];
      console.log('🎯 Token extraído da URL:', token);
      console.log('📏 Tamanho do token:', token.length);
      return <Mailbox token={token} />;
    }
    
    // 404 Not Found
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground mb-4">Página não encontrada</p>
          <a href="/" className="text-primary hover:underline">Voltar para Home</a>
        </div>
      </div>
    );
  };

  return (
    <ToastProvider>
      {renderPage()}
    </ToastProvider>
  );
}
