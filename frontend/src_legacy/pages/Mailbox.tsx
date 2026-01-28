import React from 'react';
import { Mail, RefreshCw, Trash2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/CopyButton';
import { ExpirationTimer } from '@/components/ExpirationTimer';
import { SearchBar } from '@/components/SearchBar';
import { EmailList } from '@/components/EmailList';
import { EmailViewer } from '@/components/EmailViewer';
import { useMailbox, useSearchEmails } from '@/hooks/useMailbox';
import { useMailboxStore } from '@/stores/mailboxStore';
import { useToast } from '@/components/Toast';

export function Mailbox({ token }: { token: string }) {
  const toast = useToast();
  const normalizedPrefix = token.toLowerCase();

  const {
    mailbox,
    emails,
    selectedEmail,
    isLoadingMailbox,
    isLoadingEmailDetail,
    isConnected,
    loadEmailDetail,
    deleteMailbox,
    refreshEmails,
    extendMailbox,
  } = useMailbox(normalizedPrefix, (from, subject) => {
    // Callback when new email is received
    toast.info('📧 Novo email recebido', `De: ${from} - ${subject}`);
  });

  const { isSearching } = useMailboxStore();
  const { searchEmails, clearSearch } = useSearchEmails(normalizedPrefix);

  const handleSelectEmail = (emailId: string) => {
    loadEmailDetail(normalizedPrefix, emailId);
    // Scroll to top on mobile when email is selected
    if (window.innerWidth < 768 && emailId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteMailbox = async () => {
    if (!confirm('Tem certeza que deseja deletar esta mailbox?')) return;
    
    const success = await deleteMailbox(normalizedPrefix);
    if (success) {
      toast.success('Mailbox deletada', 'Redirecionando...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      toast.error('Erro ao deletar mailbox');
    }
  };

  const handleRefresh = () => {
    refreshEmails(normalizedPrefix);
    toast.info('Atualizando emails...');
  };

  const handleExtendTTL = async () => {
    const success = await extendMailbox(normalizedPrefix);
    if (success) {
      toast.success('Tempo estendido!', 'Sua mailbox foi prolongada por mais tempo');
    } else {
      toast.error('Erro ao estender tempo');
    }
  };

  const handleSearchResults = (results: any[]) => {
    // Results are handled by the SearchBar component via the hook
  };

  const handleClearSearch = () => {
    clearSearch();
  };

  if (isLoadingMailbox) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto text-primary' />
          <p className='mt-2 text-muted-foreground'>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!mailbox) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='p-6 max-w-md'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold mb-2'>Mailbox não encontrada</h2>
            <p className='text-muted-foreground mb-4'>
              Esta mailbox pode ter expirado ou não existe.
            </p>
            <Button asChild>
              <a href='/'>Criar Nova Mailbox</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-slate-100'>
      {/* Header */}
      <header className='sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
        <div className='container flex h-16 items-center px-4'>
          {/* Logo & Navigation */}
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='icon' asChild className='shrink-0'>
              <a href='/' aria-label='Voltar para home'>
                <ArrowLeft className='h-5 w-5' />
              </a>
            </Button>
            <div className='flex items-center gap-2'>
              <Mail className='h-6 w-6 text-primary shrink-0' />
              <span className='text-lg font-bold hidden sm:inline'>Ta duro? DORME!</span>
            </div>
          </div>
          
          {/* Email Address Display */}
          <div className='flex-1 flex items-center justify-center px-4 min-w-0'>
            <Card className='flex items-center gap-2 px-3 py-2 shadow-none border-primary/20'>
              <code className='text-xs md:text-sm font-mono truncate max-w-[200px] md:max-w-md'>
                {mailbox.address}
              </code>
              <CopyButton text={mailbox.address} size='sm' showLabel={false} />
            </Card>
          </div>
          
          {/* Actions */}
          <nav className='flex items-center gap-2'>
            <div className='hidden sm:flex items-center gap-2'>
              <ExpirationTimer expiresAt={mailbox.expiresAt} format='compact' />
              <Button 
                variant='outline' 
                size='sm'
                onClick={handleExtendTTL}
                title='Estender tempo de vida'
              >
                <Clock className='h-4 w-4 mr-2' />
                Estender
              </Button>
            </div>
            
            {/* Indicador de conexão WebSocket */}
            <div className='flex items-center gap-2'>
              <span 
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
                title={isConnected ? 'Conectado - atualizações em tempo real' : 'Desconectado'}
              />
            </div>
            
            <Button 
              variant='outline' 
              size='icon'
              onClick={handleExtendTTL}
              title='Estender tempo de vida'
              className='sm:hidden'
            >
              <Clock className='h-4 w-4' />
            </Button>
            <Button 
              variant='ghost' 
              size='icon' 
              onClick={handleRefresh}
              title='Atualizar emails'
            >
              <RefreshCw className='h-4 w-4' />
            </Button>
            <Button 
              variant='ghost' 
              size='icon' 
              onClick={handleDeleteMailbox}
              title='Deletar mailbox'
              className='text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-6'>
        <div className='grid md:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-140px)]'>
          {/* Email List Sidebar */}
          <aside className={`
            flex flex-col gap-4 overflow-hidden
            ${selectedEmail ? 'hidden md:flex' : 'flex'}
          `}>
            <Card className='shrink-0'>
              <SearchBar
                token={normalizedPrefix}
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />
            </Card>
            
            {isSearching && (
              <p className='text-sm text-muted-foreground px-2'>
                Resultados da busca
              </p>
            )}
            
            <div className='flex-1 overflow-y-auto pr-2'>
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmail?._id}
                onSelectEmail={handleSelectEmail}
                loading={false}
              />
            </div>
          </aside>
          
          {/* Email Viewer */}
          <section className={`
            flex flex-col overflow-hidden
            ${selectedEmail ? 'flex' : 'hidden md:flex'}
          `}>
            {selectedEmail && (
              <div className='md:hidden mb-4'>
                <Button 
                  variant='outline' 
                  size='sm'
                  onClick={() => loadEmailDetail(normalizedPrefix, '')}
                  className='gap-2'
                >
                  <ArrowLeft className='h-4 w-4' />
                  Voltar para lista
                </Button>
              </div>
            )}
            
            <div className='flex-1 overflow-hidden'>
              <EmailViewer
                email={selectedEmail}
                token={normalizedPrefix}
                loading={isLoadingEmailDetail}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
