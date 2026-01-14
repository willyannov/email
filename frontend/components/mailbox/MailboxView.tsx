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
        console.log("🔄 Refreshing emails list...");
        const list = await apiClient.listEmails(activeToken);
        if (cancelled) return;
        console.log(`✅ Emails refreshed: ${list.emails.length} emails found`);
        setEmails(list.emails);
        setOriginalEmails(list.emails);
      } catch (e) {
        console.error("❌ Error refreshing emails:", e);
      }
    };

    const init = async () => {
      try {
        const mb = await apiClient.getMailbox(token);
        if (cancelled) return;
        setMailbox(mb);

        activeToken = mb.accessToken || token;
        setApiToken(activeToken);

        await refreshEmails();

        console.log(`🔌 Connecting WebSocket for token: ${activeToken}`);
        wsClient.connect(activeToken, (msg) => {
          console.log("📨 WebSocket message received in View:", msg);
          if (msg.type === "connected") {
            console.log("✅ WebSocket connected event received");
            refreshEmails();
            return;
          }
          if (msg.type === "new_email") {
            console.log("📧 New email notification received via WS");
            refreshEmails();
          }
        });
      } catch (e) {
        console.error("Failed to load mailbox", e);
      }
    };
    init();

    const interval = setInterval(() => {
      refreshEmails();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
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
