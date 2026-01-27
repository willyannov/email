'use client';

import { useEffect } from 'react';
import { useMailboxStore } from '@/stores/mailboxStore';
import { wsClient } from '@/services/websocket';
import { apiClient } from '@/services/api';
import { MailboxHeaderV2 } from './MailboxHeaderV2';
import { EmailListPanelV2 } from './EmailListPanelV2';
import { EmailViewerV2 } from './EmailViewerV2';

export const MailboxViewV2 = ({ token }: { token: string }) => {
  const { setMailbox, setEmails, setOriginalEmails } = useMailboxStore();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const mailbox = await apiClient.getMailbox(token);
        if (cancelled) return;
        setMailbox(mailbox);

        const list = await apiClient.listEmails(token);
        if (cancelled) return;
        setEmails(list.emails);
        setOriginalEmails(list.emails);

        wsClient.connect(token, (msg) => {
          if (msg.type === 'new_email') {
            apiClient.listEmails(token).then((list) => {
              setEmails(list.emails);
              setOriginalEmails(list.emails);
            });
          }
        });
      } catch (error) {
        console.error('Failed to load mailbox:', error);
      }
    };

    init();

    return () => {
      cancelled = true;
      wsClient.disconnect();
    };
  }, [token, setMailbox, setEmails, setOriginalEmails]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <MailboxHeaderV2 token={token} />
      
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        <EmailListPanelV2 token={token} />
        <EmailViewerV2 token={token} />
      </div>
    </div>
  );
};
