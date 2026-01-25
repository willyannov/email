import { MeiliSearch } from 'meilisearch';
import { getMeilisearchClient } from '../config/meilisearch.js';
import { Email } from '../models/Email.js';
import { ObjectId } from 'mongodb';

export class SearchService {
  private client: MeiliSearch | null = null;
  private indexName = 'emails';

  constructor() {
    try {
      this.client = getMeilisearchClient();
    } catch (error) {
      console.warn('⚠️ Meilisearch não disponível - busca avançada desabilitada');
      this.client = null;
    }
  }

  /**
   * Indexa um email no Meilisearch
   */
  async indexEmail(email: Email): Promise<void> {
    if (!this.client) {
      console.debug('Meilisearch não disponível - pulando indexação');
      return;
    }
    
    try {
      const index = this.client.index(this.indexName);

      await index.addDocuments([{
        id: email._id!.toString(),
        mailboxId: email.mailboxId.toString(),
        from: email.from,
        subject: email.subject,
        textBody: email.textBody || '',
        receivedAt: email.receivedAt.getTime(), // Timestamp para ordenação
      }]);
    } catch (error) {
      console.error('Erro ao indexar email no Meilisearch:', error);
      // Não propaga o erro - indexação é opcional
    }
  }

  /**
   * Busca emails de uma mailbox
   */
  async search(
    mailboxId: string,
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    hits: Array<{
      id: string;
      from: string;
      subject: string;
      receivedAt: number;
    }>;
    total: number;
  }> {
    if (!this.client) {
      console.warn('Meilisearch não disponível - retornando resultado vazio');
      return { hits: [], total: 0 };
    }
    
    try {
      const index = this.client.index(this.indexName);

      const results = await index.search(query, {
        filter: `mailboxId = ${mailboxId}`,
        limit,
        offset,
        sort: ['receivedAt:desc'],
      });

      return {
        hits: results.hits as any,
        total: results.estimatedTotalHits || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar emails no Meilisearch:', error);
      return { hits: [], total: 0 };
    }
  }

  /**
   * Remove um email do índice
   */
  async deleteEmail(emailId: string): Promise<void> {
    if (!this.client) return;
    
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(emailId);
    } catch (error) {
      console.error('Erro ao deletar email do Meilisearch:', error);
      // Não lançar erro, pois o email já foi deletado do MongoDB
    }
  }

  /**
   * Remove todos os emails de uma mailbox do índice
   */
  async deleteMailboxEmails(mailboxId: string): Promise<void> {
    if (!this.client) return;
    
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocuments({
        filter: `mailboxId = ${mailboxId}`,
      });
    } catch (error) {
      console.error('Erro ao deletar emails da mailbox do Meilisearch:', error);
    }
  }
}
