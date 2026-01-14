import React, { useState } from 'react';
import { Download, FileText, Image, File, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
}

interface EmailDetail {
  _id: string;
  from: string;
  to: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  headers: Record<string, string>;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
}

interface EmailViewerProps {
  email: EmailDetail | null;
  token: string;
  loading?: boolean;
}

export function EmailViewer({ email, token, loading }: EmailViewerProps) {
  const [showHeaders, setShowHeaders] = useState(false);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadAttachment = async (attachmentIndex: number) => {
    if (!email) return;
    
    try {
      const url = `http://localhost:3000/api/mailbox/${token}/emails/${email._id}/attachment/${attachmentIndex}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const getAttachmentIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (contentType.includes('pdf') || contentType.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4" role="status" aria-label="Carregando email">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center max-w-sm">
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecione um email</h3>
            <p className="text-sm text-muted-foreground">
              Escolha um email da lista para visualizar seu conteúdo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
      <CardHeader className="border-b shrink-0">
        <CardTitle className="text-2xl break-words">
          {email.subject || '(Sem assunto)'}
        </CardTitle>
        <div className="space-y-1 text-sm mt-3">
          <dl className="space-y-1">
            <div className="flex gap-2">
              <dt className="font-medium text-foreground shrink-0">De:</dt>
              <dd className="text-muted-foreground truncate">{email.from}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground shrink-0">Para:</dt>
              <dd className="text-muted-foreground truncate">{email.to.join(', ')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground shrink-0">Data:</dt>
              <dd className="text-muted-foreground">
                <time dateTime={email.receivedAt}>{formatDate(email.receivedAt)}</time>
              </dd>
            </div>
          </dl>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* View Mode Toggle */}
        {email.htmlBody && email.textBody && (
          <nav className="flex gap-2 border-b pb-4" role="tablist" aria-label="Formato do email">
            <Button
              role="tab"
              variant={viewMode === 'html' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('html')}
              aria-selected={viewMode === 'html'}
              aria-controls="email-content"
            >
              HTML
            </Button>
            <Button
              role="tab"
              variant={viewMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('text')}
              aria-selected={viewMode === 'text'}
              aria-controls="email-content"
            >
              Texto
            </Button>
          </nav>
        )}

        {/* Email Body */}
        <section id="email-content" aria-label="Conteúdo do email">
          <div className="prose prose-sm max-w-none">
            {viewMode === 'html' && email.htmlBody ? (
              <div
                className="border rounded-lg p-4 bg-white overflow-auto"
                dangerouslySetInnerHTML={{ __html: email.htmlBody }}
              />
            ) : (
              <pre className="whitespace-pre-wrap border rounded-lg p-4 bg-muted/30 font-mono text-sm overflow-auto">
                {email.textBody || 'Sem conteúdo de texto'}
              </pre>
            )}
          </div>
        </section>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <section className="space-y-3 border-t pt-6" aria-label="Anexos">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos ({email.attachments.length})
            </h3>
            <ul className="grid gap-2" role="list">
              {email.attachments.map((attachment, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-muted-foreground shrink-0" aria-hidden="true">
                      {getAttachmentIcon(attachment.contentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)} • {attachment.contentType}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadAttachment(index)}
                    className="shrink-0"
                    aria-label={`Baixar ${attachment.filename}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Baixar</span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Headers Toggle */}
        <section className="border-t pt-6">
          <Button
            variant="ghost"
            onClick={() => setShowHeaders(!showHeaders)}
            className="flex items-center gap-2 text-sm font-medium px-0 hover:bg-transparent"
            aria-expanded={showHeaders}
            aria-controls="email-headers"
          >
            {showHeaders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showHeaders ? 'Ocultar' : 'Mostrar'} Headers
          </Button>
          
          {showHeaders && (
            <div 
              id="email-headers"
              className="mt-4 p-4 bg-muted/30 rounded-lg font-mono text-xs space-y-1 max-h-60 overflow-y-auto"
            >
              <dl>
                {Object.entries(email.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 py-1">
                    <dt className="font-semibold text-muted-foreground shrink-0">{key}:</dt>
                    <dd className="break-all">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
