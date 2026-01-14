const API_BASE_URL = 'http://localhost:3000/api';

interface CreateMailboxInput {
  customPrefix?: string;
}

interface MailboxResponse {
  address: string;
  accessToken: string;
  expiresAt: string;
  createdAt: string;
}

interface EmailListResponse {
  emails: any[];
  total: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new temporary mailbox
   */
  async createMailbox(input: CreateMailboxInput = {}): Promise<MailboxResponse> {
    const body = input.customPrefix ? { customPrefix: input.customPrefix } : {};
    
    const response = await fetch(`${this.baseUrl}/mailbox/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create mailbox' }));
      throw new Error(error.error || 'Failed to create mailbox');
    }

    return response.json();
  }

  /**
   * Get mailbox details by token
   */
  async getMailbox(token: string): Promise<MailboxResponse> {
    const response = await fetch(`${this.baseUrl}/mailbox/${token}`);

    if (!response.ok) {
      throw new Error('Failed to load mailbox');
    }

    return response.json();
  }

  /**
   * Delete a mailbox
   */
  async deleteMailbox(token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mailbox/${token}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete mailbox');
    }
  }

  /**
   * Extend mailbox expiration time
   */
  async extendMailbox(token: string): Promise<MailboxResponse> {
    const response = await fetch(`${this.baseUrl}/mailbox/${token}/extend`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error('Failed to extend mailbox');
    }

    return response.json();
  }

  /**
   * List emails for a mailbox
   */
  async listEmails(token: string, limit: number = 20, offset: number = 0): Promise<EmailListResponse> {
    const response = await fetch(
      `${this.baseUrl}/mailbox/${token}/emails?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error('Failed to load emails');
    }

    return response.json();
  }

  /**
   * Get email detail
   */
  async getEmail(token: string, emailId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/mailbox/${token}/emails/${emailId}`
    );

    if (!response.ok) {
      throw new Error('Failed to load email');
    }

    return response.json();
  }

  /**
   * Delete an email
   */
  async deleteEmail(token: string, emailId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/mailbox/${token}/emails/${emailId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
  }

  /**
   * Mark email as read
   */
  async markEmailAsRead(token: string, emailId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/mailbox/${token}/emails/${emailId}/read`,
      { method: 'PATCH' }
    );

    if (!response.ok) {
      throw new Error('Failed to mark email as read');
    }
  }

  /**
   * Search emails
   */
  async searchEmails(token: string, query: string): Promise<EmailListResponse> {
    const response = await fetch(
      `${this.baseUrl}/mailbox/${token}/emails/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to search emails');
    }

    return response.json();
  }

  /**
   * Get attachment download URL
   */
  getAttachmentUrl(token: string, emailId: string, attachmentIndex: number): string {
    return `${this.baseUrl}/mailbox/${token}/emails/${emailId}/attachment/${attachmentIndex}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
