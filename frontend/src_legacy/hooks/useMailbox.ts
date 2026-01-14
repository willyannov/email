import { useEffect } from 'react';
import { useMailboxStore } from '../stores/mailboxStore';
import { apiClient } from '../services/api';
import { wsClient } from '../services/websocket';

/**
 * Hook to manage mailbox operations
 */
export function useMailbox(token?: string, onNewEmail?: (from: string, subject: string) => void) {
  const {
    mailbox,
    emails,
    selectedEmail,
    isLoadingMailbox,
    isLoadingEmails,
    isLoadingEmailDetail,
    isConnected,
    error,
    setMailbox,
    setEmails,
    setOriginalEmails,
    setSelectedEmail,
    setLoadingMailbox,
    setLoadingEmails,
    setLoadingEmailDetail,
    setIsConnected,
    setError,
    updateEmailInList,
  } = useMailboxStore();

  // Load mailbox on mount
  useEffect(() => {
    if (token) {
      loadMailbox(token);
      loadEmails(token);
      connectWebSocket(token);
    }

    return () => {
      if (token) {
        wsClient.disconnect();
        setIsConnected(false);
      }
    };
  }, [token]);

  const loadMailbox = async (token: string) => {
    setLoadingMailbox(true);
    setError(null);
    
    try {
      const data = await apiClient.getMailbox(token);
      setMailbox(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load mailbox:', err);
    } finally {
      setLoadingMailbox(false);
    }
  };

  const loadEmails = async (token: string) => {
    setLoadingEmails(true);
    setError(null);
    
    try {
      const data = await apiClient.listEmails(token);
      setEmails(data.emails);
      setOriginalEmails(data.emails);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load emails:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const loadEmailDetail = async (token: string, emailId: string) => {
    setLoadingEmailDetail(true);
    setError(null);
    
    try {
      const data = await apiClient.getEmail(token, emailId);
      setSelectedEmail(data);
      updateEmailInList(emailId, { isRead: true });
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load email detail:', err);
    } finally {
      setLoadingEmailDetail(false);
    }
  };

  const connectWebSocket = (token: string) => {
    wsClient.connect(token, (message) => {
      if (message.type === 'connected') {
        setIsConnected(true);
        console.log('✅ WebSocket conectado');
      } else if (message.type === 'new_email') {
        console.log('📧 Novo email recebido via WebSocket:', message.data);
        
        // Atualizar lista de emails
        loadEmails(token).then(() => {
          console.log('✅ Lista de emails atualizada');
        });
        
        // Notificar o usuário
        if (onNewEmail && message.data) {
          onNewEmail(message.data.from, message.data.subject);
        }
      } else if (message.type === 'error') {
        console.error('❌ Erro no WebSocket:', message.message);
        setError(message.message || 'Erro no WebSocket');
      }
    });
  };

  const deleteMailbox = async (token: string) => {
    try {
      await apiClient.deleteMailbox(token);
      wsClient.disconnect();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to delete mailbox:', err);
      return false;
    }
  };

  const refreshEmails = async (token: string) => {
    await loadEmails(token);
    setSelectedEmail(null);
  };

  const extendMailbox = async (token: string) => {
    try {
      const data = await apiClient.extendMailbox(token);
      setMailbox(data);
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to extend mailbox:', err);
      return false;
    }
  };

  return {
    mailbox,
    emails,
    selectedEmail,
    isLoadingMailbox,
    isLoadingEmails,
    isLoadingEmailDetail,
    isConnected,
    error,
    loadMailbox,
    loadEmails,
    loadEmailDetail,
    deleteMailbox,
    refreshEmails,
    extendMailbox,
  };
}

/**
 * Hook to create a new mailbox
 */
export function useCreateMailbox() {
  const { isCreatingMailbox, setCreatingMailbox, setError } = useMailboxStore();

  const createMailbox = async (customPrefix?: string) => {
    setCreatingMailbox(true);
    setError(null);
    
    try {
      const data = await apiClient.createMailbox(
        customPrefix ? { customPrefix } : {}
      );
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to create mailbox:', err);
      throw err;
    } finally {
      setCreatingMailbox(false);
    }
  };

  return {
    createMailbox,
    isCreating: isCreatingMailbox,
  };
}

/**
 * Hook to search emails
 */
export function useSearchEmails(token?: string) {
  const { setEmails, setIsSearching, originalEmails } = useMailboxStore();

  const searchEmails = async (query: string) => {
    if (!token) return;
    
    if (query.trim().length < 2) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    
    try {
      const data = await apiClient.searchEmails(token, query);
      setEmails(data.emails);
    } catch (err) {
      console.error('Failed to search emails:', err);
      setEmails([]);
    }
  };

  const clearSearch = () => {
    setIsSearching(false);
    setEmails(originalEmails);
  };

  return {
    searchEmails,
    clearSearch,
  };
}
