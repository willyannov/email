'use client';

import { useMailboxStore } from '@/stores/mailboxStore';
import { apiClient } from '@/services/api';
import { format } from 'date-fns';
import { Trash2, Paperclip, Mail } from 'lucide-react';
import { Button } from '@/components-v2/ui/Button';

export const EmailViewerV2 = ({ token }: { token: string }) => {
  const { selectedEmail, setSelectedEmail, setEmails, originalEmails } = useMailboxStore();

  const handleDelete = async () => {
    if (!selectedEmail) return;
    
    try {
      await apiClient.deleteEmail(token, selectedEmail._id);
      const updated = originalEmails.filter(e => e._id !== selectedEmail._id);
      setEmails(updated);
      setSelectedEmail(null);
    } catch (error) {
      console.error('Failed to delete email');
    }
  };

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg">
        <div className="text-center">
          <Mail className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Selecione um email para visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">
              {selectedEmail.subject || '(Sem assunto)'}
            </h2>
            <div className="space-y-1 text-sm text-[var(--text-secondary)]">
              <p><strong>De:</strong> {selectedEmail.from}</p>
              <p><strong>Para:</strong> {selectedEmail.to.join(', ')}</p>
              <p><strong>Data:</strong> {format(new Date(selectedEmail.receivedAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
          
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Deletar
          </Button>
        </div>

        {/* Attachments */}
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Anexos ({selectedEmail.attachments.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedEmail.attachments.map((att, idx) => (
                <div 
                  key={idx}
                  className="px-3 py-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] text-xs"
                >
                  {att.filename}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedEmail.htmlBody ? (
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-[var(--text-primary)]">
            {selectedEmail.textBody}
          </pre>
        )}
      </div>
    </div>
  );
};
