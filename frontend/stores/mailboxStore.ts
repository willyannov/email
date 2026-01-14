import { create } from 'zustand';

export interface Email {
  _id: string;
  from: string;
  subject: string;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  snippet?: string;
}

export interface EmailDetail extends Email {
  to: string[];
  textBody?: string;
  htmlBody?: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    path?: string;
  }>;
  headers: Record<string, string>;
}

export interface Mailbox {
  address: string;
  accessToken: string;
  expiresAt: string;
  createdAt: string;
  _id?: string;
}

interface MailboxState {
  // State
  mailbox: Mailbox | null;
  emails: Email[];
  originalEmails: Email[];
  selectedEmail: EmailDetail | null;
  isSearching: boolean;
  isConnected: boolean;
  
  // Loading states
  isLoadingMailbox: boolean;
  isLoadingEmails: boolean;
  isLoadingEmailDetail: boolean;
  isCreatingMailbox: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  setMailbox: (mailbox: Mailbox | null) => void;
  setEmails: (emails: Email[]) => void;
  setOriginalEmails: (emails: Email[]) => void;
  setSelectedEmail: (email: EmailDetail | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  
  // Loading setters
  setLoadingMailbox: (loading: boolean) => void;
  setLoadingEmails: (loading: boolean) => void;
  setLoadingEmailDetail: (loading: boolean) => void;
  setCreatingMailbox: (loading: boolean) => void;
  
  // Update email in list
  updateEmailInList: (emailId: string, updates: Partial<Email>) => void;
  
  // Clear all state
  clearStore: () => void;
}

export const useMailboxStore = create<MailboxState>((set, get) => ({
  // Initial state
  mailbox: null,
  emails: [],
  originalEmails: [],
  selectedEmail: null,
  isSearching: false,
  isConnected: false,
  
  isLoadingMailbox: false,
  isLoadingEmails: false,
  isLoadingEmailDetail: false,
  isCreatingMailbox: false,
  
  error: null,
  
  // Actions
  setMailbox: (mailbox) => set({ mailbox }),
  
  setEmails: (emails) => set({ emails }),
  
  setOriginalEmails: (emails) => set({ originalEmails: emails }),
  
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  
  setIsSearching: (isSearching) => set({ isSearching }),
  
  setIsConnected: (isConnected) => set({ isConnected }),
  
  setError: (error) => set({ error }),
  
  // Loading setters
  setLoadingMailbox: (loading) => set({ isLoadingMailbox: loading }),
  
  setLoadingEmails: (loading) => set({ isLoadingEmails: loading }),
  
  setLoadingEmailDetail: (loading) => set({ isLoadingEmailDetail: loading }),
  
  setCreatingMailbox: (loading) => set({ isCreatingMailbox: loading }),
  
  // Update email in list (e.g., mark as read)
  updateEmailInList: (emailId, updates) => {
    const { emails, originalEmails } = get();
    
    set({
      emails: emails.map(e => 
        e._id === emailId ? { ...e, ...updates } : e
      ),
      originalEmails: originalEmails.map(e => 
        e._id === emailId ? { ...e, ...updates } : e
      ),
    });
  },
  
  // Clear all state
  clearStore: () => set({
    mailbox: null,
    emails: [],
    originalEmails: [],
    selectedEmail: null,
    isSearching: false,
    isConnected: false,
    isLoadingMailbox: false,
    isLoadingEmails: false,
    isLoadingEmailDetail: false,
    isCreatingMailbox: false,
    error: null,
  }),
}));
