"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCw, Clock, Check, ArrowLeft } from "lucide-react";
import { useMailboxStore } from "@/stores/mailboxStore";
import { apiClient } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function MailboxHeader({ token }: { token: string }) {
  const { mailbox, setMailbox, setEmails, setOriginalEmails } = useMailboxStore();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!mailbox?.expiresAt) return;

    const interval = setInterval(() => {
      const end = new Date(mailbox.expiresAt);
      const now = new Date();
      if (now > end) {
        setTimeLeft("Expired");
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
      console.error("Failed to refresh mailbox:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!mailbox) return <div className="skeleton h-24 w-full rounded-[2rem]"></div>;

  return (
    <div className="bg-base-200/50 backdrop-blur-md rounded-[2rem] p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button 
          onClick={() => router.push('/')}
          className="btn btn-circle btn-ghost text-base-content/70 hover:bg-base-300"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex-1 md:flex-none">
            <p className="text-sm font-medium text-base-content/60 ml-1 mb-1">Your temporary address</p>
            <div 
              className="flex items-center gap-3 bg-base-100 px-6 py-3 rounded-full cursor-pointer hover:bg-white transition-colors group shadow-sm"
              onClick={handleCopy}
            >
              <span className="font-mono text-lg text-primary font-bold tracking-tight">
                {mailbox.address}
              </span>
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors" />
              )}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <div className="px-5 py-3 rounded-full bg-base-300 text-primary-content font-medium flex items-center gap-2 text-primary shadow-sm">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-bold">{timeLeft}</span>
        </div>
        <button 
          className="btn btn-circle btn-primary shadow-none hover:shadow-md transition-all" 
          onClick={handleRefresh}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
