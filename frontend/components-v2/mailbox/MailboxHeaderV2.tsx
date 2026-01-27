'use client';

import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Clock, Check, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useMailboxStore } from '@/stores/mailboxStore';
import { apiClient } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components-v2/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

export const MailboxHeaderV2 = ({ token }: { token: string }) => {
  const { mailbox, setMailbox, setEmails, setOriginalEmails } = useMailboxStore();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!mailbox?.expiresAt) return;

    const interval = setInterval(() => {
      const end = new Date(mailbox.expiresAt);
      const now = new Date();
      if (now > end) {
        setTimeLeft('Expired');
      } else {
        setTimeLeft(formatDistanceToNow(end, { addSuffix: true }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mailbox?.expiresAt]);

  const handleCopy = async () => {
    if (mailbox?.address) {
      await navigator.clipboard.writeText(mailbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const [mailboxData, emailList] = await Promise.all([
        apiClient.getMailbox(token),
        apiClient.listEmails(token)
      ]);
      
      setMailbox(mailboxData);
      setEmails(emailList.emails);
      setOriginalEmails(emailList.emails);
    } catch (e) {
      console.error('Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!mailbox) return null;

  return (
    <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div 
            className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] cursor-pointer hover:border-[var(--accent-primary)] transition-all flex-1 md:flex-none"
            onClick={handleCopy}
          >
            <span className="font-mono text-sm md:text-base text-[var(--text-primary)] truncate">
              {mailbox.address}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
            <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">{timeLeft}</span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
