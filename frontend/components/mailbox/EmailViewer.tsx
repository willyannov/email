"use client";

import { useMailboxStore } from "@/stores/mailboxStore";
import { Download, X, Trash2, Reply, MoreVertical, Star, Printer } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/services/api";

export function EmailViewer({ token }: { token: string }) {
  const { selectedEmail, setSelectedEmail, mailbox, setEmails, setOriginalEmails } = useMailboxStore();

  if (!selectedEmail) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full rounded-[2.5rem] bg-base-100 border border-base-200 shadow-sm p-8 text-center">
        <div className="w-32 h-32 bg-base-200 rounded-full flex items-center justify-center mb-6">
            <img src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_server_1x.png" alt="Email" className="w-16 opacity-20 grayscale" />
        </div>
        <h3 className="text-2xl font-bold text-base-content/80 mb-2">Select an email to read</h3>
        <p className="text-base-content/50 max-w-xs mx-auto">Click on any item in the list to view full details here.</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    try {
      await apiClient.deleteEmail(token, selectedEmail._id);
      const list = await apiClient.listEmails(token);
      setEmails(list.emails);
      setOriginalEmails(list.emails);
      setSelectedEmail(null);
    } catch (e) {
      console.error(e);
    }
  };

  const toLine = Array.isArray(selectedEmail.to) && selectedEmail.to.length > 0
    ? selectedEmail.to.join(", ")
    : mailbox?.address || "";

  const htmlDoc = (() => {
    if (!selectedEmail.htmlBody) return "";
    const baseTag = `<base target="_blank" />`;
    if (/<head[^>]*>/i.test(selectedEmail.htmlBody)) {
      return selectedEmail.htmlBody.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}`);
    }
    return `<!doctype html><html><head>${baseTag}</head><body>${selectedEmail.htmlBody}</body></html>`;
  })();

  return (
    <div className="bg-base-100 h-full flex flex-col rounded-[2.5rem] overflow-hidden border border-base-200 shadow-sm relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-100/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <button className="btn btn-circle btn-ghost btn-sm md:hidden" onClick={() => setSelectedEmail(null)}>
              <X className="w-5 h-5" />
           </button>
           <div className="hidden md:flex gap-2">
             <div className="tooltip tooltip-bottom" data-tip="Archive">
                <button className="btn btn-circle btn-ghost btn-sm"><Download className="w-5 h-5 opacity-60" /></button>
             </div>
             <div className="tooltip tooltip-bottom" data-tip="Report Spam">
                <button className="btn btn-circle btn-ghost btn-sm"><div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-xs font-bold opacity-60">!</div></button>
             </div>
             <div className="tooltip tooltip-bottom" data-tip="Delete">
                <button className="btn btn-circle btn-ghost btn-sm text-error/70 hover:text-error hover:bg-error/10" onClick={handleDelete}>
                    <Trash2 className="w-5 h-5" />
                </button>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
             <button className="btn btn-circle btn-ghost btn-sm"><Printer className="w-5 h-5 opacity-60" /></button>
             <button className="btn btn-circle btn-ghost btn-sm"><MoreVertical className="w-5 h-5 opacity-60" /></button>
        </div>
      </div>

      {/* Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            {/* Subject Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-normal text-base-content leading-tight">
                        {selectedEmail.subject || "(No Subject)"}
                    </h1>
                    <button className="btn btn-sm btn-ghost btn-circle mt-1">
                        <Star className="w-5 h-5 opacity-40" />
                    </button>
                </div>

                {/* Sender Info Card */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="avatar placeholder">
                        <div className="bg-secondary text-secondary-content rounded-full w-12 h-12 shadow-sm">
                            <span className="text-xl font-medium">{selectedEmail.from.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-1">
                            <span className="font-bold text-base text-base-content">{selectedEmail.from}</span>
                            <span className="text-sm text-base-content/50 hidden md:inline">&lt;{selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from}&gt;</span>
                        </div>
                        <div className="text-sm text-base-content/60">
                            to {toLine}
                            <span className="mx-2">•</span>
                            {format(new Date(selectedEmail.receivedAt), "PPP p")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attachments Chip Grid */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-sm font-medium text-base-content/50 mb-3 uppercase tracking-wider">Attachments</h4>
                    <div className="flex flex-wrap gap-3">
                        {selectedEmail.attachments.map((att, idx) => (
                            <a 
                            key={idx}
                            href={apiClient.getAttachmentUrl(token, selectedEmail._id, idx)}
                            target="_blank"
                            className="group flex items-center gap-3 pl-3 pr-4 py-2 border border-base-300 rounded-2xl hover:bg-base-200 transition-colors cursor-pointer bg-base-100"
                            rel="noreferrer"
                            >
                            <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center">
                                <span className="text-xs font-bold">PDF</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium truncate max-w-[150px] group-hover:text-primary transition-colors">{att.filename}</span>
                                <span className="text-xs text-base-content/50">{Math.round(att.size / 1024)} KB</span>
                            </div>
                            <Download className="w-4 h-4 text-base-content/40 group-hover:text-primary ml-2" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Email Body */}
            <div className="prose max-w-none prose-img:rounded-xl prose-a:text-primary">
                {selectedEmail.htmlBody ? (
                <div className="bg-white text-black p-4 rounded-xl border border-base-200 shadow-inner min-h-[300px]">
                    <iframe
                        srcDoc={htmlDoc}
                        className="w-full h-full min-h-[500px]"
                        title="Email Content"
                        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-links"
                        style={{ border: 'none' }}
                    />
                </div>
                ) : (
                <pre className="whitespace-pre-wrap font-roboto text-base text-base-content/80 leading-relaxed bg-base-200/30 p-6 rounded-2xl">
                    {selectedEmail.textBody}
                </pre>
                )}
            </div>

            {/* Action Footer */}
            <div className="mt-12 flex gap-3">
                <button className="btn btn-outline rounded-full px-8 border-base-300 hover:border-base-content/20 hover:bg-base-200 gap-2 normal-case font-normal">
                    <Reply className="w-4 h-4" /> Reply
                </button>
                <button className="btn btn-outline rounded-full px-8 border-base-300 hover:border-base-content/20 hover:bg-base-200 gap-2 normal-case font-normal">
                    Forward
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
