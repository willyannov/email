"use client";

import { useMailboxStore } from "@/stores/mailboxStore";
import { format } from "date-fns";
import { Paperclip, Search, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { apiClient } from "@/services/api";

export function EmailList({ token }: { token: string }) {
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
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term) {
        if (originalEmails.length > 0) setEmails(originalEmails);
        return;
    }

    const filtered = originalEmails.filter(email => 
        (email.subject || "").toLowerCase().includes(term.toLowerCase()) || 
        (email.from || "").toLowerCase().includes(term.toLowerCase())
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
      console.error("Failed to load email detail", e);
    } finally {
      setLoadingEmailDetail(false);
    }
  };

  if (isLoadingEmails && emails.length === 0) {
    return (
      <div className="space-y-3 px-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-28 w-full rounded-[1.5rem] bg-base-200/50"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100 rounded-[2.5rem] overflow-hidden border border-base-200 shadow-sm">
      {/* Search Header */}
      <div className="p-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
          <input 
              type="text" 
              placeholder="Search emails" 
              className="input w-full pl-12 bg-base-200/50 border-none rounded-full h-12 focus:ring-2 focus:ring-primary/20 focus:bg-base-200 transition-all text-base"
              value={searchTerm}
              onChange={handleSearch}
          />
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-20 md:pb-2">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/40 p-8 text-center">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
               <Inbox className="w-10 h-10 opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-base-content/70">No emails yet</h3>
            <p className="text-sm mt-1">Messages will appear here instantly</p>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {emails.map((email) => (
              <div
                key={email._id}
                onClick={() => handleSelectEmail(email._id)}
                className={cn(
                  "group relative p-4 mx-2 rounded-[1.5rem] cursor-pointer transition-all duration-200 hover:bg-base-200/60 active:scale-[0.98]",
                  selectedEmail?._id === email._id ? "bg-secondary/10 text-secondary-content" : "bg-transparent",
                  !email.isRead ? "bg-primary/5" : ""
                )}
              >
                <div className="flex justify-between items-start gap-3">
                  {/* Avatar / Icon */}
                  <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                      !email.isRead ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/70"
                  )}>
                      {email.from.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <h3 className={cn(
                            "text-sm truncate pr-2",
                            !email.isRead ? "font-bold text-base-content" : "font-medium text-base-content/70"
                        )}>
                            {email.from.replace(/<[^>]*>/g, '')}
                        </h3>
                        <span className="text-xs text-base-content/50 font-medium whitespace-nowrap">
                            {format(new Date(email.receivedAt), "HH:mm")}
                        </span>
                    </div>
                    
                    <h4 className={cn(
                        "text-base truncate mb-1",
                        !email.isRead ? "font-semibold text-base-content" : "text-base-content/80"
                    )}>
                        {email.subject || "(No Subject)"}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-base-content/60 line-clamp-1 flex-1">
                          {email.hasAttachments && <Paperclip className="inline w-3 h-3 mr-1" />}
                          {email.snippet || ""}
                        </p>
                        {isLoadingEmailDetail && selectedEmail?._id === email._id && (
                          <Loader2 className="w-4 h-4 animate-spin text-base-content/40" />
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
