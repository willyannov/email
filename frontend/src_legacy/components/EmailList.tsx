import React from 'react';
import { Mail, Paperclip, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Email {
  _id: string;
  from: string;
  subject: string;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (emailId: string) => void;
  loading?: boolean;
}

export function EmailList({ emails, selectedEmailId, onSelectEmail, loading }: EmailListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    return `${days}d atrás`;
  };

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Carregando emails">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Mail className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum email recebido</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Seus emails aparecerão aqui assim que forem recebidos.
            Compartilhe seu endereço temporário para começar a receber mensagens.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <ul className="space-y-2" role="list" aria-label="Lista de emails">
      {emails.map((email, index) => (
        <li key={email._id}>
          <Card
            role="button"
            tabIndex={0}
            className={`p-4 cursor-pointer transition-all hover:shadow-md animate-in fade-in slide-in-from-left-2 duration-300 ${
              selectedEmailId === email._id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'hover:bg-muted/50'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onSelectEmail(email._id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectEmail(email._id);
              }
            }}
            aria-label={`Email de ${email.from}: ${email.subject || '(Sem assunto)'}`}
            aria-current={selectedEmailId === email._id ? 'true' : undefined}
          >
            <article className="space-y-2">
              {/* Header */}
              <header className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {!email.isRead && (
                    <span 
                      className="h-2 w-2 bg-primary rounded-full shrink-0" 
                      aria-label="Não lido"
                    />
                  )}
                  <p
                    className={`text-sm truncate ${
                      email.isRead ? 'text-muted-foreground' : 'font-semibold text-foreground'
                    }`}
                  >
                    {email.from}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                  {email.hasAttachments && (
                    <Paperclip className="h-4 w-4" aria-label="Tem anexos" />
                  )}
                  <time 
                    className="flex items-center gap-1 text-xs"
                    dateTime={email.receivedAt}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(email.receivedAt)}</span>
                  </time>
                </div>
              </header>

              {/* Subject */}
              <p
                className={`text-sm truncate ${
                  email.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
                }`}
              >
                {email.subject || '(Sem assunto)'}
              </p>
            </article>
          </Card>
        </li>
      ))}
    </ul>
  );
}
