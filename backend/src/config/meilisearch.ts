import { MeiliSearch } from 'meilisearch';

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

let meilisearchClient: MeiliSearch | null = null;

export function getMeilisearchClient(): MeiliSearch {
  if (!meilisearchClient) {
    meilisearchClient = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_API_KEY,
    });

    console.log('✅ Cliente Meilisearch inicializado');
  }

  return meilisearchClient;
}

export async function setupMeilisearchIndexes() {
  try {
    const client = getMeilisearchClient();
    
    // Criar índice de emails se não existir
    try {
      await client.getIndex('emails');
      console.log('✅ Índice "emails" já existe no Meilisearch');
    } catch {
      await client.createIndex('emails', { primaryKey: 'id' });
      console.log('✅ Índice "emails" criado no Meilisearch');
      
      // Configurar campos pesquisáveis
      const index = client.index('emails');
      await index.updateSearchableAttributes([
        'from',
        'subject',
        'textBody'
      ]);
      
      await index.updateFilterableAttributes([
        'mailboxId',
        'receivedAt'
      ]);
      
      await index.updateSortableAttributes([
        'receivedAt'
      ]);
      
      console.log('✅ Configurações do índice aplicadas');
    }
  } catch (error) {
    console.error('❌ Erro ao configurar Meilisearch:', error);
    throw error;
  }
}
