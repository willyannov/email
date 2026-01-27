"use client";

import { useEffect, useState } from "react";
import { useMailboxStore } from "@/stores/mailboxStore";
import { wsClient } from "@/services/websocket";
import { apiClient } from "@/services/api";
import { MailboxHeader } from "./MailboxHeader";
import { EmailList } from "./EmailList";
import { EmailViewer } from "./EmailViewer";
import { cn } from "@/lib/utils";

export default function MailboxView({ token }: { token: string }) {
  const { setMailbox, setEmails, selectedEmail, setOriginalEmails } = useMailboxStore();
  const [apiToken, setApiToken] = useState(token);

  useEffect(() => {
    let cancelled = false;
    let activeToken = token;

    const refreshEmails = async () => {
      try {
        const list = await apiClient.listEmails(activeToken);
        if (cancelled) return;
        setEmails(list.emails);
        setOriginalEmails(list.emails);
      } catch (e) {
        // Error refreshing emails
      }
    };

    const init = async () => {
      try {
        const mb = await apiClient.getMailbox(token);
        if (cancelled) return;
        setMailbox(mb);

        activeToken = mb.token || token;
        setApiToken(activeToken);

        await refreshEmails();

        wsClient.connect(activeToken, (msg) => {
          if (msg.type === "connected") {
            refreshEmails();
            return;
          }
          if (msg.type === "new_email") {
            refreshEmails();
          }
        });
      } catch (e) {
        // Failed to load mailbox
      }
    };
    init();

    return () => {
      cancelled = true;
      wsClient.disconnect();
    };
  }, [token]);

  return (
    <div className="h-screen flex flex-col p-4 md:p-6 bg-base-100 font-sans overflow-hidden">
      <MailboxHeader token={apiToken} />
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 overflow-hidden min-h-0">
        {/* Email List - Container M3 Style */}
        <div className={cn(
            "md:col-span-4 lg:col-span-4 h-full transition-all duration-300",
            selectedEmail ? "hidden md:block" : "block"
        )}>
           <EmailList token={apiToken} />
        </div>

        {/* Email Viewer - Container M3 Style */}
        <div className={cn(
            "md:col-span-8 lg:col-span-8 h-full transition-all duration-300",
            !selectedEmail ? "hidden md:block opacity-50 pointer-events-none md:opacity-100 md:pointer-events-auto" : "block"
        )}>
           <EmailViewer token={apiToken} />
        </div>
      </div>
    </div>
  );
}
