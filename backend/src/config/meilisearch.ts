import { MeiliSearch } from 'meilisearch';

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let meilisearchClient: MeiliSearch | null = null;

export function getMeilisearchClient(): MeiliSearch {
  // Em produção, não inicializar se for localhost (não configurado)
  if (IS_PRODUCTION && MEILISEARCH_HOST.includes('localhost')) {
    throw new Error('Meilisearch não configurado em produção');
  }

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
  // Em produção, não tentar configurar se for localhost (não configurado)
  if (IS_PRODUCTION && MEILISEARCH_HOST.includes('localhost')) {
    console.log('ℹ️ Meilisearch não configurado - busca avançada desabilitada (opcional)');
    return;
  }

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
    console.error('⚠️ Erro ao configurar Meilisearch:', error);
    console.log('ℹ️ Meilisearch é opcional - continuando sem busca avançada');
  }
}
