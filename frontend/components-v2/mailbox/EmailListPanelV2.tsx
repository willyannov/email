'use client';

import { useMailboxStore } from '@/stores/mailboxStore';
import { apiClient } from '@/services/api';
import { format } from 'date-fns';
import { Paperclip, Search, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components-v2/ui/Input';

export const EmailListPanelV2 = ({ token }: { token: string }) => {
  const {
    emails,
    selectedEmail,
    setSelectedEmail,
    isLoadingEmails,
    isLoadingEmailDetail,
    setEmails,
    originalEmails,
    setLoadingEmailDetail,
    updateEmailInList,
  } = useMailboxStore();
  
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term) {
      if (originalEmails.length > 0) setEmails(originalEmails);
      return;
    }

    const filtered = originalEmails.filter(email => 
      (email.subject || '').toLowerCase().includes(term.toLowerCase()) || 
      (email.from || '').toLowerCase().includes(term.toLowerCase())
    );
    setEmails(filtered);
  };

  const handleSelectEmail = async (emailId: string) => {
    try {
      setLoadingEmailDetail(true);
      const detail = await apiClient.getEmail(token, emailId);
      setSelectedEmail(detail);
      updateEmailInList(emailId, { isRead: true });
    } catch (e) {
      console.error('Failed to load email');
    } finally {
      setLoadingEmailDetail(false);
    }
  };

  return (
    <div className="w-full md:w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Inbox className="w-5 h-5 text-[var(--accent-primary)]" />
          INBOX ({emails.length})
        </h2>
        
        <Input
          type="text"
          placeholder="Buscar emails..."
          value={searchTerm}
          onChange={handleSearch}
          className="text-sm"
        />
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Inbox className="w-12 h-12 text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-secondary)]">Nenhum email ainda</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {emails.map((email) => (
              <div
                key={email._id}
                onClick={() => handleSelectEmail(email._id)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-all',
                  'hover:bg-[var(--bg-hover)]',
                  selectedEmail?._id === email._id && 'bg-[var(--bg-secondary)] border border-[var(--accent-primary)]',
                  !email.isRead && 'border-l-2 border-[var(--accent-primary)]'
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    'text-sm truncate flex-1',
                    !email.isRead ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}>
                    {email.from.replace(/<[^>]*>/g, '')}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">
                    {format(new Date(email.receivedAt), 'HH:mm')}
                  </span>
                </div>
                
                <h4 className={cn(
                  'text-sm truncate mb-1',
                  !email.isRead ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                )}>
                  {email.subject || '(Sem assunto)'}
                </h4>
                
                <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                  {email.hasAttachments && <Paperclip className="inline w-3 h-3 mr-1" />}
                  {email.snippet}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
